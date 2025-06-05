// Test emojikey initialization
// This script simulates the initialization request to test the structured display of emojikeys

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Mock components
const mockService = {
  getUserIdFromApiKey: async () => "test-user-id"
};

const mockServer = {
  setRequestHandler: () => {}
};

// Mock Edge Function response
global.fetch = async (url, options) => {
  console.log(`Mocking fetch to ${url}`);
  
  // Parse the request body
  const body = JSON.parse(options.body);
  
  if (url.includes('getEmojikeyHistory')) {
    if (body.get_recent_key) {
      return {
        ok: true,
        json: async () => ({
          key: {
            full_key: "[ME|🧠🎨8∠45|🔒🔓9∠60]~[CONTENT|💻🧩9∠15]~[YOU|🎓🌱8∠35]",
            created_at: new Date().toISOString()
          },
          baseline_key: "[ME|🧠🎨5∠50|🔒🔓5∠50]"
        })
      };
    } else if (body.get_aggregated_keys) {
      return {
        ok: true,
        json: async () => ({
          aggregated_keys: [
            {
              period_type: "lifetime",
              full_key: "[ME|🧠🎨7∠60|🔒🔓8∠55]~[CONTENT|💻🧩7∠40]~[YOU|🎓🌱7∠45]"
            },
            {
              period_type: "30d",
              full_key: "[ME|🧠🎨8∠45|🔒🔓9∠60]~[CONTENT|💻🧩8∠30]~[YOU|🎓🌱8∠35]"
            },
            {
              period_type: "7d",
              full_key: "[ME|🧠🎨8∠45|🔒🔓9∠60]~[CONTENT|💻🧩9∠15]~[YOU|🎓🌱8∠35]"
            }
          ]
        })
      };
    }
  } else if (url.includes('updateEmojikey')) {
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  }
  
  // Default response
  return {
    ok: true,
    json: async () => ({ message: "Mock response" })
  };
};

// Import the module we want to test
async function runTest() {
  try {
    // Override environment variables
    process.env.EMOJIKEYIO_API_KEY = "test-api-key";
    process.env.MODEL_ID = "test-model";
    
    // Import the handlers module - use dynamic import for ESM
    const handlersModule = await import('./build/handlers.js');
    const { setupToolHandlers } = handlersModule;
    
    // Create a mock request handler container
    const handlers = {};
    
    // Setup the handlers
    setupToolHandlers(mockServer, mockService, handlers);
    
    // Test the initialize_conversation handler
    const result = await handlers.initialize_conversation({
      params: { arguments: {} }
    });
    
    console.log("\n=== Initialization Response ===\n");
    console.log(result.content[0].text);
    console.log("\n=== End of Response ===\n");
    
    // Verify the response includes what we want
    const text = result.content[0].text;
    
    console.log("== Verification ==");
    console.log("Contains 'Lifetime (all-time)':", text.includes("Lifetime (all-time)"));
    console.log("Contains '30-day':", text.includes("30-day"));
    console.log("Contains '7-day':", text.includes("7-day"));
    console.log("Contains 'Starting Key':", text.includes("Starting Key"));
    console.log("Contains 'Conversation ID':", text.includes("Conversation ID"));
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
runTest();