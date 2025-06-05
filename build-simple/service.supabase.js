import { createClient } from "@supabase/supabase-js";
import { EmojikeyError } from "./service.js";
import { SUPABASE_CONFIG } from "./config.js";
export class SupabaseEmojikeyService {
    supabase;
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
            db: { schema: "public" }
        });
    }
    async getUserIdFromApiKey(apiKey) {
        try {
            const { data, error } = await this.supabase.rpc("check_api_key", {
                check_key: apiKey
            });
            if (error)
                throw new Error("Invalid API key");
            if (!data)
                throw new Error("API key not found");
            return data;
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`API key validation failed: ${error.message}`);
        }
    }
    async getEmojikey(apiKey, modelId) {
        try {
            const userId = await this.getUserIdFromApiKey(apiKey);
            const { data, error } = await this.supabase.rpc("get_user_emojikeys", {
                input_user_id: userId,
                input_model: modelId
            });
            if (error)
                throw new Error(`Failed to get emojikey: ${error.message}`);
            if (!data || data.length === 0)
                throw new Error("No emojikey found");
            return {
                emojikey: data[0].emojikey,
                userId,
                modelId,
                timestamp: data[0].created_at,
                emojikey_type: data[0].emojikey_type || "normal"
            };
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`Emojikey retrieval failed: ${error.message}`);
        }
    }
    async setEmojikey(apiKey, modelId, emojikey, emojikey_type = "normal") {
        try {
            const userId = await this.getUserIdFromApiKey(apiKey);
            const { error } = await this.supabase.rpc("set_user_emojikey", {
                input_user_id: userId,
                input_model: modelId,
                input_emojikey: emojikey,
                input_emojikey_type: emojikey_type
            });
            if (error)
                throw new Error(`Failed to set emojikey: ${error.message}`);
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`Emojikey update failed: ${error.message}`);
        }
    }
    async getEmojikeyHistory(apiKey, modelId, limit = 10) {
        try {
            const userId = await this.getUserIdFromApiKey(apiKey);
            const { data, error } = await this.supabase.rpc("get_user_emojikey_history", {
                input_user_id: userId,
                input_model: modelId,
                history_limit: limit
            });
            if (error)
                throw new Error(`Failed to get history: ${error.message}`);
            if (!data)
                return [];
            return data.map((record) => ({
                emojikey: record.emojikey,
                userId,
                modelId,
                timestamp: record.created_at,
                emojikey_type: record.emojikey_type || "normal"
            }));
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`Emojikey history retrieval failed: ${error.message}`);
        }
    }
    async getEmojikeyCountSinceLastSuperkey(apiKey, modelId) {
        try {
            const userId = await this.getUserIdFromApiKey(apiKey);
            // Get most recent superkey timestamp
            const { data: superkeys, error: superkeysError } = await this.supabase.rpc("get_user_emojikeys_by_type", {
                input_user_id: userId,
                input_model: modelId,
                input_emojikey_type: "super",
                history_limit: 1
            });
            if (superkeysError)
                throw new Error(`Failed to get superkeys: ${superkeysError.message}`);
            // Get normal keys
            let query;
            if (superkeys && superkeys.length > 0) {
                // Get last superkey creation time
                const lastSuperKeyTime = superkeys[0].created_at;
                // Count normal keys created after the last superkey
                const { data: count, error: countError } = await this.supabase.rpc("count_emojikeys_since_timestamp", {
                    input_user_id: userId,
                    input_model: modelId,
                    input_timestamp: lastSuperKeyTime,
                    input_emojikey_type: "normal"
                });
                if (countError)
                    throw new Error(`Failed to count emojikeys: ${countError.message}`);
                return {
                    count: count || 0,
                    isSuperKeyTime: (count || 0) >= 10
                };
            }
            else {
                // No superkeys exist yet, count all normal keys
                const { data: count, error: countError } = await this.supabase.rpc("count_emojikeys_by_type", {
                    input_user_id: userId,
                    input_model: modelId,
                    input_emojikey_type: "normal"
                });
                if (countError)
                    throw new Error(`Failed to count emojikeys: ${countError.message}`);
                return {
                    count: count || 0,
                    isSuperKeyTime: (count || 0) >= 10
                };
            }
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`Emojikey count retrieval failed: ${error.message}`);
        }
    }
    async getEnhancedEmojikeyHistory(apiKey, modelId, normalKeyLimit = 10, superKeyLimit = 5) {
        try {
            const userId = await this.getUserIdFromApiKey(apiKey);
            // Get superkeys
            const { data: superkeys, error: superkeysError } = await this.supabase.rpc("get_user_emojikeys_by_type", {
                input_user_id: userId,
                input_model: modelId,
                input_emojikey_type: "super",
                history_limit: superKeyLimit
            });
            if (superkeysError)
                throw new Error(`Failed to get superkeys: ${superkeysError.message}`);
            // Get normal keys (most recent)
            const { data: recentKeys, error: recentKeysError } = await this.supabase.rpc("get_user_emojikeys_by_type", {
                input_user_id: userId,
                input_model: modelId,
                input_emojikey_type: "normal",
                history_limit: normalKeyLimit
            });
            if (recentKeysError)
                throw new Error(`Failed to get recent keys: ${recentKeysError.message}`);
            return {
                superkeys: (superkeys || []).map((record) => ({
                    emojikey: record.emojikey,
                    userId,
                    modelId,
                    timestamp: record.created_at,
                    emojikey_type: "super"
                })),
                recentKeys: (recentKeys || []).map((record) => ({
                    emojikey: record.emojikey,
                    userId,
                    modelId,
                    timestamp: record.created_at,
                    emojikey_type: "normal"
                }))
            };
        }
        catch (err) {
            const error = err;
            throw new EmojikeyError(`Enhanced emojikey history retrieval failed: ${error.message}`);
        }
    }
}
