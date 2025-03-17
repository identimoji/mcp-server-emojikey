import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: "https://dasvvxptyafaiwkmmmqz.supabase.co",
  KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhc3Z2eHB0eWFmYWl3a21tbXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTM1NjEsImV4cCI6MjA0OTE4OTU2MX0.y9L2TahBajkUPQGJJ15kEckMK3sZDzuNL-2Mrmg_KoU",
} as const;

// Add this for model config
export const MODEL_CONFIG = {
  ID: process.env.MODEL_ID || "default", // Fallback if not set
} as const;

// Server configuration
export const SERVER_CONFIG = {
  NAME: "emojikey-server",
  VERSION: "0.2.0",
  CAPABILITIES: {
    resources: {},
    tools: {},
  },
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: "https://3xkgfu1c7h.execute-api.us-east-2.amazonaws.com",
  ENDPOINTS: {
    EMOJIKEY: "/emojikey",
  },
  API_KEY: process.env.EMOJIKEYIO_API_KEY, // Get from environment
} as const;
