import { createClient } from "@supabase/supabase-js";
import { EmojikeyService, EmojikeyError } from "./service.js";
import { Emojikey } from "./types.js";
import { SUPABASE_CONFIG } from "./config.js";

export class SupabaseEmojikeyService implements EmojikeyService {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
  }

  private async getUserIdFromApiKey(apiKey: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from("api_keys")
        .select("user_id")
        .eq("key", apiKey)
        .single();

      if (error) throw new EmojikeyError("Invalid API key");
      if (!data) throw new EmojikeyError("API key not found");

      return data.user_id;
    } catch (err) {
      const error = err as Error;
      throw new EmojikeyError(`API key validation failed: ${error.message}`);
    }
  }

  async getEmojikey(apiKey: string, modelId: string): Promise<Emojikey> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { data, error } = await this.supabase
        .from("emojikeys")
        .select("emojikey, created_at")
        .eq("user_id", userId)
        .eq("model", modelId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw new EmojikeyError("Failed to get emojikey");
      if (!data) throw new EmojikeyError("No emojikey found");

      return {
        key: data.emojikey,
        userId,
        modelId,
        timestamp: data.created_at,
      };
    } catch (err) {
      const error = err as Error;
      throw new EmojikeyError(`Emojikey retrieval failed: ${error.message}`);
    }
  }

  async setEmojikey(
    apiKey: string,
    modelId: string,
    emojikey: string,
  ): Promise<void> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { error } = await this.supabase.from("emojikeys").insert([
        {
          user_id: userId,
          model: modelId,
          emojikey: emojikey,
        },
      ]);

      if (error) throw new EmojikeyError("Failed to set emojikey");
    } catch (err) {
      const error = err as Error;
      throw new EmojikeyError(`Emojikey update failed: ${error.message}`);
    }
  }

  async getEmojikeyHistory(
    apiKey: string,
    modelId: string,
    limit: number = 10,
  ): Promise<Emojikey[]> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { data, error } = await this.supabase
        .from("emojikeys")
        .select("emojikey, created_at")
        .eq("user_id", userId)
        .eq("model", modelId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new EmojikeyError("Failed to get emojikey history");
      if (!data) return [];

      return data.map((record) => ({
        key: record.emojikey,
        userId,
        modelId,
        timestamp: record.created_at,
      }));
    } catch (err) {
      const error = err as Error;
      throw new EmojikeyError(
        `Emojikey history retrieval failed: ${error.message}`,
      );
    }
  }
}
