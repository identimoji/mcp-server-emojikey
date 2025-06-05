import { EmojikeyError } from "./service.js";
import * as fs from 'fs/promises';
import * as path from 'path';
export class LocalEmojikeyService {
    dataDir;
    constructor() {
        this.dataDir = path.join(process.cwd(), '.emojikey');
        this.ensureDataDir();
    }
    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        }
        catch (err) {
            throw new EmojikeyError('Failed to create data directory');
        }
    }
    getFilePath(userId, modelId) {
        return path.join(this.dataDir, `${userId}-${modelId}.json`);
    }
    async readRecords(userId, modelId) {
        const filePath = this.getFilePath(userId, modelId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw new EmojikeyError('Failed to read emojikey records');
        }
    }
    async writeRecords(userId, modelId, records) {
        const filePath = this.getFilePath(userId, modelId);
        try {
            await fs.writeFile(filePath, JSON.stringify(records, null, 2));
        }
        catch (err) {
            throw new EmojikeyError('Failed to write emojikey records');
        }
    }
    // Adding the missing method
    async getUserIdFromApiKey(apiKey) {
        // For local storage, we'll use apiKey directly as userId
        // In a real implementation, this would look up the user ID from the API key
        return apiKey;
    }
    async getEmojikey(apiKey, modelId) {
        // For local storage, we'll use apiKey as userId
        const records = await this.readRecords(apiKey, modelId);
        if (records.length === 0) {
            throw new EmojikeyError('No emojikey found');
        }
        return records[records.length - 1];
    }
    async setEmojikey(apiKey, modelId, emojikey, emojikey_type = "normal") {
        const records = await this.readRecords(apiKey, modelId);
        const newRecord = {
            emojikey,
            userId: apiKey,
            modelId,
            timestamp: new Date().toISOString(),
            emojikey_type
        };
        records.push(newRecord);
        await this.writeRecords(apiKey, modelId, records);
    }
    async getEmojikeyHistory(apiKey, modelId, limit = 10) {
        const records = await this.readRecords(apiKey, modelId);
        return records.slice(-limit);
    }
    async getEnhancedEmojikeyHistory(apiKey, modelId, normalKeyLimit = 10, superKeyLimit = 5) {
        const allRecords = await this.readRecords(apiKey, modelId);
        // Filter records by emojikey_type
        const superkeys = allRecords
            .filter(record => record.emojikey_type === "super")
            .slice(-superKeyLimit);
        const regularKeys = allRecords
            .filter(record => !record.emojikey_type || record.emojikey_type === "normal")
            .slice(-normalKeyLimit);
        return {
            superkeys,
            recentKeys: regularKeys
        };
    }
    async getEmojikeyCountSinceLastSuperkey(apiKey, modelId) {
        const allRecords = await this.readRecords(apiKey, modelId);
        // Sort records by timestamp in descending order
        const sortedRecords = [...allRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Find the index of the most recent superkey
        const superKeyIndex = sortedRecords.findIndex(record => record.emojikey_type === "super");
        let count = 0;
        if (superKeyIndex === -1) {
            // No superkey found, count all normal keys
            count = sortedRecords.filter(record => !record.emojikey_type || record.emojikey_type === "normal").length;
        }
        else {
            // Get the timestamp of the most recent superkey
            const lastSuperKeyTime = new Date(sortedRecords[superKeyIndex].timestamp);
            // Count normal keys created after the last superkey
            count = sortedRecords.filter(record => (!record.emojikey_type || record.emojikey_type === "normal") &&
                new Date(record.timestamp) > lastSuperKeyTime).length;
        }
        return {
            count,
            isSuperKeyTime: count >= 10
        };
    }
}
