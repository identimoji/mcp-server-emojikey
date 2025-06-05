# Emojikey V3: Conversation ID Implementation Guide

This guide explains how to use the new conversation ID feature in Emojikey V3 to track state for individual conversations.

## Overview

The conversation ID feature allows each conversation to maintain its own independent emojikey state. This is important because:

1. It prevents cross-contamination between different conversation contexts
2. It enables more accurate tracking of relationship dynamics
3. It supports multi-conversation scenarios with the same user/model pair

## How Conversation IDs Work

1. When a conversation begins, `initialize_conversation` generates a unique conversation ID
2. This ID is included in the response text at the end
3. The AI should capture and use this ID for all subsequent emojikey operations
4. Each emojikey is stored with its associated conversation ID

## Troubleshooting Edge Functions

If you see "Emojikey set successfully (fallback to legacy mode)" messages, it means the Edge Functions aren't working properly. Try these steps:

### 1. Verify Edge Functions Are Deployed

Check if the required Edge Functions are deployed in your Supabase project:

```bash
supabase functions list
```

You should see `updateEmojikey`, `getLatestEmojikey`, and `getEmojikeyHistory` in the list.

### 2. Test Edge Functions Directly

Test the Edge Functions directly using curl:

```bash
# Replace with your actual values
SUPABASE_URL="https://dasvvxptyafaiwkmmmqz.supabase.co"
SUPABASE_KEY="your-anon-key"

# Test updateEmojikey function
curl -X POST "${SUPABASE_URL}/functions/v1/updateEmojikey" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "model_id": "test", "conversation_id": "test", "emojikey": "[ME|🧠🎨8∠45]"}'
```

### 3. Check Edge Function Logs

Check the logs for your Edge Functions in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Select the function that's failing
4. Check the Logs tab for error messages

### 4. Ensure Database Tables Exist

The Edge Functions require these database tables:
- `emojikeys_v3`: Stores emojikeys with conversation IDs
- `emojikey_updates`: Tracks updates to emojikeys
- `pair_registry`: Records emoji pair meanings

## AI Integration Guide

When using the emojikey system from an AI assistant, follow these steps:

### 1. Initialize the Conversation

Start every conversation by calling `initialize_conversation`:

```
// No parameters needed for initialization
initialize_conversation()
```

The response will include a conversation ID:
```
Emojikey System v3: [COMPONENT|emoji₁emoji₂N∠A|...] tracks interaction patterns...
Recent Keys (current context):
...
Conversation ID: conv_3f9a72e1-b85c-4d2d-a9f1-7c6e4b2e1d3f
```

### 2. Use the Conversation ID in All Operations

When setting emojikeys:
```
set_emojikey(
  emojikey: "[ME|🧠🎨8∠45|🔒🔓9∠60]",
  conversation_id: "conv_3f9a72e1-b85c-4d2d-a9f1-7c6e4b2e1d3f"
)
```

When getting emojikeys:
```
get_emojikey(
  conversation_id: "conv_3f9a72e1-b85c-4d2d-a9f1-7c6e4b2e1d3f"
)
```

When retrieving history:
```
get_emojikey_history(
  conversation_id: "conv_3f9a72e1-b85c-4d2d-a9f1-7c6e4b2e1d3f",
  limit: 10
)
```

## Fallback Mechanisms

The system includes fallback mechanisms to handle backward compatibility:

1. If no conversation ID is provided, the system falls back to legacy v2 behavior
2. If Edge Functions fail, the system falls back to standard service methods
3. Error handling ensures graceful degradation if issues occur

## Benefits of Conversation-Based State

- **Context-Specific Analysis**: Each conversation maintains its own relationship state
- **Multi-Context Support**: Different contexts (creative, educational, professional) each have their own tracked dynamics
- **Improved Accuracy**: Relationship tracking is more precise and relevant to the current conversation

## Implementation Notes

- The conversation ID is a UUID generated during initialization
- IDs are included in text responses as a line at the end
- All Edge Functions are designed to handle conversation-specific queries
- Vector operations work on conversation-specific subsets
