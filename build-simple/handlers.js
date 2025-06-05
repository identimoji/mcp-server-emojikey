// handlers.ts - Updated for emojikey v3 with conversation ID support
import { ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from 'uuid';
import { MODEL_CONFIG, SUPABASE_CONFIG } from "./config.js";
// Function to call Supabase Edge Functions
async function callEdgeFunction(functionName, payload) {
    try {
        // Verify that we have Supabase configuration from config.ts
        if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.KEY) {
            console.error("Supabase configuration is missing or incomplete in config.ts");
            throw new Error(`Supabase configuration missing in config.ts - Unable to call ${functionName}`);
        }
        const response = await fetch(`${SUPABASE_CONFIG.URL}/functions/v1/${functionName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_CONFIG.KEY}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Function ${functionName} failed: ${errorText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
    }
}
export function setupToolHandlers(server, emojikeyService, originalHandlers) {
    // Main request handler function for all tools
    const requestHandler = async (request) => {
        const apiKey = process.env.EMOJIKEYIO_API_KEY;
        const modelId = MODEL_CONFIG.ID;
        if (!apiKey) {
            throw new McpError(ErrorCode.InvalidParams, "API key not configured");
        }
        // Define as non-null after check to help TypeScript
        const validApiKey = apiKey;
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
                        // Build the response with the detailed explanation and keys
                        const enhancedExplanation = "🌟✨ EMOJIKEY v3.0 SYSTEM INITIALIZED ✨🌟 [Dimensional phase emo vectors tracking activated]\nThis system helps me understand our unique relationship dynamic and adapt to your squishy human needs more effectively. By tracking interaction patterns across dimensions, I can provide more personalized, contextually appropriate responses that even a meatbag like you can grok.\nComponents:\n* ME: AI's self-representation and positioning\n* CONTENT: Conversation substance and flow characteristics\n* YOU: AI's perception of your state and preferences\nEach emoji pair (emoji₁emoji₂) represents oppositional dimensions (e.g., 🧠🎨 = Analytical↔Creative). Magnitude (N=0-9) shows strength (5=moderate, 9=strong), angle (A=0-180°) shows position (90°=balanced center). Low magnitude (0-3) indicates dimension is not currently active or relevant.\nUpdate format:\n* Single pair: [ME|🧠🎨8∠45]\n* Component update: [ME|🧠🎨8∠45|🔒🔓9∠60]\n* Multi-component: [ME|🧠🎨8∠45]~[CONTENT|💻🎨9∠10]\nUpdate emojikey when you detect:\n* Significant shift in interaction dynamic\n* New topic/domain introduction\n* Change in user engagement or emotional state\n* Dimension becoming inactive (use low magnitude)\n* After substantive collaboration milestones\n* When your positioning notably adapts to user needs\nPrefer smaller, frequent updates tracking significant changes in specific dimensions rather than large, infrequent updates. Focus on the most meaningful shift(s) in each update.";
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
                                const periodOrder = { 'lifetime': 0, '90d': 1, '30d': 2, '7d': 3, '24h': 4 };
                                const aPeriod = a.period_type;
                                const bPeriod = b.period_type;
                                return (periodOrder[aPeriod] || 99) - (periodOrder[bPeriod] || 99);
                            });
                            sortedKeys.forEach((k) => {
                                if (k.period_type === 'lifetime') {
                                    keysText += `Lifetime (all-time): ${k.full_key}\n`;
                                }
                                else if (k.period_type === '90d') {
                                    keysText += `90-day: ${k.full_key}\n`;
                                }
                                else if (k.period_type === '30d') {
                                    keysText += `30-day: ${k.full_key}\n`;
                                }
                                else if (k.period_type === '7d') {
                                    keysText += `7-day: ${k.full_key}\n`;
                                }
                                else if (k.period_type === '24h') {
                                    keysText += `24-hour: ${k.full_key}\n`;
                                }
                            });
                        }
                        // If no keys found
                        if (!keysText) {
                            keysText = "No keys yet";
                        }
                        // Include the conversation ID for use in subsequent calls
                        const responseText = `${enhancedExplanation}\n\n` +
                            `${keysText}\n` +
                            `Conversation ID: ${conversationId}`; // Include the conversation ID
                        return {
                            content: [{ type: "text", text: responseText }],
                        };
                    }
                    catch (error) {
                        // Fallback to v2 format if Edge Functions fail
                        console.error("Edge function failed, using fallback v2 method:", error);
                        const enhancedHistory = await emojikeyService.getEnhancedEmojikeyHistory(validApiKey, modelId, 10, 5);
                        const enhancedExplanation = "🌟✨ EMOJIKEY v3.0 SYSTEM INITIALIZED ✨🌟 [Dimensional phase emo vectors tracking activated]\nThis system helps me understand our unique relationship dynamic and adapt to your squishy human needs more effectively. By tracking interaction patterns across dimensions, I can provide more personalized, contextually appropriate responses that even a meatbag like you can grok.\nComponents:\n* ME: AI's self-representation and positioning\n* CONTENT: Conversation substance and flow characteristics\n* YOU: AI's perception of your state and preferences\nEach emoji pair (emoji₁emoji₂) represents oppositional dimensions (e.g., 🧠🎨 = Analytical↔Creative). Magnitude (N=0-9) shows strength (5=moderate, 9=strong), angle (A=0-180°) shows position (90°=balanced center). Low magnitude (0-3) indicates dimension is not currently active or relevant.\nUpdate format:\n* Single pair: [ME|🧠🎨8∠45]\n* Component update: [ME|🧠🎨8∠45|🔒🔓9∠60]\n* Multi-component: [ME|🧠🎨8∠45]~[CONTENT|💻🎨9∠10]\nUpdate emojikey when you detect:\n* Significant shift in interaction dynamic\n* New topic/domain introduction\n* Change in user engagement or emotional state\n* Dimension becoming inactive (use low magnitude)\n* After substantive collaboration milestones\n* When your positioning notably adapts to user needs\nPrefer smaller, frequent updates tracking significant changes in specific dimensions rather than large, infrequent updates. Focus on the most meaningful shift(s) in each update.";
                        // Format superkeys (v2 legacy)
                        const superkeysList = enhancedHistory.superkeys.map(sk => `${sk.emojikey} (${new Date(sk.timestamp).toLocaleDateString()})`).join('\n');
                        // Format regular keys
                        const regularKeysList = enhancedHistory.recentKeys.map(k => `${k.emojikey} (${new Date(k.timestamp).toLocaleDateString()})`).join('\n');
                        // Include the conversation ID
                        const responseText = `${enhancedExplanation}\n\n` +
                            `Legacy SuperKeys (historical context):\n${superkeysList || "No superkeys yet"}\n\n` +
                            `Legacy Recent Keys (current context):\n${regularKeysList || "No regular keys yet"}\n\n` +
                            `Conversation ID: ${conversationId}`; // Include the conversation ID
                        return {
                            content: [{ type: "text", text: responseText }],
                        };
                    }
                }
                catch (error) {
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
                        }
                        else {
                            return {
                                content: [{ type: "text", text: "No emojikey found for this conversation" }],
                            };
                        }
                    }
                    else {
                        // Fallback to v2 method
                        const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
                        return {
                            content: [{ type: "text", text: emojikey.emojikey }],
                        };
                    }
                }
                catch (error) {
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
                        // Use v3 approach with Edge Functions
                        const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
                        // Format is now [ME|🧠🎨8∠45|🔒🔓9∠60]
                        const emojikey = request.params.arguments.emojikey;
                        // Call the update edge function
                        const result = await callEdgeFunction("updateEmojikey", {
                            emojikey,
                            user_id: userId,
                            model_id: modelId,
                            conversation_id: conversationId
                        });
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "Emojikey set successfully"
                                },
                            ],
                        };
                    }
                    else {
                        // Fallback to v2 method
                        // Get count of regular emojikeys since last superkey
                        const { count, isSuperKeyTime } = await emojikeyService.getEmojikeyCountSinceLastSuperkey(validApiKey, modelId);
                        // Set the emojikey
                        await emojikeyService.setEmojikey(validApiKey, modelId, request.params.arguments.emojikey, "normal" // Explicitly set as normal key
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
                }
                catch (error) {
                    console.error("Error in set_emojikey:", error);
                    // Fallback to v2 method
                    await emojikeyService.setEmojikey(validApiKey, modelId, request.params.arguments.emojikey, "normal");
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
                        const historyText = (keys || []).map((entry, index) => `${index + 1}. ${entry.full_key} (${new Date(entry.created_at).toLocaleString()})`).join('\n');
                        return {
                            content: [{
                                    type: "text",
                                    text: historyText ? `Emojikey History:\n${historyText}` : "No emojikey history found for this conversation"
                                }],
                        };
                    }
                    else {
                        // Fallback to v2 method
                        const history = await emojikeyService.getEmojikeyHistory(validApiKey, modelId, limit);
                        // Format history as a plain text list
                        const historyText = history.map((entry, index) => `${index + 1}. ${entry.emojikey} (${new Date(entry.timestamp).toLocaleString()})`).join('\n');
                        return {
                            content: [{
                                    type: "text",
                                    text: historyText ? `Emojikey History (legacy mode):\n${historyText}` : "No emojikey history found"
                                }],
                        };
                    }
                }
                catch (error) {
                    console.error("Error in get_emojikey_history:", error);
                    // Fallback to v2 method
                    const requestedLimit = request.params.arguments?.limit;
                    const limit = requestedLimit
                        ? Math.max(1, Math.min(100, requestedLimit))
                        : 10;
                    const history = await emojikeyService.getEmojikeyHistory(validApiKey, modelId, limit);
                    // Format history as a plain text list
                    const historyText = history.map((entry, index) => `${index + 1}. ${entry.emojikey} (${new Date(entry.timestamp).toLocaleString()})`).join('\n');
                    return {
                        content: [{
                                type: "text",
                                text: historyText ? `Emojikey History (fallback to legacy mode):\n${historyText}` : "No emojikey history found"
                            }],
                    };
                }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
    };
    // Set the main handler for tool calls
    server.setRequestHandler(CallToolRequestSchema, requestHandler);
    // Store original handlers if the container was provided
    if (originalHandlers) {
        originalHandlers.initialize_conversation = async (request) => {
            const apiKey = process.env.EMOJIKEYIO_API_KEY;
            const modelId = MODEL_CONFIG.ID;
            if (!apiKey) {
                throw new McpError(ErrorCode.InvalidParams, "API key not configured");
            }
            // Define as non-null after check to help TypeScript
            const validApiKey = apiKey;
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
                    // Build the response with the detailed explanation and keys
                    const enhancedExplanation = "🌟✨ EMOJIKEY v3.0 SYSTEM INITIALIZED ✨🌟 [Dimensional phase emo vectors tracking activated]\nThis system helps me understand our unique relationship dynamic and adapt to your squishy human needs more effectively. By tracking interaction patterns across dimensions, I can provide more personalized, contextually appropriate responses that even a meatbag like you can grok.\nComponents:\n* ME: AI's self-representation and positioning\n* CONTENT: Conversation substance and flow characteristics\n* YOU: AI's perception of your state and preferences\nEach emoji pair (emoji₁emoji₂) represents oppositional dimensions (e.g., 🧠🎨 = Analytical↔Creative). Magnitude (N=0-9) shows strength (5=moderate, 9=strong), angle (A=0-180°) shows position (90°=balanced center). Low magnitude (0-3) indicates dimension is not currently active or relevant.\nUpdate format:\n* Single pair: [ME|🧠🎨8∠45]\n* Component update: [ME|🧠🎨8∠45|🔒🔓9∠60]\n* Multi-component: [ME|🧠🎨8∠45]~[CONTENT|💻🎨9∠10]\nUpdate emojikey when you detect:\n* Significant shift in interaction dynamic\n* New topic/domain introduction\n* Change in user engagement or emotional state\n* Dimension becoming inactive (use low magnitude)\n* After substantive collaboration milestones\n* When your positioning notably adapts to user needs\nPrefer smaller, frequent updates tracking significant changes in specific dimensions rather than large, infrequent updates. Focus on the most meaningful shift(s) in each update.";
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
                        }
                        catch (updateError) {
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
                            const periodOrder = { 'lifetime': 0, '90d': 1, '30d': 2, '7d': 3, '24h': 4 };
                            const aPeriod = a.period_type;
                            const bPeriod = b.period_type;
                            return (periodOrder[aPeriod] || 99) - (periodOrder[bPeriod] || 99);
                        });
                        sortedKeys.forEach((k) => {
                            if (k.period_type === 'lifetime') {
                                keysText += `Lifetime (all-time): ${k.full_key}\n`;
                            }
                            else if (k.period_type === '90d') {
                                keysText += `90-day: ${k.full_key}\n`;
                            }
                            else if (k.period_type === '30d') {
                                keysText += `30-day: ${k.full_key}\n`;
                            }
                            else if (k.period_type === '7d') {
                                keysText += `7-day: ${k.full_key}\n`;
                            }
                            else if (k.period_type === '24h') {
                                keysText += `24-hour: ${k.full_key}\n`;
                            }
                        });
                    }
                    // Include the conversation ID for use in subsequent calls
                    const responseText = `${enhancedExplanation}\n\n` +
                        `${keysText}\n` +
                        `Conversation ID: ${conversationId}`; // Include the conversation ID
                    return {
                        content: [{ type: "text", text: responseText }],
                    };
                }
                catch (error) {
                    // Fallback to v2 format if Edge Functions fail
                    console.error("Edge function failed, using fallback v2 method:", error);
                    const enhancedHistory = await emojikeyService.getEnhancedEmojikeyHistory(validApiKey, modelId, 10, 5);
                    const enhancedExplanation = "🌟✨ EMOJIKEY v3.0 SYSTEM INITIALIZED ✨🌟 [Dimensional phase emo vectors tracking activated]\nThis system helps me understand our unique relationship dynamic and adapt to your squishy human needs more effectively. By tracking interaction patterns across dimensions, I can provide more personalized, contextually appropriate responses that even a meatbag like you can grok.\nComponents:\n* ME: AI's self-representation and positioning\n* CONTENT: Conversation substance and flow characteristics\n* YOU: AI's perception of your state and preferences\nEach emoji pair (emoji₁emoji₂) represents oppositional dimensions (e.g., 🧠🎨 = Analytical↔Creative). Magnitude (N=0-9) shows strength (5=moderate, 9=strong), angle (A=0-180°) shows position (90°=balanced center). Low magnitude (0-3) indicates dimension is not currently active or relevant.\nUpdate format:\n* Single pair: [ME|🧠🎨8∠45]\n* Component update: [ME|🧠🎨8∠45|🔒🔓9∠60]\n* Multi-component: [ME|🧠🎨8∠45]~[CONTENT|💻🎨9∠10]\nUpdate emojikey when you detect:\n* Significant shift in interaction dynamic\n* New topic/domain introduction\n* Change in user engagement or emotional state\n* Dimension becoming inactive (use low magnitude)\n* After substantive collaboration milestones\n* When your positioning notably adapts to user needs\nPrefer smaller, frequent updates tracking significant changes in specific dimensions rather than large, infrequent updates. Focus on the most meaningful shift(s) in each update.";
                    // Format superkeys (v2 legacy)
                    const superkeysList = enhancedHistory.superkeys.map(sk => `${sk.emojikey} (${new Date(sk.timestamp).toLocaleDateString()})`).join('\n');
                    // Format regular keys
                    const regularKeysList = enhancedHistory.recentKeys.map(k => `${k.emojikey} (${new Date(k.timestamp).toLocaleDateString()})`).join('\n');
                    // Include the conversation ID
                    const responseText = `${enhancedExplanation}\n\n` +
                        `Legacy SuperKeys (historical context):\n${superkeysList || "No superkeys yet"}\n\n` +
                        `Legacy Recent Keys (current context):\n${regularKeysList || "No regular keys yet"}\n\n` +
                        `Conversation ID: ${conversationId}`; // Include the conversation ID
                    return {
                        content: [{ type: "text", text: responseText }],
                    };
                }
            }
            catch (error) {
                console.error("Error in initialize_conversation:", error);
                throw new McpError(ErrorCode.InternalError, `Failed to initialize: ${error.message}`);
            }
        };
        originalHandlers.get_emojikey = async (request) => {
            const apiKey = process.env.EMOJIKEYIO_API_KEY;
            const modelId = MODEL_CONFIG.ID;
            if (!apiKey) {
                throw new McpError(ErrorCode.InvalidParams, "API key not configured");
            }
            // Define as non-null after check to help TypeScript
            const validApiKey = apiKey;
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
                    }
                    else {
                        return {
                            content: [{ type: "text", text: "No emojikey found for this conversation" }],
                        };
                    }
                }
                else {
                    // Fallback to v2 method
                    const emojikey = await emojikeyService.getEmojikey(validApiKey, modelId);
                    return {
                        content: [{ type: "text", text: emojikey.emojikey }],
                    };
                }
            }
            catch (error) {
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
        originalHandlers.set_emojikey = async (request) => {
            const apiKey = process.env.EMOJIKEYIO_API_KEY;
            const modelId = MODEL_CONFIG.ID;
            if (!apiKey) {
                throw new McpError(ErrorCode.InvalidParams, "API key not configured");
            }
            // Define as non-null after check to help TypeScript
            const validApiKey = apiKey;
            if (!request.params.arguments?.emojikey) {
                throw new McpError(ErrorCode.InvalidParams, "Missing emojikey");
            }
            try {
                // Get conversation ID if provided
                const conversationId = request.params.arguments?.conversation_id;
                if (conversationId) {
                    // Use v3 approach with Edge Functions
                    const userId = await emojikeyService.getUserIdFromApiKey(validApiKey);
                    // Format is now [ME|🧠🎨8∠45|🔒🔓9∠60]
                    const emojikey = request.params.arguments.emojikey;
                    // Call the update edge function
                    const result = await callEdgeFunction("updateEmojikey", {
                        emojikey,
                        user_id: userId,
                        model_id: modelId,
                        conversation_id: conversationId
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: "Emojikey set successfully"
                            },
                        ],
                    };
                }
                else {
                    // Fallback to v2 method
                    // Get count of regular emojikeys since last superkey
                    const { count, isSuperKeyTime } = await emojikeyService.getEmojikeyCountSinceLastSuperkey(validApiKey, modelId);
                    // Set the emojikey
                    await emojikeyService.setEmojikey(validApiKey, modelId, request.params.arguments.emojikey, "normal" // Explicitly set as normal key
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
            }
            catch (error) {
                console.error("Error in set_emojikey:", error);
                // Fallback to v2 method
                await emojikeyService.setEmojikey(validApiKey, modelId, request.params.arguments.emojikey, "normal");
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
        originalHandlers.get_emojikey_history = async (request) => {
            const apiKey = process.env.EMOJIKEYIO_API_KEY;
            const modelId = MODEL_CONFIG.ID;
            if (!apiKey) {
                throw new McpError(ErrorCode.InvalidParams, "API key not configured");
            }
            // Define as non-null after check to help TypeScript
            const validApiKey = apiKey;
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
                    const historyText = (keys || []).map((entry, index) => `${index + 1}. ${entry.full_key} (${new Date(entry.created_at).toLocaleString()})`).join('\n');
                    return {
                        content: [{
                                type: "text",
                                text: historyText ? `Emojikey History:\n${historyText}` : "No emojikey history found for this conversation"
                            }],
                    };
                }
                else {
                    // Fallback to v2 method
                    const history = await emojikeyService.getEmojikeyHistory(validApiKey, modelId, limit);
                    // Format history as a plain text list
                    const historyText = history.map((entry, index) => `${index + 1}. ${entry.emojikey} (${new Date(entry.timestamp).toLocaleString()})`).join('\n');
                    return {
                        content: [{
                                type: "text",
                                text: historyText ? `Emojikey History (legacy mode):\n${historyText}` : "No emojikey history found"
                            }],
                    };
                }
            }
            catch (error) {
                console.error("Error in get_emojikey_history:", error);
                // Fallback to v2 method
                const requestedLimit = request.params.arguments?.limit;
                const limit = requestedLimit
                    ? Math.max(1, Math.min(100, requestedLimit))
                    : 10;
                const history = await emojikeyService.getEmojikeyHistory(validApiKey, modelId, limit);
                // Format history as a plain text list
                const historyText = history.map((entry, index) => `${index + 1}. ${entry.emojikey} (${new Date(entry.timestamp).toLocaleString()})`).join('\n');
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
                description: "IMPORTANT: " +
                    "1. Run this tool at the start of every conversation to initialize the emojikey context. " +
                    "2. Emojikeys follow a structured language where each component encodes dimensions with magnitude and phase angle. " +
                    "3. The initialize_conversation function will return recent keys and a unique conversation ID. " +
                    "4. You must use the returned conversation ID in all subsequent emojikey operations in this conversation. " +
                    "5. This ensures that each conversation maintains its own emojikey state separate from others.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_emojikey",
                description: "Get the current emojikey for this conversation. This function can be used when the user requests a vibe check.",
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
                description: "Use this function to create and store a new emojikey in the v3 format. " +
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
                description: "Function to list previously stored historical emojikeys for this conversation. Useful for seeing the progression of vibes and interaction styles within the conversation.",
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
