#!/usr/bin/env node

// Import MCP server components
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import our configuration and server components
import { SERVER_CONFIG } from "./config.js";
import { setupToolHandlers } from "./handlers.js";
import { LocalEmojikeyService } from "./service.local.js";

// Main server class that coordinates everything
class EmojikeyServer {
  private server: Server;
  private emojikeyService: LocalEmojikeyService;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.NAME,
        version: SERVER_CONFIG.VERSION,
      },
      {
        capabilities: { tools: {} },
      },
    );

    // Create our local storage service instance
    this.emojikeyService = new LocalEmojikeyService();

    // Set up error handling and handlers
    this.setup();
  }

  private setup(): void {
    this.setupErrorHandling();
    setupToolHandlers(this.server, this.emojikeyService);
  }

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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Emojikey MCP server running on stdio");
  }
}

// Create and start the server
const server = new EmojikeyServer();
server.run().catch(console.error);