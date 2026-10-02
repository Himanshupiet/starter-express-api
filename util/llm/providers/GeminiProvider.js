const BaseLLMProvider = require("../BaseLLMProvider");
const axios = require("axios");

let cachedWorkingModel = null;
let dynamicCandidates = null; // Populated at first call via /v1beta/models discovery
let dynamicCandidatesExpiry = 0; // Re-discover every 10 minutes

/**
 * GeminiProvider.js
 * Connectivity-only adapter for Google Gemini LLM API.
 * Dynamically discovers available models at runtime and picks mid-level flash models.
 * All domain business logic, security policies, and fallback parsing are handled by BaseLLMProvider & QueryBusinessLogic.
 */
class GeminiProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    this.providerName = "Gemini";
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

    // Static fallback list (used only if model discovery fails)
    this.staticFallbackModels = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-8b",
      "gemini-2.0-flash-exp"
    ];

    const rawModel = (config.modelName || process.env.GEMINI_MODEL || "").trim();
    this.modelName = rawModel || this.staticFallbackModels[0];
  }

  /**
   * Fetches the list of available Gemini models from the API,
   * filters for mid-level generative flash/pro models,
   * and returns them ranked by preference (flash > pro-lite > lite).
   * Results are cached for 10 minutes.
   */
  async discoverModels() {
    const now = Date.now();
    if (dynamicCandidates && now < dynamicCandidatesExpiry) {
      return dynamicCandidates; // Use cached list
    }

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
      const res = await axios.get(listUrl, { timeout: 8000 });
      const allModels = (res.data?.models || [])
        .map(m => m.name?.replace("models/", "").trim())
        .filter(name => name && name.startsWith("gemini"));

      // Score each model — prefer mid-level flash, avoid experimental/preview/vision/embedding
      const score = (name) => {
        if (/embed|vision|aqa|guard|nano/i.test(name)) return -1; // exclude
        if (/preview|exp\b|experimental/i.test(name)) return 1;
        if (/lite|8b/i.test(name)) return 2;
        if (/flash/i.test(name) && !/pro/i.test(name)) return 5;  // pure flash = best mid-level
        if (/flash.*pro|pro.*flash/i.test(name)) return 4;
        if (/pro/i.test(name) && !/ultra/i.test(name)) return 3;
        return 1;
      };

      const ranked = allModels
        .filter(name => score(name) > 0)
        .sort((a, b) => {
          const scoreDiff = score(b) - score(a);
          if (scoreDiff !== 0) return scoreDiff;
          // Among equal scores, prefer higher version numbers
          const verA = parseFloat((a.match(/(\d+\.\d+|\d+)/) || [0])[0]);
          const verB = parseFloat((b.match(/(\d+\.\d+|\d+)/) || [0])[0]);
          return verB - verA;
        })
        .slice(0, 6); // Keep top 6 candidates

      if (ranked.length > 0) {
        dynamicCandidates = ranked;
        dynamicCandidatesExpiry = now + 10 * 60 * 1000; // Cache for 10 minutes
        console.log(`[Gemini Model Discovery] Available mid-level models: ${ranked.join(", ")}`);
        return ranked;
      }
    } catch (err) {
      console.warn(`[Gemini Model Discovery] Failed to discover models: ${err.message}. Using static fallback list.`);
    }

    return this.staticFallbackModels;
  }

  /**
   * Dispatches the prompt to Google Gemini's REST API and returns parsed JSON intent.
   * @param {string} fullPrompt - Complete prompt including schema guidelines.
   * @returns {Promise<Object>} Structured query intent JSON.
   */
  async callLLM(fullPrompt) {
    // Discover available models dynamically on first call (or after cache expires)
    const candidates = await this.discoverModels();

    // Use cached working model if still in the discovered list, otherwise pick top candidate
    let modelToUse = (cachedWorkingModel && candidates.includes(cachedWorkingModel))
      ? cachedWorkingModel
      : candidates[0];

    let apiRes = null;

    // 1. Direct call using primary / cached model (15s timeout)
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`;
      apiRes = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        },
        { timeout: 15000 }
      );
      cachedWorkingModel = modelToUse;
      console.log(`[Gemini API] Success with model: ${modelToUse}`);
    } catch (primaryErr) {
      const status = primaryErr.response?.status;
      const isQuota = status === 429 || primaryErr.message?.includes("Quota") || primaryErr.message?.includes("429");
      console.warn(`[Gemini API Info] Primary model '${modelToUse}' failed (status: ${status || primaryErr.message}).`);
      cachedWorkingModel = null;

      if (isQuota) {
        throw primaryErr; // Rate limit — activate rule parser fallback immediately
      }

      // 2. Failover through remaining discovered candidates
      for (const mName of candidates) {
        if (mName === modelToUse) continue;
        try {
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${this.apiKey}`;
          apiRes = await axios.post(
            fallbackUrl,
            {
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { response_mime_type: "application/json" }
            },
            { timeout: 10000 }
          );
          if (apiRes && apiRes.data) {
            cachedWorkingModel = mName;
            this.modelName = mName;
            console.log(`[Gemini API Info] Successfully failed over to model: ${mName}`);
            break;
          }
        } catch (retryErr) {
          console.warn(`[Gemini API Info] Fallback model '${mName}' failed:`, retryErr.message);
          if (retryErr.response?.status === 429) break;
        }
      }

      if (!apiRes) throw primaryErr;
    }

    const rawText = apiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[Gemini API Parse Warning]: Response was not valid JSON, raw text:", rawText);
      return null;
    }
  }
}

module.exports = GeminiProvider;
