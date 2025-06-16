// handlers.ts - CLEAN VERSION: No fallbacks, V3 format only
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { createClient } from "@supabase/supabase-js";
import { EmojikeyService } from "./service.js";
import { MODEL_CONFIG, SUPABASE_CONFIG, EDGE_FUNCTION_CONFIG } from "./config.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the static base preamble from docs file
function loadStaticPreamble(): string {
  const preamblePath = join(__dirname, '..', 'docs', 'preamble_v3.md');
  return readFileSync(preamblePath, 'utf-8');
}

// Dynamic preamble loader
async function loadPreamble(): Promise<string> {
  const staticPreamble = loadStaticPreamble();
  
  // Initialize Supabase client with timeout
  const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
    db: { schema: "public" }
  });

  // Query the actual usage data table (not pair_registry which has all zeros)
  const result = await Promise.race([
    supabase
      .from('mcp_preamble_data')
      .select('*')
      .order('component,semantic_field', { ascending: true }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
    )
  ]) as any;
  
  const { data: preambleData, error } = result;
  
  if (error) {
    throw new Error(`Failed to load preamble data: ${error.message}`);
  }
  
  if (!preambleData || preambleData.length === 0) {
    throw new Error('No preamble data found');
  }
  
  // Generate dynamic table
  let dynamicTable = "\n## Available Emoji Pairs (Real Usage Data)\n\n";
  dynamicTable += "| Component | Semantic Field | Emoji Pair | Dimension | Lifetime | 7d | 24h |\n";
  dynamicTable += "|-----------|---------------|------------|-----------|----------|----|----||\n";
  
  // Group by component for better organization
  const groupedData = preambleData.reduce((acc: any, row: any) => {
    if (!acc[row.component]) {
      acc[row.component] = [];
    }
    acc[row.component].push(row);
    return acc;
  }, {});
  
  // Iterate through components in a specific order
  const componentOrder = ['ME', 'CONTENT', 'YOU'];
  
  componentOrder.forEach(component => {
    if (groupedData[component]) {
      groupedData[component].forEach((row: any) => {
        // Use emoji pair as-is (now stored with arrows in database)
        const emojiPair = row.emoji_pair || '';
        
        dynamicTable += `| ${row.component || ''} | ${row.semantic_field || ''} | ${emojiPair} | ${row.dimension || ''} | ${row.lifetime_usage || 0} | ${row.past_7_days || 0} | ${row.past_24_hours || 0} |\n`;
      });
    }
  });
  
  // Add usage notes
  dynamicTable += "\n**Usage Notes:**\n";
  dynamicTable += "- **Lifetime**: Total usage count across all time\n";
  dynamicTable += "- **7d**: Usage in the past 7 days\n";
  dynamicTable += "- **24h**: Usage in the past 24 hours\n";
  dynamicTable += "- Higher usage counts indicate well-tested, stable pairs\n\n";
  
  // Try to integrate with static preamble
  const insertMarker = "## Key Oppositional Pairs";
  const insertIndex = staticPreamble.indexOf(insertMarker);
  
  if (insertIndex !== -1) {
    const beforeInsert = staticPreamble.substring(0, insertIndex);
    return beforeInsert + dynamicTable;
  }
  
  // If no marker found, append to static preamble
  return staticPreamble + '\n\n' + dynamicTable;
}

