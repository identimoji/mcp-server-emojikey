export interface Emojikey {
  emojikey: string;
  modelId: string;
  userId: string;
  timestamp: string;
}

export interface EmojikeyCountResult {
  count: number;
  isSuperKeyTime: boolean;
}
