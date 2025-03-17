import { createClient } from "@supabase/supabase-js";
import { EmojikeyService, EmojikeyError } from "./service.js";
import { Emojikey } from "./types.js";
import { SUPABASE_CONFIG } from "./config.js";

interface EmojikeyRecord {
  emojikey: string;
  created_at: string;
  emojikey_type?: "normal" | "super";
}

export class SupabaseEmojikeyService implements EmojikeyService {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
      db: { schema: "public" }
    });
  }

  private async getUserIdFromApiKey(apiKey: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("check_api_key", {
        check_key: apiKey
      });

      if (error) throw new Error("Invalid API key");
      if (!data) throw new Error("API key not found");

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      throw new EmojikeyError(`API key validation failed: ${error.message}`);
    }
  }

  async getEmojikey(apiKey: string, modelId: string): Promise<Emojikey> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { data, error } = await this.supabase.rpc("get_user_emojikeys", {
        input_user_id: userId,
        input_model: modelId
      });

      if (error) throw new Error(`Failed to get emojikey: ${error.message}`);
      if (!data || data.length === 0) throw new Error("No emojikey found");

      return {
        emojikey: data[0].emojikey,
        userId,
        modelId,
        timestamp: data[0].created_at,
        emojikey_type: data[0].emojikey_type || "normal"
      };
    } catch (err: unknown) {
      const error = err as Error;
      throw new EmojikeyError(`Emojikey retrieval failed: ${error.message}`);
    }
  }

  async setEmojikey(apiKey: string, modelId: string, emojikey: string, emojikey_type: "normal" | "super" = "normal"): Promise<void> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { error } = await this.supabase.rpc("set_user_emojikey", {
        input_user_id: userId,
        input_model: modelId,
        input_emojikey: emojikey,
        input_emojikey_type: emojikey_type
      });

      if (error) throw new Error(`Failed to set emojikey: ${error.message}`);
    } catch (err: unknown) {
      const error = err as Error;
      throw new EmojikeyError(`Emojikey update failed: ${error.message}`);
    }
  }

  async getEmojikeyHistory(apiKey: string, modelId: string, limit: number = 10): Promise<Emojikey[]> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);

      const { data, error } = await this.supabase.rpc("get_user_emojikey_history", {
        input_user_id: userId,
        input_model: modelId,
        history_limit: limit
      });

      if (error) throw new Error(`Failed to get history: ${error.message}`);
      if (!data) return [];

      return data.map((record: EmojikeyRecord) => ({
        emojikey: record.emojikey,
        userId,
        modelId,
        timestamp: record.created_at,
        emojikey_type: record.emojikey_type || "normal"
      }));
    } catch (err: unknown) {
      const error = err as Error;
      throw new EmojikeyError(`Emojikey history retrieval failed: ${error.message}`);
    }
  }
  
  async getEnhancedEmojikeyHistory(
    apiKey: string, 
    modelId: string,
    normalKeyLimit: number = 10,
    superKeyLimit: number = 5
  ): Promise<{superkeys: Emojikey[], recentKeys: Emojikey[]}> {
    try {
      const userId = await this.getUserIdFromApiKey(apiKey);
      
      // Get superkeys
      const { data: superkeys, error: superkeysError } = await this.supabase.rpc(
        "get_user_emojikeys_by_type", 
        {
          input_user_id: userId,
          input_model: modelId,
          input_emojikey_type: "super",
          history_limit: superKeyLimit
        }
      );
      
      if (superkeysError) throw new Error(`Failed to get superkeys: ${superkeysError.message}`);
      
      // Get normal keys (most recent)
      const { data: recentKeys, error: recentKeysError } = await this.supabase.rpc(
        "get_user_emojikeys_by_type", 
        {
          input_user_id: userId,
          input_model: modelId,
          input_emojikey_type: "normal",
          history_limit: normalKeyLimit
        }
      );
      
      if (recentKeysError) throw new Error(`Failed to get recent keys: ${recentKeysError.message}`);
      
      return {
        superkeys: (superkeys || []).map((record: EmojikeyRecord) => ({
          emojikey: record.emojikey,
          userId,
          modelId,
          timestamp: record.created_at,
          emojikey_type: "super"
        })),
        recentKeys: (recentKeys || []).map((record: EmojikeyRecord) => ({
          emojikey: record.emojikey,
          userId,
          modelId,
          timestamp: record.created_at,
          emojikey_type: "normal"
        }))
      };
    } catch (err: unknown) {
      const error = err as Error;
      throw new EmojikeyError(`Enhanced emojikey history retrieval failed: ${error.message}`);
    }
  }
}