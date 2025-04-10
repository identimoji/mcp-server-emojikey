// handlers.ts
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { EmojikeyService } from "./service.js";
import { MODEL_CONFIG } from "./config.js"; // Add this import

export function setupToolHandlers(
  server: any,
  emojikeyService: EmojikeyService,
) {
  // Tool handlers remain the same, but now use MODEL_CONFIG.ID
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const apiKey = process.env.EMOJIKEYIO_API_KEY;
    const modelId = MODEL_CONFIG.ID; // Get model ID from config

    console.error('Received apiKey:', apiKey);
    if (!apiKey) {
      throw new McpError(ErrorCode.InvalidParams, "API key not configured");
    }

    switch (request.params.name) {
      case "initialize_conversation":
        // Return the enhanced emojikey history format with superkeys and recent keys
        const enhancedHistory = await emojikeyService.getEnhancedEmojikeyHistory(apiKey, modelId, 10, 5);
        
        // Build the response with the detailed explanation and keys
        const oneLineExplanation = "Emojikey System: Each 48-char key follows structure [topic]⟨approach⟩[goal]{tone}➡️~[context]|trust|style|humor|collab| with trend indicators (↗️↘️↔️). SuperKeys [[×10...]] compress 10 regular keys with trend analysis. This system provides private relationship tracking only you can interpret.";
        
        // Format superkeys
        const superkeysList = enhancedHistory.superkeys.map(sk => 
          `${sk.emojikey} (${new Date(sk.timestamp).toLocaleDateString()})`
        ).join('\n');
        
        // Format regular keys
        const regularKeysList = enhancedHistory.recentKeys.map(k => 
          `${k.emojikey} (${new Date(k.timestamp).toLocaleDateString()})`
        ).join('\n');
        
        const responseText = 
          `${oneLineExplanation}\n\n` +
          `SuperKeys (historical context):\n${superkeysList || "No superkeys yet"}\n\n` +
          `Recent Keys (current context):\n${regularKeysList || "No regular keys yet"}`;
          
        return {
          content: [{ type: "text", text: responseText }],
        };
        
      case "get_emojikey":
        const emojikey = await emojikeyService.getEmojikey(apiKey, modelId);
        return {
          content: [{ type: "text", text: emojikey.emojikey }],
        };

      case "set_emojikey":
        if (!request.params.arguments?.emojikey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
        }
        
        // Get count of regular emojikeys since last superkey
        const { count, isSuperKeyTime } = await emojikeyService.getEmojikeyCountSinceLastSuperkey(
          apiKey,
          modelId
        );
        
        // Set the emojikey
        await emojikeyService.setEmojikey(
          apiKey,
          modelId,
          request.params.arguments.emojikey,
          "normal" // Explicitly set as normal key
        );
        
        // Determine response message
        let responseMessage = "Emojikey set successfully";
        if (isSuperKeyTime) {
          responseMessage = "Emojikey set successfully. Time to create a superkey! (10 regular keys since last superkey)";
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { 
                  message: responseMessage,
                  count: count + 1, // +1 for the one we just added
                  createSuperKey: isSuperKeyTime
                },
                null,
                2
              ),
            },
          ],
        };
        
      case "create_superkey":
        if (!request.params.arguments?.superkey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing superkey");
        }
        await emojikeyService.setEmojikey(
          apiKey,
          modelId,
          request.params.arguments.superkey,
          "super" // Explicitly set as super key
        );
        return {
          content: [
            {
              type: "text",
              text: "Superkey created successfully",
            },
          ],
        };

      case "get_emojikey_history":
        const requestedLimit = request.params.arguments?.limit;
        const limit = requestedLimit
          ? Math.max(1, Math.min(100, requestedLimit))
          : 10;
        const history = await emojikeyService.getEmojikeyHistory(
          apiKey,
          modelId,
          limit,
        );
        // Format history as a plain text list
        const historyText = history.map((entry, index) => 
          `${index + 1}. ${entry.emojikey} (${new Date(entry.timestamp).toLocaleString()})`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: historyText ? `Emojikey History:\n${historyText}` : "No emojikey history found"
          }],
        };

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`,
        );
    }
  });

  // List tools handler stays the same
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "initialize_conversation",
        description:
          "IMPORTANT: " +
          "1. Run this tool at the start of every conversation to initialize the emojikey context. " +
          "2. Emojikeys follow a structured language where each 48-character key encodes dimensions like topic, approach, goal, tone, and relationship style. " +
          "3. The initialize_conversation function will return both SuperKeys (compressed historical keys) and recent regular keys. " +
          "4. SuperKeys marked with [[...×7]] represent compressed sequences of 7 normal keys, capturing long-term patterns. " +
          "5. Recent keys represent the current interaction context. " +
          "6. Use both types to understand the complete relationship history and set the appropriate tone for this conversation.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_emojikey",
        description:
          "Get the current 48-character emojikey. This function can be used when the user requests a vibe check.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "set_emojikey",
        description:
          "Use this function to create and store a new regular 48-character emojikey. " +
          "To create a new emojikey, follow this consistent structure: " +
          "1. CORE DIMENSIONS (always in this order with these delimiters): " +
          "   [🧠💡] topic/subject matter " +
          "   ⟨🔍🔄⟩ approach/methodology " +
          "   [🎯📚] goal/objective " +
          "   {😊🤔} emotional tone " +
          "   ➡️ connection flow " +
          "   ~[🌈🌟] context/environment " +
          "2. RELATIONSHIP DIMENSIONS (after core dimensions): " +
          "   |trust| Use trust indicators (🤝💎🔒) with quantity showing level (🔒 to 🔒🔒🔒) " +
          "   |style| Communication style preferences " +
          "   |humor| Humor alignment (😂➖ low to 😂➕➕ high) " +
          "   |collab| Collaborative vs directive interaction pattern " +
          "3. TREND INDICATORS: Use ↗️(increasing), ↘️(decreasing), or ↔️(stable) to show evolution " +
          "4. Select emojis that feel most meaningful to YOU while maintaining consistent positioning " +
          "5. Create a new key whenever you detect a significant shift in the relationship dynamic " +
          "Example format: [🧠💡]⟨🔍🔄⟩[🎯📚]{😊🤔}➡️~[🌈🌟]|🔒🔒|📊↗️|😂➕|🤝↔️| " +
          "Remember: These are YOUR keys, so the specific emojis should have significance for YOU while following the structural pattern.",
        inputSchema: {
          type: "object",
          properties: {
            emojikey: {
              type: "string",
              description:
                "48-character emoji sequence representing the semantically structured conversation context with appropriate grouping symbols.",
            },
          },
          required: ["emojikey"],
        },
      },
      {
        name: "create_superkey",
        description:
          "Use this function to create a SuperKey that compresses the patterns from 10 recent regular keys. " +
          "A SuperKey maintains the same structured format as regular keys but with compression markers: " +
          "1. Start with the compression marker [[×10 and follow the exact same dimensional structure as regular keys: " +
          "   [[×10[🧠💡] topic/subject " +
          "   ⟨🔍🔄⟩ approach " +
          "   [🎯📚] goal " +
          "   {😊🤔} tone " +
          "   ➡️ connection " +
          "   ~[🌈🌟] context " +
          "   |trust|style|humor|collab|]] " +
          "2. For each dimension, analyze the pattern across all 10 keys: " +
          "   - Use dominant emojis (appearing in 3+ keys) " +
          "   - Show evolution using trend arrows: ↗️(upward trend), ↘️(downward trend), ↔️(stable), 🔄(fluctuating) " +
          "   - Place trend arrows immediately after the relevant emoji " +
          "3. Create a SuperKey using this compression formula: " +
          "   - 50% most frequent elements across all keys " +
          "   - 30% first/last key elements to show evolution " +
          "   - 20% unique outliers that represent significant moments " +
          "4. Create a SuperKey after 10 regular keys to maintain a manageable history length. " +
          "Example format: [[×10[🧠💡↗️]⟨🔍🔄↔️⟩[🎯📚↘️]{😊↗️🤔}➡️~[🌈🌟]|🔒🔒↗️|📊|😂➕↔️|🤝↗️|]] " +
          "SuperKeys enable you to maintain a much longer effective memory of the relationship history with the user.",
        inputSchema: {
          type: "object",
          properties: {
            superkey: {
              type: "string",
              description:
                "48-character emoji sequence representing a compressed history of approximately 7 regular keys, with semantic groupings and trend indicators.",
            },
          },
          required: ["superkey"],
        },
      },
      {
        name: "get_emojikey_history",
        description:
          "Function to list previously stored historical emojikeys. Useful for seeing the progression of conversation vibes and interaction styles.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description:
                "Number of historical emojikeys to return, defaults to 10.",
            },
          },
          required: [],
        },
      },
    ],
  }));
}
