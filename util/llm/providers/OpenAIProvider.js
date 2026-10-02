const BaseLLMProvider = require("../BaseLLMProvider");
const axios = require("axios");

/**
 * OpenAIProvider.js
 * Connectivity-only adapter for OpenAI API (GPT-4o / GPT-4o-mini).
 * All domain business logic, security policies, and fallback parsing are handled by BaseLLMProvider & QueryBusinessLogic.
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    this.providerName = "OpenAI";
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.modelName = config.modelName || process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  /**
   * Dispatches the prompt to OpenAI Chat Completions API and returns parsed JSON intent.
   * @param {string} fullPrompt - Complete prompt including schema guidelines.
   * @returns {Promise<Object>} Structured query intent JSON.
   */
  async callLLM(fullPrompt) {
    if (!this.apiKey) return null;

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: this.modelName,
        messages: [{ role: "system", content: fullPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const rawText = res.data?.choices?.[0]?.message?.content;
    if (!rawText) return null;

    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[OpenAI API Parse Warning]: Response was not valid JSON:", rawText);
      return null;
    }
  }
}

module.exports = OpenAIProvider;
