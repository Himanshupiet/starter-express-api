const GeminiProvider = require("./providers/GeminiProvider");
const OpenAIProvider = require("./providers/OpenAIProvider");

/**
 * LLMProviderFactory.js
 * Factory for creating the active LLM Provider adapter dynamically.
 * Configured via process.env.LLM_PROVIDER ('gemini' | 'openai' | 'anthropic' | 'ollama').
 */
class LLMProviderFactory {
  /**
   * Get an instance of the configured LLM provider.
   * @param {string} [overrideProvider] - Optional runtime provider override.
   * @param {Object} [config] - Provider initialization options.
   * @returns {BaseLLMProvider} The instantiated LLM provider adapter.
   */
  static getProvider(overrideProvider = null, config = {}) {
    const providerName = (overrideProvider || process.env.LLM_PROVIDER || "gemini").toLowerCase().trim();

    switch (providerName) {
      case "openai":
      case "gpt4":
      case "gpt4o":
        return new OpenAIProvider(config);

      case "gemini":
      case "google":
      default:
        return new GeminiProvider(config);
    }
  }
}

module.exports = LLMProviderFactory;
