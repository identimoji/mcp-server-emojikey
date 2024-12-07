import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "./config.js";
import { Emojikey } from "./types.js";
import { EmojikeyService, EmojikeyError } from "./service.js";

// Implements EmojikeyService interface using web API
export class ApiEmojikeyService implements EmojikeyService {
  private axiosInstance: AxiosInstance;

  // Initialize axios with base configuration
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: {
        Authorization: `Bearer ${API_CONFIG.API_KEY}`, // Add to requests
      },
    });
  }

  // Get current emojikey from API
  async getEmojikey(userId: string, modelId: string): Promise<Emojikey> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EMOJIKEY}/${userId}/${modelId}`,
      );

      return {
        key: response.data.emojikey,
        userId,
        modelId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new EmojikeyError(
          `API error: ${error.response?.data.message ?? error.message}`,
        );
      }
      throw error;
    }
  }

  // Set new emojikey via API
  async setEmojikey(
    userId: string,
    modelId: string,
    emojikey: string,
  ): Promise<void> {
    try {
      await this.axiosInstance.post(API_CONFIG.ENDPOINTS.EMOJIKEY, {
        userId,
        modelId,
        emojikey,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new EmojikeyError(
          `API error: ${error.response?.data.message ?? error.message}`,
        );
      }
      throw error;
    }
  }

  // Get history of emojikeys (if API supports it)
  async getEmojikeyHistory(
    userId: string,
    modelId: string,
    limit: number = 10,
  ): Promise<Emojikey[]> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EMOJIKEY}/${userId}/${modelId}/history?limit=${limit}`,
      );
      return response.data.history;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new EmojikeyError(
          `API error: ${error.response?.data.message ?? error.message}`,
        );
      }
      throw error;
    }
  }
}
