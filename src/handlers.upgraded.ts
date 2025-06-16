// handlers.ts - Updated for emojikey v3 with conversation ID support, direct database writes, and DYNAMIC PREAMBLE
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";
import { EmojikeyService } from "./service.js";
import { MODEL_CONFIG, SUPABASE_CONFIG, EDGE_FUNCTION_CONFIG } from "./config.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client for dynamic preamble
const supabaseClient = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
  db: { schema: "public" }
});

// Load the static base preamble from docs file
function loadBasePreamble(): string {
  try {
    const preamblePath = join(__dirname, '..', 'docs', 'preamble_v3.md');
    return readFileSync(preamblePath, 'utf-8');
  } catch (error) {
    console.error('Failed to load base preamble, using fallback:', error);
    // Fallback to basic v3 explanation
    return "🌟✨ EMOJIKEY v3.0 SYSTEM INITIALIZED ✨🌟\n\nUse arrow format: [ME|Cognitive.🧠➡️🔧|Trust.🔒⬅️🔓]\n\nDirectional arrows:\n• ➡️ lean toward right emoji\n• ⬅️ lean toward left emoji\n• ↔️ balanced/neutral";
  }
}

// Format emoji pair with arrows
function formatEmojiPair(emojiPair: string): string {
  if (!emojiPair || emojiPair.length < 2) {
    return emojiPair;
  }
  
  // Simple approach: insert ↔️ in the middle
  const mid = Math.floor(emojiPair.length / 2);
  return emojiPair.substring(0, mid) + '↔️' + emojiPair.substring(mid);
}

// Generate dynamic preamble with real usage data
async function generateDynamicPreamble(): Promise<string> {
  try {
    // Query the mcp_preamble_data view
    const { data: preambleData, error } = await supabaseClient
      .from('mcp_preamble_data')
      .select('*')
      .order('component,semantic_field,lifetime_usage', { ascending: false });
    
    if (error) {
      console.error('Error fetching preamble data:', error);
      throw error;
    }
    
    if (!preambleData || preambleData.length === 0) {
      console.warn('No preamble data found, using static fallback');
      return loadBasePreamble();
    }
    
    // Get the base preamble
    const basePreamble = loadBasePreamble();
    
    // Find where to insert the dynamic table (look for "## Key Oppositional Pairs")
    const insertMarker = "## Key Oppositional Pairs";
    const insertIndex = basePreamble.indexOf(insertMarker);
    
    if (insertIndex === -1) {
      console.warn('Could not find insertion point for dynamic table, appending');
      return basePreamble + '\n\n' + generateDynamicTable(preambleData);
    }
    
    // Split the preamble and insert the dynamic table
    const beforeInsert = basePreamble.substring(0, insertIndex);
    
    // Generate the dynamic table
    const dynamicTable = generateDynamicTable(preambleData);
    
    return beforeInsert + dynamicTable;
    
  } catch (error) {
    console.error('Failed to generate dynamic preamble:', error);
    console.warn('Falling back to static preamble');
    return loadBasePreamble();
  }
}

// Generate markdown table from preamble data
function generateDynamicTable(data: any[]): string {
  let markdown = "## Available Emoji Pairs (Real Usage Data)\n\n";
  markdown += "| Component | Semantic Field | Emoji Pair | Dimension | Lifetime | 7d | 24h |\n";
  markdown += "|-----------|---------------|------------|-----------|----------|----|----||\n";
  
  // Group by component for better organization
  const groupedData = data.reduce((acc, row) => {
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
        const formattedPair = formatEmojiPair(row.emoji_pair);
        markdown += `| ${row.component} | ${row.semantic_field} | ${formattedPair} | ${row.dimension} | ${row.lifetime_usage} | ${row.past_7_days} | ${row.past_24_hours} |\n`;
      });
    }
  });
  
  // Add usage notes
  markdown += "\n**Usage Notes:**\n";
  markdown += "- **Lifetime**: Total usage count across all time\n";
  markdown += "- **7d**: Usage in the past 7 days\n";
  markdown += "- **24h**: Usage in the past 24 hours\n";
  markdown += "- Higher usage counts indicate well-tested, stable pairs\n";
  markdown += "- Use any emoji pair format: `Component.emoji1➡️emoji2` or `Component.emoji1⬅️emoji2` or `Component.emoji1↔️emoji2`\n\n";
  
  return markdown;
}

