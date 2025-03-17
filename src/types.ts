export interface Emojikey {
  emojikey: string;
  modelId: string;
  userId: string;
  timestamp: string;
  emojikey_type?: "normal" | "super"; // Default is "normal" if not specified
}
