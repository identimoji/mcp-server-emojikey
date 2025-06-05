// handlers_integration.ts - Integration module for coding features
import { EmojikeyService } from "./service.js";
import { generateCodingExplanation } from "./handlers_coding.js";
import { analyzeConversation, generateCodingEmojikey, callCodingContextAnalysis } from "./code_analyzer.js";
import { EDGE_FUNCTION_CONFIG } from "./config.js";

// Store recent conversation samples to analyze for coding context
// This is a simple in-memory store; could be replaced with a more persistent solution
const conversationSamples: Record<string, string[]> = {};
const MAX_SAMPLES_PER_CONVERSATION = 5;
const MAX_SAMPLE_LENGTH = 1000;

// Add new message to conversation samples
export function addConversationSample(conversationId: string, message: string): void {
  if (!conversationSamples[conversationId]) {
    conversationSamples[conversationId] = [];
  }
  
  // Truncate long messages
  const truncatedMessage = message.length > MAX_SAMPLE_LENGTH 
    ? message.substring(0, MAX_SAMPLE_LENGTH) 
    : message;
  
  // Add to array
  conversationSamples[conversationId].push(truncatedMessage);
  
  // Maintain limited size
  if (conversationSamples[conversationId].length > MAX_SAMPLES_PER_CONVERSATION) {
    conversationSamples[conversationId].shift();
  }
}

// Get combined conversation sample for analysis
export function getConversationSample(conversationId: string): string {
  if (!conversationSamples[conversationId]) {
    return "";
  }
  return conversationSamples[conversationId].join("\n\n");
}

// Enhanced handler for initialize_conversation with coding detection
export async function initializeWithCodingDetection(
  originalHandler: Function,
  request: any,
  emojikeyService: EmojikeyService
): Promise<any> {
  // First, get the standard response
  const standardResponse = await originalHandler(request);
  
  // Initialize a clean conversation state
  const conversationIdMatch = standardResponse.content?.[0]?.text.match(/Conversation ID: ([a-f0-9-]+)/);
  const conversationId = conversationIdMatch?.[1];
  
  if (!conversationId) {
    return standardResponse; // Return standard response if we can't parse the conversation ID
  }
  
  // Set up fresh conversation sample storage
  conversationSamples[conversationId] = [];
  
  // For now, since this is a brand new conversation, return the standard response
  // Coding context will be detected as messages are exchanged
  return standardResponse;
}

// Enhanced handler for set_emojikey with coding context analysis
export async function setEmojikeyWithCodingAnalysis(
  originalHandler: Function,
  request: any,
  emojikeyService: EmojikeyService
): Promise<any> {
  const conversationId = request.params.arguments?.conversation_id;
  const requestedEmojikey = request.params.arguments?.emojikey;
  
  if (!conversationId) {
    return originalHandler(request); // Fall back to original handler
  }
  
  // Get conversation sample
  const conversationSample = getConversationSample(conversationId);
  
  // If we have a substantial conversation sample and the request is not setting
  // a coding-specific emojikey (which would already contain coding dimensions)
  if (
    conversationSample.length > 100 && 
    requestedEmojikey && 
    !requestedEmojikey.includes("💻🔧") && 
    !requestedEmojikey.includes("🧩🧠") &&
    !requestedEmojikey.includes("🏗️🔍")
  ) {
    try {
      // Get API key and validate it
      const apiKey = process.env.EMOJIKEYIO_API_KEY;
      if (!apiKey) {
        throw new Error("API key not configured");
      }
      
      // Analyze for coding context
      const analysisResult = await callCodingContextAnalysis(
        await emojikeyService.getUserIdFromApiKey(apiKey),
        process.env.MODEL_ID || "default",
        conversationId,
        conversationSample,
        requestedEmojikey
      );
      
      // If this is a coding context, enhance the emojikey
      if (analysisResult.is_coding_context && analysisResult.emojikey) {
        // Check if we need to combine with the requested emojikey
        const combinedEmojikey = combineEmojikeys(requestedEmojikey, analysisResult.emojikey);
        
        // Set the enhanced emojikey
        const enhancedRequest = {
          ...request,
          params: {
            ...request.params,
            arguments: {
              ...request.params.arguments,
              emojikey: combinedEmojikey
            }
          }
        };
        
        const response = await originalHandler(enhancedRequest);
        
        // Return enhanced response with explanation
        return {
          content: [
            {
              type: "text",
              text: `Emojikey enhanced with coding dimensions: ${combinedEmojikey}\n\n` +
                    `Detected languages: ${analysisResult.dominant_languages?.map((l: {language: string}) => l.language).join(", ") || "None"}`
            }
          ]
        };
      }
    } catch (error) {
      console.error("Error in coding context analysis:", error);
      // Continue with original request if analysis fails
    }
  }
  
  // Process normally with original handler
  return originalHandler(request);
}

