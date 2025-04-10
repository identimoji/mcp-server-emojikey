import { Emojikey, EmojikeyCountResult } from "./types.js";

// Superkey pattern constants
export const SUPERKEY_PREFIX = "[[";
export const SUPERKEY_SUFFIX = "]]";

// Utility to check if a key is a superkey
export function isSuperKey(emojikey: string): boolean {
  return emojikey.startsWith(SUPERKEY_PREFIX) && emojikey.endsWith(SUPERKEY_SUFFIX);
}

// Utility to format a key as a superkey
export function formatAsSuperKey(emojikey: string): string {
  // Remove existing superkey formatting if present
  const cleanKey = emojikey.replace(SUPERKEY_PREFIX, "").replace(SUPERKEY_SUFFIX, "");
  return `${SUPERKEY_PREFIX}${cleanKey}${SUPERKEY_SUFFIX}`;
}

// Main interface that both API and local implementations will follow
export interface EmojikeyService {
  // Get emojikey for conversation initialization or when requested
  getEmojikey(userId: string, modelId: string): Promise<Emojikey>;

  // Set new emojikey (from user command or AI context update)
  setEmojikey(userId: string, modelId: string, emojikey: string): Promise<EmojikeyCountResult>;

  // Get history of emojikeys with optional limit
  getEmojikeyHistory(
    userId: string,
    modelId: string,
    limit?: number,
  ): Promise<Emojikey[]>;
  
  // Get count of regular emojikeys since last superkey
  getEmojikeyCount(userId: string, modelId: string): Promise<EmojikeyCountResult>;
  
  // Create a superkey from recent emojikeys
  createSuperKey(userId: string, modelId: string, superKey: string): Promise<void>;
}

// Error class for emojikey-specific errors
export class EmojikeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmojikeyError";
  }
}
