// handlers_coding.ts - Enhanced handlers for coding-specific emojikey interactions
import { EmojikeyService } from "./service.js";
import { getCodingDimensionsExplanation } from "./coding_dimensions.js";

// Generate enhanced explanation text for coding contexts
export function generateCodingExplanation(): string {
  return `🌟✨ EMOJIKEY v3.1 CODING SYSTEM INITIALIZED ✨🌟 [Programming context tracking activated]

This enhanced system helps me understand our coding relationship dynamics and adapt to your development style more effectively. By tracking programming-specific interaction patterns across dimensions, I can provide more contextually appropriate assistance for your coding tasks.

Components remain the same:
* ME: AI's self-representation and positioning in coding contexts
* CONTENT: Code-related discussion substance and flow
* YOU: AI's perception of your programming style and preferences

Each emoji pair in coding contexts (emoji₁emoji₂) represents programming-specific dimensions (e.g., 💻🔧 = Detail↔Architecture focus). Magnitude (N=0-9) shows strength (5=moderate, 9=strong), angle (A=0-180°) shows position (90°=balanced center).

${getCodingDimensionsExplanation()}

Coding-specific update triggers:
* Shift in programming paradigm or language focus
* Change in project complexity or architecture needs
* Transition between explanation and implementation modes
* Shifts in debugging vs. feature development focus
* Changes in code optimization priorities
* Transition between teaching and collaborative coding

This specialized system helps me adapt to your coding style, providing the right balance of theoretical explanation, practical examples, architectural guidance, and implementation details based on your needs and preferences.
`;
}

// Enhanced handler for initialize_conversation with coding focus detection
export function enhanceInitializeResponse(responseText: string, hasCodingContext: boolean): string {
  if (!hasCodingContext) {
    return responseText; // Return standard response if not coding context
  }

  // Extract conversation ID from the original response
  const conversationIdMatch = responseText.match(/Conversation ID: ([a-f0-9-]+)/);
  const conversationId = conversationIdMatch ? conversationIdMatch[1] : "";
  
  // Get recent keys from the original response
  const recentKeysSection = responseText.match(/Recent Keys \(current context\):\n([^]*?)(?=\n\nConversation ID:)/);
  const recentKeys = recentKeysSection ? recentKeysSection[1] : "No keys yet";
  
  // Build enhanced coding-focused response
  const codingExplanation = generateCodingExplanation();
  
  return `${codingExplanation}

Recent Keys (current context):
${recentKeys}

Conversation ID: ${conversationId}`;
}

// Helper function to detect if a conversation has coding context
export function detectCodingContext(conversationText: string): boolean {
  const codingKeywords = [
    "code", "program", "developer", "function", "class", "variable",
    "algorithm", "method", "api", "framework", "library", "syntax",
    "compiler", "interpreter", "runtime", "debug", "exception",
    "javascript", "python", "java", "c++", "typescript", "rust", "go",
    "html", "css", "sql", "react", "angular", "vue", "node", "express",
    "django", "flask", "spring", "dotnet", "database", "git"
  ];
  
  // Check if any coding keywords are present in the conversation text
  const pattern = new RegExp(codingKeywords.join("|"), "i");
  return pattern.test(conversationText);
}

// Function to integrate coding features into existing handlers
export function integrateCodingHandlers(handlers: any, emojikeyService: EmojikeyService): void {
  // Store the original initialize_conversation handler
  const originalInitializeHandler = handlers.initialize_conversation;
  
  // Replace with enhanced version that checks for coding context
  handlers.initialize_conversation = async (request: any) => {
    // First, get the standard response
    const standardResponse = await originalInitializeHandler(request);
    
    // Check if this is a coding context
    // For now, we'll use a simplified detection method
    const hasCodingContext = true; // Later we'll use detectCodingContext from request context
    
    if (hasCodingContext && standardResponse.content && standardResponse.content[0]) {
      // Enhance the response with coding-specific information
      const enhancedText = enhanceInitializeResponse(
        standardResponse.content[0].text, 
        hasCodingContext
      );
      
      // Return the enhanced response
      return {
        content: [{ type: "text", text: enhancedText }],
      };
    }
    
    // If not coding context or no valid response, return the standard response
    return standardResponse;
  };
  
  // Return the modified handlers object
  return handlers;
}