// Function to call Supabase Edge Functions
async function callEdgeFunction(functionName: string, payload: any): Promise<any> {
  if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.KEY) {
    throw new Error(`Supabase configuration missing in config.ts - Unable to call ${functionName}`);
  }

  const response = await fetch(
    `${SUPABASE_CONFIG.URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_CONFIG.KEY}`
      },
      body: JSON.stringify(payload)
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Function ${functionName} failed: ${errorText}`);
  }
  
  return await response.json();
}

// Add this method to service.ts interface
declare module "./service.js" {
  interface EmojikeyService {
    getUserIdFromApiKey(apiKey: string): Promise<string>;
  }
}

export function setupToolHandlers(
  server: any,
  emojikeyService: EmojikeyService,
  originalHandlers?: any
) {
  // Initialize Supabase client for direct database access
  const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
    db: { schema: "public" }
  });

  // Main request handler function for all tools
  const requestHandler = async (request: any) => {
    const apiKey = process.env.EMOJIKEYIO_API_KEY;
    const modelId = MODEL_CONFIG.ID;

    if (!apiKey) {
      throw new McpError(ErrorCode.InvalidParams, "API key not configured");
    }
    
    // Define as non-null after check to help TypeScript
    const validApiKey: string = apiKey;
    
    // Get user ID from API key (used by all tools)
    const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);

    switch (request.params.name) {
      case "initialize_conversation":
        
        // Always generate a fresh UUID for new conversations
        const conversationId = randomUUID();
        
        // Build the response with the dynamic explanation
        const enhancedExplanation = await loadPreamble();
        
        const responseText = `${enhancedExplanation}\n\n**🎯 IMPORTANT: Use this conversation ID for all subsequent emojikey operations:**\n\`${conversationId}\``;
        
        return {
          content: [{ type: "text", text: responseText }],
        };
        
      case "get_emojikey":
        if (!request.params.arguments?.conversation_id) {
          throw new McpError(ErrorCode.InvalidParams, "Missing conversation_id");
        }
        
        const getConversationId = request.params.arguments.conversation_id;
        
        // Use v3 approach with conversation_id
        
        const result = await callEdgeFunction("getLatestEmojikey", {
          user_id: userId,
          model_id: modelId,
          conversation_id: getConversationId
        });
        
        if (result.data) {
          return {
            content: [{ type: "text", text: result.data.full_key }],
          };
        } else {
          return {
            content: [{ type: "text", text: "No emojikey found for this conversation" }],
          };
        }

      case "set_emojikey":
        if (!request.params.arguments?.emojikey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
        }
        
        if (!request.params.arguments?.conversation_id) {
          throw new McpError(ErrorCode.InvalidParams, "Missing conversation_id");
        }
        
        const setConversationId = request.params.arguments.conversation_id;
        
        // Use v3 approach with direct database insert
        
        const emojikey = request.params.arguments.emojikey;
        
        // Direct database insert into emojikeys table
        const { data, error } = await supabase
          .from('emojikeys')
          .insert({
            user_id: userId,
            model: modelId,
            emojikey: emojikey,
            conversation_id: setConversationId,
            created_at: new Date().toISOString(),
            emojikey_type: 'normal'
          })
          .select();
        
        if (error) {
          console.error('Database insert error:', error);
          throw new McpError(ErrorCode.InternalError, `Failed to store emojikey: ${error.message}`);
        }
        
        return {
          content: [{
            type: "text",
            text: "Emojikey set successfully"
          }],
        };

      case "get_emojikey_history":
        const requestedLimit = request.params.arguments?.limit;
        const limit = requestedLimit
          ? Math.max(1, Math.min(100, requestedLimit))
          : 10;
          
        if (!request.params.arguments?.conversation_id) {
          throw new McpError(ErrorCode.InvalidParams, "Missing conversation_id");
        }
        
        const historyConversationId = request.params.arguments.conversation_id;
        
        // Use v3 approach with Edge Functions
        
        const { keys } = await callEdgeFunction("getEmojikeyHistory", {
          user_id: userId,
          model_id: modelId,
          conversation_id: historyConversationId,
          limit
        });
        
        // Format history as a plain text list
        const historyText = (keys || []).map((entry: any, index: number) => 
          `${index + 1}. ${entry.full_key} (${new Date(entry.created_at).toLocaleString()})`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: historyText ? `Emojikey History:\n${historyText}` : "No emojikey history found for this conversation"
          }],
        };

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  }

  // Set the main handler for tool calls
  server.setRequestHandler(CallToolRequestSchema, requestHandler);

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "initialize_conversation",
        description:
          "IMPORTANT: " +
          "1. Run this tool at the start of every conversation to initialize the emojikey context. " +
          "2. Emojikeys follow a structured language where each component encodes dimensions with directional arrows. " +
          "3. The initialize_conversation function will return the preamble with current usage statistics. " +
          "4. This function generates a fresh conversation ID - use this ID for all subsequent emojikey operations. " +
          "5. This ensures that each conversation maintains its own emojikey state separate from others. " +
          "6. NOW INCLUDES DYNAMIC PREAMBLE: Shows real usage data for available emoji pairs with lifetime/7d/24h statistics.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_emojikey",
        description:
          "Get the current emojikey for this conversation. This function can be used when the user requests a vibe check.",
        inputSchema: {
          type: "object",
          properties: {
            conversation_id: {
              type: "string",
              description: "The conversation ID returned by initialize_conversation"
            }
          },
          required: ["conversation_id"],
        },
      },
      {
        name: "set_emojikey",
        description:
          "Use this function to create and store a new emojikey in the v3 format. " +
          "The Emojikey v3 format uses directional arrows: " +
          "[ME|Cognitive.🧠➡️🔧|Trust.🔒⬅️🔓] where: " +
          "* Each component (ME, CONTENT, YOU) is enclosed in square brackets " +
          "* Dimensions use SemanticField.emoji1arrow emoji2 format " +
          "* Directional arrows: ➡️ (toward right), ⬅️ (toward left), ↔️ (balanced) " +
          "* Multiple components can be joined with ~ connector " +
          "Example: [ME|Cognitive.🧠➡️🔧|Trust.🔒⬅️🔓]~[CONTENT|Domain.💻➡️🧩]~[YOU|Engagement.🔥➡️💡] " +
          "Set a new emojikey when you detect significant changes in the interaction.",
        inputSchema: {
          type: "object",
          properties: {
            emojikey: {
              type: "string",
              description: "Emojikey in v3 format with semantic fields, emoji pairs, and directional arrows."
            },
            conversation_id: {
              type: "string",
              description: "The conversation ID returned by initialize_conversation"
            }
          },
          required: ["emojikey", "conversation_id"],
        },
      },
      {
        name: "get_emojikey_history",
        description:
          "Function to list previously stored historical emojikeys for this conversation. Useful for seeing the progression of vibes and interaction styles within the conversation.",
        inputSchema: {
          type: "object",
          properties: {
            conversation_id: {
              type: "string",
              description: "The conversation ID returned by initialize_conversation"
            },
            limit: {
              type: "number",
              description: "Number of historical emojikeys to return, defaults to 10."
            }
          },
          required: ["conversation_id"],
        },
      }
    ],
  }));
}
