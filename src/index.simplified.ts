#!/usr/bin/env node

// Import MCP server components
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import our configuration and server components
import { SERVER_CONFIG } from "./config.js";
import { setupToolHandlers } from "./handlers.js";
import { SupabaseEmojikeyService } from "./service.supabase.js";

// Main server class that coordinates everything
class EmojikeyServer {
  private server: Server;
  private emojikeyService: SupabaseEmojikeyService;

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

    // Create our Supabase storage service instance
    this.emojikeyService = new SupabaseEmojikeyService();

    // Set up error handling and handlers
    this.setup();
  }

  private setup(): void {
    this.setupErrorHandling();
    
    // Set up the handlers without coding features
    setupToolHandlers(this.server, this.emojikeyService);
    
    console.error("Emojikey server initialized (simplified version)");
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
    console.error("Emojikey MCP server running on stdio (simplified version)");
  }
}

// Create and start the server
const server = new EmojikeyServer();
server.run().catch(console.error);