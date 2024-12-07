#!/usr/bin/env node

// Import MCP server components
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import our configuration and server components
import { SERVER_CONFIG } from "./config.js";
import { setupToolHandlers } from "./handlers.js";
import { ApiEmojikeyService } from "./service.api.js";

// Main server class that coordinates everything
class EmojikeyServer {
  private server: Server; // MCP server instance
  private emojikeyService: ApiEmojikeyService; // Our API service

  constructor() {
    // Initialize the MCP server with our config
    this.server = new Server(
      {
        name: SERVER_CONFIG.NAME,
        version: SERVER_CONFIG.VERSION,
      },
      {
        capabilities: { tools: {} },
      },
    );

    // Create our API service instance
    this.emojikeyService = new ApiEmojikeyService();

    // Set up error handling and handlers
    this.setup();
  }

  // Initialize all server components
  private setup(): void {
    this.setupErrorHandling();
    setupToolHandlers(this.server, this.emojikeyService);
  }

  // Set up error handlers for the server and process
  private setupErrorHandling(): void {
    // Log MCP-specific errors
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  // Start the server using stdio transport
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Emojikey MCP server running on stdio");
  }
}

// Create and start the server
const server = new EmojikeyServer();
server.run().catch(console.error);
