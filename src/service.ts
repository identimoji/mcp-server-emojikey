import { Emojikey } from "./types.js";

// Interface for the emojikeyCount response
export interface EmojikeyCountResult {
  count: number;
  isSuperKeyTime: boolean;
}

// Main interface that both API and local implementations will follow
export interface EmojikeyService {
  // Get emojikey for conversation initialization or when requested
  getEmojikey(userId: string, modelId: string): Promise<Emojikey>;

  // Set new emojikey (from user command or AI context update)
  setEmojikey(userId: string, modelId: string, emojikey: string, emojikey_type?: "normal" | "super"): Promise<void>;

  // Get history of emojikeys with optional limit
  getEmojikeyHistory(
    userId: string,
    modelId: string,
    limit?: number,
  ): Promise<Emojikey[]>;
  
  // Get a combined history of recent keys and superkeys
  getEnhancedEmojikeyHistory(
    userId: string,
    modelId: string,
    normalKeyLimit?: number,
    superKeyLimit?: number,
  ): Promise<{superkeys: Emojikey[], recentKeys: Emojikey[]}>;
  
  // Get count of regular emojikeys since last superkey
  getEmojikeyCountSinceLastSuperkey(
    userId: string,
    modelId: string,
  ): Promise<EmojikeyCountResult>;
  
  // Get user ID from API key
  getUserIdFromApiKey(apiKey: string): Promise<string>;
}

// Error class for emojikey-specific errors
export class EmojikeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmojikeyError";
  }
}
