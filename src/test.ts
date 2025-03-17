// src/test.ts
import { SupabaseEmojikeyService } from "./service.supabase.js";

async function test() {
  process.env.EMOJIKEYIO_API_KEY = "ek_test123";
  const service = new SupabaseEmojikeyService();

  try {
    console.log("\n=== Testing Get Emojikey ===");
    const result = await service.getEmojikey(
      "ek_test123",
      "Claude-3-7-Sonnet-20250219",
    );
    console.log("Get Success:", result);

    console.log("\n=== Testing Set Emojikey ===");
    const newEmojikey = "🎯🌟🚀✨💫"; // Test emoji sequence
    await service.setEmojikey(
      "ek_test123",
      "Claude-3-7-Sonnet-20250219",
      newEmojikey,
    );
    console.log("Set Success: Emojikey created");

    console.log("\n=== Testing Get History ===");
    const history = await service.getEmojikeyHistory(
      "ek_test123",
      "Claude-3-7-Sonnet-20250219",
      5,
    );
    console.log("History Success:", history);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  }
}

test();
