import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: process.env.SUPABASE_URL || "https://dasvvxptyafaiwkmmmqz.supabase.co",
  KEY: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhc3Z2eHB0eWFmYWl3a21tbXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTM1NjEsImV4cCI6MjA0OTE4OTU2MX0.y9L2TahBajkUPQGJJ15kEckMK3sZDzuNL-2Mrmg_KoU",
} as const;

// Add this for model config
export const MODEL_CONFIG = {
  ID: process.env.MODEL_ID || "default", // Fallback if not set
} as const;

// Server configuration
export const SERVER_CONFIG = {
  NAME: "emojikey-server",
  VERSION: "0.3.1", // Updated for v3.1 with coding dimensions support
  CAPABILITIES: {
    resources: {},
    tools: {},
  },
} as const;

// API key configuration
export const API_CONFIG = {
  API_KEY: process.env.EMOJIKEYIO_API_KEY, // Get from environment
} as const;

// Edge Function configuration
export const EDGE_FUNCTION_CONFIG = {
  ENABLED: process.env.USE_EDGE_FUNCTIONS !== "false", // Default to enabled
  TIMEOUT: 10000, // 10 seconds
  URL: process.env.SUPABASE_URL || SUPABASE_CONFIG.URL,
  KEY: process.env.SUPABASE_ANON_KEY || SUPABASE_CONFIG.KEY
} as const;
