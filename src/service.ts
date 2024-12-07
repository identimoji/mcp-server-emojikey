import { Emojikey } from "./types.js";

// Main interface that both API and local implementations will follow
export interface EmojikeyService {
  // Get emojikey for conversation initialization or when requested
  getEmojikey(userId: string, modelId: string): Promise<Emojikey>;

  // Set new emojikey (from user command or AI context update)
  setEmojikey(userId: string, modelId: string, emojikey: string): Promise<void>;

  // Get history of emojikeys with optional limit
  getEmojikeyHistory(
    userId: string,
    modelId: string,
    limit?: number,
  ): Promise<Emojikey[]>;
}

// Error class for emojikey-specific errors
export class EmojikeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmojikeyError";
  }
}
