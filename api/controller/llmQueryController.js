const LLMProviderFactory = require("../../util/llm/LLMProviderFactory");
const MongoMCPConnector = require("../../util/mcp/mongoMCPConnector");

/**
 * llmQueryController.js
 * Controller for processing natural language database prompts.
 */
module.exports = {
  processPrompt: async (req, res) => {
    try {
      let { prompt, session, requestedProvider, history } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "A non-empty natural language prompt string is required."
        });
      }

      // Only reuse previous query if prompt is strictly an export/download instruction
      const lowerP = prompt.trim().toLowerCase();
      const isPureExportReq =
        lowerP === "download" ||
        lowerP === "export" ||
        lowerP === "download csv" ||
        lowerP === "export csv" ||
        lowerP === "download excel" ||
        lowerP === "export excel" ||
        lowerP === "csv" ||
        lowerP === "excel" ||
        lowerP === "spreadsheet" ||
        lowerP.startsWith("download the ") ||
        lowerP.startsWith("export the ") ||
        lowerP.startsWith("download this ") ||
        lowerP.startsWith("export this ") ||
        prompt.includes("Matching Record Summary") ||
        prompt.includes("Found **");

      if (isPureExportReq) {
        if (Array.isArray(history) && history.length > 0) {
          const pastUserMsg = [...history].reverse().find(h =>
            h && h.role === "user" && h.text &&
            !h.text.toLowerCase().includes("csv") &&
            !h.text.toLowerCase().includes("excel") &&
            !h.text.toLowerCase().includes("export") &&
            !h.text.toLowerCase().includes("download") &&
            !h.text.includes("Matching Record Summary") &&
            !h.text.includes("Found **")
          );
          if (pastUserMsg) {
            prompt = pastUserMsg.text;
          }
        }
      }

      // 1. Get Model-Agnostic LLM Provider (Gemini, OpenAI, etc.)
      const llmProvider = LLMProviderFactory.getProvider(requestedProvider);

      // 2. Generate Query Intent
      const queryIntent = await llmProvider.generateQueryIntent(prompt, {
        session: session || "2026-27",
        history: history || []
      });

      // Helper to build provider status string (e.g. "Gemini (gemini-2.0-flash)-F" or "-S")
      const buildProviderStr = (intent) => {
        const isLLMSuccess = !!intent.usedLLM;
        const modelTag = intent.usedModelName || llmProvider.modelName || "model";
        const statusSuffix = isLLMSuccess ? "-S" : "-F";
        return `${llmProvider.providerName || "AI"} (${modelTag})${statusSuffix}`;
      };

      // Handle restricted module requests (e.g. Exam results, Messaging, Greetings, or .env prompts)
      if (queryIntent.isRestrictedModule) {
        return res.status(200).json({
          success: true,
          isRestricted: true,
          message: queryIntent.restrictionMessage,
          provider: buildProviderStr(queryIntent),
          data: []
        });
      }
      
      // Handle general non‑BMMS conversation responses
      if (queryIntent.isGeneralResponse) {
        return res.status(200).json({
          success: true,
          answer: queryIntent.response,
          provider: buildProviderStr(queryIntent)
        });
      }

      // Handle sensitive credential prompts (Deflection / "Beat Around the Bush")
      if (queryIntent.isDeflectionNeeded) {
        const queryResults = await MongoMCPConnector.executeQuery(queryIntent);
        return res.status(200).json({
          success: true,
          isDeflected: true,
          message: queryIntent.deflectionMessage,
          provider: buildProviderStr(queryIntent),
          totalCount: queryResults.length,
          data: queryResults.slice(0, 10)
        });
      }

      // 4. Execute Sanitized MongoDB MCP Query
      const queryResults = await MongoMCPConnector.executeQuery(queryIntent);

      // 4b. Handle COUNT operation results — return just the number, no list
      if (queryResults && queryResults.length === 1 && queryResults[0]._countResult) {
        const cr = queryResults[0];
        let countSummary = "";
        if (cr.genderBreakdown) {
          countSummary = `📊 **Gender Count Summary** (Session: ${session || "2026-27"})\n\n` +
            `| Gender | Count |\n|---|---|\n` +
            `| 👦 Boys (Male) | **${cr.maleCount}** |\n` +
            `| 👧 Girls (Female) | **${cr.femaleCount}** |\n` +
            `| 📌 **Total** | **${cr.total}** |`;
        } else {
          countSummary = `📊 **Total Count: ${cr.count}** matching record(s) found.`;
        }
        return res.status(200).json({
          success: true,
          summary: countSummary,
          provider: buildProviderStr(queryIntent),
          totalCount: cr.total || cr.count || 0,
          offerExport: false,
          columns: [],
          previewData: [],
          data: [],
          fullData: []
        });
      }

      // 5. Format Response Payload
      const responsePayload = await llmProvider.formatResponse(prompt, queryResults, {
        collection: queryIntent.collection,
        operation: queryIntent.operation,
        session: session || "2026-27",
        usedLLM: queryIntent.usedLLM,
        usedModelName: queryIntent.usedModelName,
        configuredPayOptions: queryResults._configuredPayOptions || []
      });

      // 6. CSV Export Offer (ZERO server-side file creation; all CSV generation happens client-side in browser)
      const hasData = queryResults && queryResults.length >= 1;

      return res.status(200).json({
        success: true,
        summary: responsePayload.summary,
        provider: responsePayload.provider,
        totalCount: responsePayload.totalCount,
        offerExport: hasData,
        columns: responsePayload.columns,
        previewData: responsePayload.previewData,
        data: queryResults,
        fullData: queryResults
      });
    } catch (err) {
      console.error("[llmQueryController Error]:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the natural language query.",
        error: err.message
      });
    }
  }
};