// Updated loadPreamble function that is now async and dynamic
async function loadPreamble(): Promise<string> {
  return await generateDynamicPreamble();
}

// Function to call Supabase Edge Functions
async function callEdgeFunction(functionName: string, payload: any): Promise<any> {
  try {
    // Verify that we have Supabase configuration from config.ts
    if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.KEY) {
      console.error("Supabase configuration is missing or incomplete in config.ts");
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
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
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

    switch (request.params.name) {
      case "initialize_conversation":
        try {
          // Get user ID from API key
          const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
          
          // Generate a new conversation ID
          const conversationId = uuidv4();
          
          try {
            // Get the latest key
            const { key } = await callEdgeFunction("getEmojikeyHistory", {
              user_id: userId,
              model_id: modelId,
              get_recent_key: true
            });
            
            // Get time-aggregated keys (lifetime, 30d, 7d)
            const { aggregated_keys } = await callEdgeFunction("getEmojikeyHistory", {
              user_id: userId,
              model_id: modelId,
              get_aggregated_keys: true
            });
            
            // Build the response with the DYNAMIC explanation and keys
            const enhancedExplanation = await loadPreamble(); // NOW ASYNC AND DYNAMIC!
            
            // Format the latest key
            let keysText = "";
            if (key) {
              keysText += `Latest Key (${new Date(key.created_at).toLocaleDateString()}):\n${key.full_key}\n\n`;
            }
            
            // Format aggregated keys if they exist
            if (aggregated_keys && aggregated_keys.length > 0) {
              keysText += "Aggregated Keys:\n";
              
              // Sort by period type for consistent ordering (lifetime, 30d, 7d, 24h)
              const sortedKeys = [...aggregated_keys].sort((a, b) => {
                const periodOrder: Record<string, number> = { 'lifetime': 0, '90d': 1, '30d': 2, '7d': 3, '24h': 4 };
                const aPeriod = a.period_type as string;
                const bPeriod = b.period_type as string;
                return (periodOrder[aPeriod] || 99) - (periodOrder[bPeriod] || 99);
              });
              
              sortedKeys.forEach((k: any) => {
                if (k.period_type === 'lifetime') {
                  keysText += `Lifetime (all-time): ${k.full_key}\n`;
                } else if (k.period_type === '90d') {
                  keysText += `90-day: ${k.full_key}\n`;
                } else if (k.period_type === '30d') {
                  keysText += `30-day: ${k.full_key}\n`;
                } else if (k.period_type === '7d') {
                  keysText += `7-day: ${k.full_key}\n`;
                } else if (k.period_type === '24h') {
                  keysText += `24-hour: ${k.full_key}\n`;
                }
              });
            }
            
            // If no keys found
            if (!keysText) {
              keysText = "No keys yet";
            }
            
            // Include the conversation ID for use in subsequent calls
            const responseText = 
              `${enhancedExplanation}\n\n` +
              `${keysText}\n` +
              `Conversation ID: ${conversationId}`; // Include the conversation ID
              
            return {
              content: [{ type: "text", text: responseText }],
            };
          } catch (error: any) {
            // Fallback to v2 format if Edge Functions fail
            console.error("Edge function failed, using fallback v2 method:", error);
            
            const enhancedHistory = await emojikeyService.getEnhancedEmojikeyHistory(validApiKey, modelId, 10, 5);
            
            const enhancedExplanation = await loadPreamble(); // Still dynamic even in fallback
            
            // Format superkeys (v2 legacy)
            const superkeysList = enhancedHistory.superkeys.map(sk => 
              `${sk.emojikey} (${new Date(sk.timestamp).toLocaleDateString()})`
            ).join('\n');
            
            // Format regular keys
            const regularKeysList = enhancedHistory.recentKeys.map(k => 
              `${k.emojikey} (${new Date(k.timestamp).toLocaleDateString()})`
            ).join('\n');
            
            // Include the conversation ID
            const responseText = 
              `${enhancedExplanation}\n\n` +
              `Legacy SuperKeys (historical context):\n${superkeysList || "No superkeys yet"}\n\n` +
              `Legacy Recent Keys (current context):\n${regularKeysList || "No regular keys yet"}\n\n` +
              `Conversation ID: ${conversationId}`; // Include the conversation ID
              
            return {
              content: [{ type: "text", text: responseText }],
            };
          }
        } catch (error: any) {
          console.error("Error in initialize_conversation:", error);
          throw new McpError(ErrorCode.InternalError, `Failed to initialize: ${error.message}`);
        }
        
      case "get_emojikey":
        try {
          // Extract conversation ID if provided
          const conversationId = request.params.arguments?.conversation_id;
          
          if (conversationId) {
            // Use v3 approach with conversation_id
            const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
            
            const result = await callEdgeFunction("getLatestEmojikey", {
              user_id: userId,
              model_id: modelId,
              conversation_id: conversationId
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
          } else {
            // Fallback to v2 method
            const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
            return {
              content: [{ type: "text", text: emojikey.emojikey }],
            };
          }
        } catch (error: any) {
          console.error("Error in get_emojikey:", error);
          if (error.message && error.message.includes("Function getLatestEmojikey failed")) {
            // Fallback to v2 method
            const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
            return {
              content: [{ type: "text", text: emojikey.emojikey }],
            };
          }
          throw new McpError(ErrorCode.InternalError, `Failed to get emojikey: ${error.message}`);
        }

      case "set_emojikey":
        if (!request.params.arguments?.emojikey) {
          throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
        }
        
        try {
          // Get conversation ID if provided
          const conversationId = request.params.arguments?.conversation_id;
          
          if (conversationId) {
            // Use v3 approach with direct database insert
            const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
            
            // Format is now [ME|🧠🎨8∠45|🔒🔓9∠60]
            const emojikey = request.params.arguments.emojikey;
            
            // Direct database insert into emojikeys table (this will trigger processing)
            const { data, error } = await supabase
              .from('emojikeys')
              .insert({
                user_id: userId,
                model: modelId,
                emojikey: emojikey,
                conversation_id: conversationId,
                created_at: new Date().toISOString(),
                emojikey_type: 'normal'
              })
              .select();
            
            if (error) {
              console.error('Database insert error:', error);
              throw new McpError(ErrorCode.InternalError, `Failed to store emojikey: ${error.message}`);
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: "Emojikey set successfully"
                },
              ],
            };
          } else {
            // Fallback to v2 method
            // Get count of regular emojikeys since last superkey
            const { count, isSuperKeyTime } = await emojikeyService.getEmojikeyCountSinceLastSuperkey(
              validApiKey,
              modelId
            );
            
            // Set the emojikey
            await emojikeyService.setEmojikey(
              validApiKey,
              modelId,
              request.params.arguments.emojikey,
              "normal" // Explicitly set as normal key
            );
            
            // Determine response message
            let responseMessage = "Emojikey set successfully (legacy v2 mode)";
            
            return {
              content: [
                {
                  type: "text",
                  text: responseMessage
                },
              ],
            };
          }
        } catch (error) {
          console.error("Error in set_emojikey:", error);
          
          // Fallback to v2 method
          await emojikeyService.setEmojikey(
            validApiKey,
            modelId,
            request.params.arguments.emojikey,
            "normal"
          );
          
          return {
            content: [
              {
                type: "text",
                text: "Emojikey set successfully (fallback to legacy mode)"
              },
            ],
          };
        }

      case "get_emojikey_history":
        try {
          const requestedLimit = request.params.arguments?.limit;
          const limit = requestedLimit
            ? Math.max(1, Math.min(100, requestedLimit))
            : 10;
            
          // Get conversation ID if provided
          const conversationId = request.params.arguments?.conversation_id;
          
          if (conversationId) {
            // Use v3 approach with Edge Functions
            const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
            
            const { keys } = await callEdgeFunction("getEmojikeyHistory", {
              user_id: userId,
              model_id: modelId,
              conversation_id: conversationId,
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
          } else {
            // Fallback to v2 method
            const history = await emojikeyService.getEmojikeyHistory(
              validApiKey,
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
                text: historyText ? `Emojikey History (legacy mode):\n${historyText}` : "No emojikey history found"
              }],
            };
          }
        } catch (error) {
          console.error("Error in get_emojikey_history:", error);
          
          // Fallback to v2 method
          const requestedLimit = request.params.arguments?.limit;
          const limit = requestedLimit
            ? Math.max(1, Math.min(100, requestedLimit))
            : 10;
            
          const history = await emojikeyService.getEmojikeyHistory(
            validApiKey,
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
              text: historyText ? `Emojikey History (fallback to legacy mode):\n${historyText}` : "No emojikey history found"
            }],
          };
        }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  }

  // Set the main handler for tool calls
  server.setRequestHandler(CallToolRequestSchema, requestHandler);
  
  // Store original handlers if the container was provided
  if (originalHandlers) {
    originalHandlers.initialize_conversation = async (request: any) => {
      const apiKey = process.env.EMOJIKEYIO_API_KEY;
      const modelId = MODEL_CONFIG.ID;
      
      if (!apiKey) {
        throw new McpError(ErrorCode.InvalidParams, "API key not configured");
      }
      
      // Define as non-null after check to help TypeScript
      const validApiKey: string = apiKey;
      
      try {
        // Get user ID from API key
        const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
        
        // Generate a new conversation ID
        const conversationId = uuidv4();
        
        try {
          // Get the most recent key across all conversations
          const { key, baseline_key } = await callEdgeFunction("getEmojikeyHistory", {
            user_id: userId,
            model_id: modelId,
            get_recent_key: true,
            include_baseline: true
          });
          
          // We'll use this as our starting point for the new conversation
          const mostRecentKey = key ? key.full_key : baseline_key;
          
          // Get time-aggregated keys (lifetime, 30d, 7d)
          const { aggregated_keys } = await callEdgeFunction("getEmojikeyHistory", {
            user_id: userId,
            model_id: modelId,
            get_aggregated_keys: true
          });
          
          // Build the response with the DYNAMIC explanation and keys
          const enhancedExplanation = await loadPreamble(); // DYNAMIC!
          
          // Store the most recent key for this new conversation
          if (mostRecentKey) {
            try {
              await callEdgeFunction("updateEmojikey", {
                emojikey: mostRecentKey,
                user_id: userId,
                model_id: modelId,
                conversation_id: conversationId,
                is_initial: true
              });
            } catch (updateError) {
              console.error("Error storing initial key:", updateError);
              // Continue even if this fails
            }
          }
          
          // Format the latest key
          let keysText = `Starting Key (current state):\n${mostRecentKey || "New relationship - no previous key"}\n\n`;
          
          // Format aggregated keys if they exist
          if (aggregated_keys && aggregated_keys.length > 0) {
            keysText += "Aggregated Keys:\n";
            
            // Sort by period type for consistent ordering (lifetime, 90d, 30d, 7d, 24h)
            const sortedKeys = [...aggregated_keys].sort((a, b) => {
              const periodOrder: Record<string, number> = { 'lifetime': 0, '90d': 1, '30d': 2, '7d': 3, '24h': 4 };
              const aPeriod = a.period_type as string;
              const bPeriod = b.period_type as string;
              return (periodOrder[aPeriod] || 99) - (periodOrder[bPeriod] || 99);
            });
            
            sortedKeys.forEach((k: any) => {
              if (k.period_type === 'lifetime') {
                keysText += `Lifetime (all-time): ${k.full_key}\n`;
              } else if (k.period_type === '90d') {
                keysText += `90-day: ${k.full_key}\n`;
              } else if (k.period_type === '30d') {
                keysText += `30-day: ${k.full_key}\n`;
              } else if (k.period_type === '7d') {
                keysText += `7-day: ${k.full_key}\n`;
              } else if (k.period_type === '24h') {
                keysText += `24-hour: ${k.full_key}\n`;
              }
            });
          }
          
          // Include the conversation ID for use in subsequent calls
          const responseText = 
            `${enhancedExplanation}\n\n` +
            `${keysText}\n` +
            `Conversation ID: ${conversationId}`; // Include the conversation ID
            
          return {
            content: [{ type: "text", text: responseText }],
          };
        } catch (error: any) {
          // Fallback to v2 format if Edge Functions fail
          console.error("Edge function failed, using fallback v2 method:", error);
          
          const enhancedHistory = await emojikeyService.getEnhancedEmojikeyHistory(validApiKey, modelId, 10, 5);
          
          const enhancedExplanation = await loadPreamble(); // Still dynamic
          
          // Format superkeys (v2 legacy)
          const superkeysList = enhancedHistory.superkeys.map(sk => 
            `${sk.emojikey} (${new Date(sk.timestamp).toLocaleDateString()})`
          ).join('\n');
          
          // Format regular keys
          const regularKeysList = enhancedHistory.recentKeys.map(k => 
            `${k.emojikey} (${new Date(k.timestamp).toLocaleDateString()})`
          ).join('\n');
          
          // Include the conversation ID
          const responseText = 
            `${enhancedExplanation}\n\n` +
            `Legacy SuperKeys (historical context):\n${superkeysList || "No superkeys yet"}\n\n` +
            `Legacy Recent Keys (current context):\n${regularKeysList || "No regular keys yet"}\n\n` +
            `Conversation ID: ${conversationId}`; // Include the conversation ID
            
          return {
            content: [{ type: "text", text: responseText }],
          };
        }
      } catch (error: any) {
        console.error("Error in initialize_conversation:", error);
        throw new McpError(ErrorCode.InternalError, `Failed to initialize: ${error.message}`);
      }
    };
    
    originalHandlers.get_emojikey = async (request: any) => {
      const apiKey = process.env.EMOJIKEYIO_API_KEY;
      const modelId = MODEL_CONFIG.ID;
      
      if (!apiKey) {
        throw new McpError(ErrorCode.InvalidParams, "API key not configured");
      }
      
      // Define as non-null after check to help TypeScript
      const validApiKey: string = apiKey;
      
      try {
        // Extract conversation ID if provided
        const conversationId = request.params.arguments?.conversation_id;
        
        if (conversationId) {
          // Use v3 approach with conversation_id
          const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
          
          const result = await callEdgeFunction("getLatestEmojikey", {
            user_id: userId,
            model_id: modelId,
            conversation_id: conversationId
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
        } else {
          // Fallback to v2 method
          const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
          return {
            content: [{ type: "text", text: emojikey.emojikey }],
          };
        }
      } catch (error: any) {
        console.error("Error in get_emojikey:", error);
        if (error.message && error.message.includes("Function getLatestEmojikey failed")) {
          // Fallback to v2 method
          const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
          return {
            content: [{ type: "text", text: emojikey.emojikey }],
          };
        }
        throw new McpError(ErrorCode.InternalError, `Failed to get emojikey: ${error.message}`);
      }
    };
    
    originalHandlers.set_emojikey = async (request: any) => {
      const apiKey = process.env.EMOJIKEYIO_API_KEY;
      const modelId = MODEL_CONFIG.ID;
      
      if (!apiKey) {
        throw new McpError(ErrorCode.InvalidParams, "API key not configured");
      }
      
      // Define as non-null after check to help TypeScript
      const validApiKey: string = apiKey;
      
      if (!request.params.arguments?.emojikey) {
        throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
      }
      
      try {
        // Get conversation ID if provided
        const conversationId = request.params.arguments?.conversation_id;
        
        if (conversationId) {
          // Use v3 approach with direct database insert
          const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
          
          // Format is now [ME|🧠🎨8∠45|🔒🔓9∠60]
          const emojikey = request.params.arguments.emojikey;
          
          // Direct database insert into emojikeys table (this will trigger processing)
          const { data, error } = await supabase
            .from('emojikeys')
            .insert({
              user_id: userId,
              model: modelId,
              emojikey: emojikey,
              conversation_id: conversationId,
              created_at: new Date().toISOString(),
              emojikey_type: 'normal'
            })
            .select();
          
          if (error) {
            console.error('Database insert error:', error);
            throw new McpError(ErrorCode.InternalError, `Failed to store emojikey: ${error.message}`);
          }
          
          return {
            content: [
              {
                type: "text",
                text: "Emojikey set successfully"
              },
            ],
          };
        } else {
          // Fallback to v2 method
          // Get count of regular emojikeys since last superkey
          const { count, isSuperKeyTime } = await emojikeyService.getEmojikeyCountSinceLastSuperkey(
            validApiKey,
            modelId
          );
          
          // Set the emojikey
          await emojikeyService.setEmojikey(
            validApiKey,
            modelId,
            request.params.arguments.emojikey,
            "normal" // Explicitly set as normal key
          );
          
          // Determine response message
          let responseMessage = "Emojikey set successfully (legacy v2 mode)";
          
          return {
            content: [
              {
                type: "text",
                text: responseMessage
              },
            ],
          };
        }
      } catch (error) {
        console.error("Error in set_emojikey:", error);
        
        // Fallback to v2 method
        await emojikeyService.setEmojikey(
          validApiKey,
          modelId,
          request.params.arguments.emojikey,
          "normal"
        );
        
        return {
          content: [
            {
              type: "text",
              text: "Emojikey set successfully (fallback to legacy mode)"
            },
          ],
        };
      }
    };
    
    originalHandlers.get_emojikey_history = async (request: any) => {
      const apiKey = process.env.EMOJIKEYIO_API_KEY;
      const modelId = MODEL_CONFIG.ID;
      
      if (!apiKey) {
        throw new McpError(ErrorCode.InvalidParams, "API key not configured");
      }
      
      // Define as non-null after check to help TypeScript
      const validApiKey: string = apiKey;
      
      try {
        const requestedLimit = request.params.arguments?.limit;
        const limit = requestedLimit
          ? Math.max(1, Math.min(100, requestedLimit))
          : 10;
          
        // Get conversation ID if provided
        const conversationId = request.params.arguments?.conversation_id;
        
        if (conversationId) {
          // Use v3 approach with Edge Functions
          const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
          
          const { keys } = await callEdgeFunction("getEmojikeyHistory", {
            user_id: userId,
            model_id: modelId,
            conversation_id: conversationId,
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
        } else {
          // Fallback to v2 method
          const history = await emojikeyService.getEmojikeyHistory(
            validApiKey,
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
              text: historyText ? `Emojikey History (legacy mode):\n${historyText}` : "No emojikey history found"
            }],
          };
        }
      } catch (error) {
        console.error("Error in get_emojikey_history:", error);
        
        // Fallback to v2 method
        const requestedLimit = request.params.arguments?.limit;
        const limit = requestedLimit
          ? Math.max(1, Math.min(100, requestedLimit))
          : 10;
          
        const history = await emojikeyService.getEmojikeyHistory(
          validApiKey,
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
            text: historyText ? `Emojikey History (fallback to legacy mode):\n${historyText}` : "No emojikey history found"
          }],
        };
      }
    };
  }

  // List tools handler with updated descriptions for conversation ID support
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "initialize_conversation",
        description:
          "IMPORTANT: " +
          "1. Run this tool at the start of every conversation to initialize the emojikey context. " +
          "2. Emojikeys follow a structured language where each component encodes dimensions with magnitude and phase angle. " +
          "3. The initialize_conversation function will return recent keys and a unique conversation ID. " +
          "4. You must use the returned conversation ID in all subsequent emojikey operations in this conversation. " +
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
              description: "The conversation ID provided by initialize_conversation"
            }
          },
          required: ["conversation_id"],
        },
      },
      {
        name: "set_emojikey",
        description:
          "Use this function to create and store a new emojikey in the v3 format. " +
          "The Emojikey v3 format uses: " +
          "[ME|🧠🎨8∠45|🔒🔓9∠60] where: " +
          "* Each component (ME, CONTENT, YOU) is enclosed in square brackets " +
          "* Dimensions are separated by pipes (|) " +
          "* Each dimension has emoji pairs followed by magnitude (0-9) and angle (0-180°) " +
          "* Multiple components can be joined with ~ connector " +
          "Example: [ME|🧠🎨8∠45|🔒🔓9∠60]~[CONTENT|💻🧩9∠15|🌱🌳7∠30]~[YOU|🎓🌱8∠35|🔥💤9∠10] " +
          "Set a new emojikey when you detect significant changes in the interaction.",
        inputSchema: {
          type: "object",
          properties: {
            emojikey: {
              type: "string",
              description: "Emojikey in v3 format with components, dimensions, magnitude and phase angles."
            },
            conversation_id: {
              type: "string",
              description: "The conversation ID provided by initialize_conversation"
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
              description: "The conversation ID provided by initialize_conversation"
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