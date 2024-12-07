import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// API configuration
export const API_CONFIG = {
  BASE_URL: "https://3xkgfu1c7h.execute-api.us-east-2.amazonaws.com",
  ENDPOINTS: {
    EMOJIKEY: "/emojikey",
  },
  API_KEY: process.env.EMOJIKEYIO_API_KEY, // Get from environment
} as const;

// Server configuration
export const SERVER_CONFIG = {
  NAME: "emojikey-server",
  VERSION: "0.1.0",
  CAPABILITIES: {
    resources: {},
    tools: {},
  },
} as const;
