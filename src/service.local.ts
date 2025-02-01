import { EmojikeyService, EmojikeyError } from "./service.js";
import { Emojikey } from "./types.js";
import * as fs from 'fs/promises';
import * as path from 'path';

interface LocalEmojikeyRecord {
  emojikey: string;
  modelId: string;
  userId: string;
  timestamp: string;
}

export class LocalEmojikeyService implements EmojikeyService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), '.emojikey');
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err) {
      throw new EmojikeyError('Failed to create data directory');
    }
  }

  private getFilePath(userId: string, modelId: string): string {
    return path.join(this.dataDir, `${userId}-${modelId}.json`);
  }

  private async readRecords(userId: string, modelId: string): Promise<LocalEmojikeyRecord[]> {
    const filePath = this.getFilePath(userId, modelId);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new EmojikeyError('Failed to read emojikey records');
    }
  }

  private async writeRecords(userId: string, modelId: string, records: LocalEmojikeyRecord[]) {
    const filePath = this.getFilePath(userId, modelId);
    try {
      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
    } catch (err) {
      throw new EmojikeyError('Failed to write emojikey records');
    }
  }

  async getEmojikey(apiKey: string, modelId: string): Promise<Emojikey> {
    // For local storage, we'll use apiKey as userId
    const records = await this.readRecords(apiKey, modelId);
    if (records.length === 0) {
      throw new EmojikeyError('No emojikey found');
    }
    return records[records.length - 1];
  }

  async setEmojikey(apiKey: string, modelId: string, emojikey: string): Promise<void> {
    const records = await this.readRecords(apiKey, modelId);
    const newRecord: LocalEmojikeyRecord = {
      emojikey,
      userId: apiKey,
      modelId,
      timestamp: new Date().toISOString()
    };
    records.push(newRecord);
    await this.writeRecords(apiKey, modelId, records);
  }

  async getEmojikeyHistory(apiKey: string, modelId: string, limit: number = 10): Promise<Emojikey[]> {
    const records = await this.readRecords(apiKey, modelId);
    return records.slice(-limit);
  }
}