// Combine standard emojikey with coding-specific dimensions
function combineEmojikeys(standardEmojikey: string, codingEmojikey: string): string {
  // If either is empty, return the other
  if (!standardEmojikey) return codingEmojikey;
  if (!codingEmojikey) return standardEmojikey;
  
  // Extract ME components from both emojikeys
  const standardMeMatch = standardEmojikey.match(/\[ME\|(.*?)\]/);
  const codingMeMatch = codingEmojikey.match(/\[ME\|(.*?)\]/);
  
  if (!standardMeMatch || !codingMeMatch) {
    // If either doesn't have a ME component, return the standard
    return standardEmojikey;
  }
  
  // Combine ME dimensions
  const standardMeDimensions = standardMeMatch[1].split('|');
  const codingMeDimensions = codingMeMatch[1].split('|');
  
  // Merge all dimensions, removing duplicates
  const combinedMeDimensions = [...new Set([...standardMeDimensions, ...codingMeDimensions])];
  
  // Replace the ME component in the standard emojikey
  const combinedEmojikey = standardEmojikey.replace(
    /\[ME\|(.*?)\]/, 
    `[ME|${combinedMeDimensions.join('|')}]`
  );
  
  return combinedEmojikey;
}

// Process an incoming message for coding context
export function processMessage(conversationId: string, message: string): void {
  if (!conversationId) return;
  
  // Add to conversation samples
  addConversationSample(conversationId, message);
}

// Integration function to enhance handlers with coding features
export function integrateCodingFeatures(
  server: any,
  originalHandlers: any,
  emojikeyService: EmojikeyService
): void {
  // Keep references to original handlers
  const originalInitialize = originalHandlers.initialize_conversation;
  const originalSetEmojikey = originalHandlers.set_emojikey;
  
  // Replace with enhanced handlers
  server.setRequestHandler({
    method: "initialize_conversation",
    params: originalHandlers.initialize_conversation.params
  }, async (request: any) => {
    return initializeWithCodingDetection(originalInitialize, request, emojikeyService);
  });
  
  server.setRequestHandler({
    method: "set_emojikey",
    params: originalHandlers.set_emojikey.params
  }, async (request: any) => {
    return setEmojikeyWithCodingAnalysis(originalSetEmojikey, request, emojikeyService);
  });
  
  // Enhance get_emojikey to add coding explanation when appropriate
  const originalGetEmojikey = originalHandlers.get_emojikey;
  server.setRequestHandler({
    method: "get_emojikey",
    params: originalHandlers.get_emojikey.params
  }, async (request: any) => {
    const response = await originalGetEmojikey(request);
    const conversationId = request.params.arguments?.conversation_id;
    
    if (!conversationId) {
      return response;
    }
    
    // Get the emojikey
    const emojikey = response.content?.[0]?.text;
    
    // Check if it contains coding dimensions
    if (
      emojikey && 
      (emojikey.includes("💻🔧") || 
       emojikey.includes("🧩🧠") || 
       emojikey.includes("🏗️🔍"))
    ) {
      // Add coding explanation
      return {
        content: [
          {
            type: "text",
            text: `${emojikey}\n\n` +
                  `This emojikey includes coding-specific dimensions that track programming-related interaction patterns. ` +
                  `These dimensions help me adapt to your coding style and provide more relevant assistance.`
          }
        ]
      };
    }
    
    return response;
  });
}