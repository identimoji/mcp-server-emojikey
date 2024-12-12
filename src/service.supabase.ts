import { createClient } from "@supabase/supabase-js";
import { EmojikeyService, EmojikeyError } from "./service.js";
import { Emojikey } from "./types.js";
import { SUPABASE_CONFIG } from "./config.js";

interface EmojikeyRecord {
  emojikey: string;
  created_at: string;
}

export class SupabaseEmojikeyService implements EmojikeyService {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
      db: { schema: "public" },
    });
  }

  private async getUserIdFromApiKey(apiKey: string): Promise<string> {
    try {
      console.log("Checking API key:", apiKey);
      const { data, error } = await this.supabase.rpc("check_api_key", {
        check_key: apiKey,
      });

      console.log("Query result:", { data, error });

      if (error) throw new EmojikeyError("Invalid API key");
      if (!data) throw new EmojikeyError("API key not found");

      return data;
    } catch (err) {
      const error = err as Error;
      throw new EmojikeyError(`API key validation failed: ${error.message}`);
    }
  }

  async getEmojikey(apiKey: string, modelId: string): Promise<Emojikey> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);
      console.log("Got userId:", userId);

      console.log("Calling RPC with params:", {
        input_user_id: userId,
        input_model: modelId,
      });

      const { data, error } = await this.supabase.rpc("get_user_emojikeys", {
        input_user_id: userId,
        input_model: modelId,
      });

      console.log("RPC response:", { data, error });

      if (error)
        throw new EmojikeyError("Failed to get emojikey: " + error.message);
      if (!data || data.length === 0)
        throw new EmojikeyError("No emojikey found");

      return {
        emojikey: data[0].emojikey,
        userId,
        modelId,
        timestamp: data[0].created_at,
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
      console.log("Setting emojikey:", { userId, modelId, emojikey });

      const { error } = await this.supabase.rpc("set_user_emojikey", {
        input_user_id: userId,
        input_model: modelId,
        input_emojikey: emojikey,
      });

      if (error)
        throw new EmojikeyError("Failed to set emojikey: " + error.message);
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
      console.log("Getting history:", { userId, modelId, limit });

      const { data, error } = await this.supabase.rpc(
        "get_user_emojikey_history",
        {
          input_user_id: userId,
          input_model: modelId,
          history_limit: limit,
        },
      );

      if (error)
        throw new EmojikeyError("Failed to get history: " + error.message);
      if (!data) return [];

      return data.map((record: EmojikeyRecord) => ({
        emojikey: record.emojikey,
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
