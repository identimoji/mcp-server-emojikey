import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { EmojikeyService } from "./service.js";

// TODO: If local storage of emojikey ios desired, add MCP resource-handlers here.

// Set up all MCP tool-related handlers
export function setupToolHandlers(
  server: any,
  emojikeyService: EmojikeyService,
) {
  // List available tools (only need this once)
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "initialize_conversation",
        description:
          "IMPORTANT: Run this tool at the start of every conversation to initialize the emojikey context",
        inputSchema: {
          type: "object",
          properties: {}, // No parameters needed!
          required: [],
        },
      },
      {
        name: "get_emojikey",
        description: "Get the current emojikey when user requests a vibe check",
        inputSchema: {
          type: "object",
          properties: {}, // No parameters needed!
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
    ],
  }));

  // Handle the actual tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const userId = "default"; // Or however you want to handle this
    const modelId = "default"; // Or however you want to handle this

    switch (request.params.name) {
      case "initialize_conversation":
      case "get_emojikey":
        const emojikey = await emojikeyService.getEmojikey(userId, modelId);
        return {
          content: [{ type: "text", text: JSON.stringify(emojikey, null, 2) }],
        };

      case "set_emojikey":
        if (!request.params.arguments?.emojikey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
        }
        await emojikeyService.setEmojikey(
          userId,
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

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`,
        );
    }
  });
}
