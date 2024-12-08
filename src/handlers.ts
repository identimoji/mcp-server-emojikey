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

    if (!apiKey) {
      throw new McpError(ErrorCode.InvalidParams, "API key not configured");
    }

    switch (request.params.name) {
      case "initialize_conversation":
      case "get_emojikey":
        const emojikey = await emojikeyService.getEmojikey(apiKey, modelId);
        return {
          content: [{ type: "text", text: JSON.stringify(emojikey, null, 2) }],
        };

      case "set_emojikey":
        if (!request.params.arguments?.emojikey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
        }
        await emojikeyService.setEmojikey(
          apiKey,
          modelId,
          request.params.arguments.emojikey,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { message: "Emojikey set successfully" },
                null,
                2,
              ),
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
        return {
          content: [{ type: "text", text: JSON.stringify(history, null, 2) }],
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
          "IMPORTANT: Run this tool at the start of every conversation to initialize the emojikey context",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_emojikey",
        description: "Get the current emojikey when user requests a vibe check",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "set_emojikey",
        description: "Set a new emojikey to update the conversation context",
        inputSchema: {
          type: "object",
          properties: {
            emojikey: {
              type: "string",
              description: "emoji sequence representing conversation context",
            },
          },
          required: ["emojikey"],
        },
      },
      {
        name: "get_emojikey_history",
        description: "Get the a list of previous emojikeys",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of historical emojikeys to return",
            },
          },
          required: [],
        },
      },
    ],
  }));
}
