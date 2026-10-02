const { QueryBusinessLogic, getCurrentSession } = require("./queryBusinessLogic");

/**
 * BaseLLMProvider.js
 * Base Class & Common Orchestration Pipeline for LLM Providers.
 * 
 * Pipeline flow:
 *   1. Check shared Security & Pre-flight Rules (queryBusinessLogic.checkSecurityAndIntent)
 *   2. If allowed, construct standard System Prompt (queryBusinessLogic.buildSystemPrompt)
 *   3. Delegate API call to subclass provider (this.callLLM)
 *   4. If provider fails/times out, seamlessly execute Fallback (queryBusinessLogic.parseRuleFallback)
 *   5. Format response payload via shared Formatter (queryBusinessLogic.formatResponse)
 */
class BaseLLMProvider {
  constructor(config = {}) {
    if (new.target === BaseLLMProvider) {
      throw new TypeError("Cannot instantiate abstract class BaseLLMProvider directly.");
    }
    this.config = config;
    this.providerName = "AI";
    this.modelName = "model";
    this.apiKey = "";
  }

  /**
   * Translates natural language user prompt into a structured query Intent / Tool Call payload.
   * Orchestrates security check -> LLM call -> Fallback parser.
   * @param {string} prompt - User natural text input.
   * @param {Object} context - Optional context (session, userRole, history).
   * @returns {Promise<Object>} Structured query command { collection, operation, filter, projection }.
   */
  async generateQueryIntent(prompt, context = {}) {
    const currentSession = context.session || getCurrentSession();

    // Step 1: Pre-flight Security & Capability Check
    const preCheckResult = QueryBusinessLogic.checkSecurityAndIntent(prompt, context);
    if (preCheckResult) {
      return {
        ...preCheckResult,
        usedLLM: false,
        usedModelName: this.modelName
      };
    }

    // Step 2: Build Standardized Full Prompt
    const fullPrompt = QueryBusinessLogic.buildSystemPrompt(currentSession, prompt, context.history);

    // Step 3: Attempt Live LLM Connectivity
    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        const rawIntent = await this.callLLM(fullPrompt, prompt, context);
        if (rawIntent) {
          if (rawIntent.isRestrictedModule || rawIntent.restrictionMessage) {
            return rawIntent;
          }
          return {
            ...rawIntent,
            usedLLM: true,
            usedModelName: this.modelName
          };
        }
      } catch (llmErr) {
        const errorDetail = llmErr.response?.data?.error?.message || (typeof llmErr.response?.data?.error === "string" ? llmErr.response?.data?.error : null) || llmErr.message;
        console.warn(`[${this.providerName} API Warning]: Live LLM call failed (${llmErr.response?.status || "error"}):`, errorDetail);
        console.warn(`[${this.providerName} Fallback]: Activating shared rule parser.`);
      }
    } else {
      console.warn(`[${this.providerName} Info]: No API key configured. Using shared rule parser.`);
    }

    // Step 4: Fallback to Universal Rule Parser
    const fallbackIntent = QueryBusinessLogic.parseRuleFallback(prompt, currentSession, context.history);
    return {
      ...fallbackIntent,
      usedLLM: false,
      usedModelName: this.modelName
    };
  }

  /**
   * Provider-specific API invocation to be implemented by subclass.
   * @param {string} fullPrompt - Complete prompt with system guidelines and history.
   * @param {string} userPrompt - Original user text.
   * @param {Object} context - Runtime context.
   * @returns {Promise<Object>} Parsed JSON intent from the LLM.
   */
  async callLLM(fullPrompt, userPrompt, context = {}) {
    throw new Error(`Method 'callLLM()' must be implemented by ${this.constructor.name}`);
  }

  /**
   * Formats database query result set into narrative & preview table items.
   * @param {string} prompt - Original user prompt.
   * @param {Array<Object>} dataResults - Raw MongoDB result array.
   * @param {Object} queryMeta - Metadata about the query executed.
   * @returns {Promise<Object>} { summary, previewData, totalCount, offerExport }
   */
  async formatResponse(prompt, dataResults, queryMeta = {}) {
    return QueryBusinessLogic.formatResponse(prompt, dataResults, {
      ...queryMeta,
      providerName: this.providerName,
      modelName: this.modelName
    });
  }
}

module.exports = BaseLLMProvider;
