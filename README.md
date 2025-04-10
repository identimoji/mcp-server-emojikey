# mcp-server-emojikey

MCP server for persisting LLM relationship context as emoji-based memory keys. This allows Claude to maintain consistent interaction styles and remember relationship context across conversations.

## Usage with Claude Desktop

Get your API key from [emojikey.io](https://emojikey.io) and add this to your config:

```json
{
  "mcpServers": {
    "emojikey": {
      "command": "npx",
      "args": ["@identimoji/mcp-server-emojikey"],
      "env": {
        "EMOJIKEYIO_API_KEY": "your-api-key-from-emojikey.io",
        "MODEL_ID": "Claude-3-5-Sonnet-20241022"
      }
    }
  }
}
```

Config locations:
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

First-time usage: Tell Claude to "Set emojikey". On subsequent conversations, Claude will automatically use this key to maintain context.

## Tools

- `initialize_conversation` - Get current emojikey at start of conversation
- `get_emojikey` - Retrieve current emojikey when requested
- `set_emojikey` - Create and store a new emojikey
- `create_superkey` - Create a compressed superkey (after 10 regular emojikeys)
- `get_emojikey_history` - View previous emojikeys

## Superkeys

After creating 10 regular emojikeys, Claude will be prompted to create a superkey that compresses their meaning into a single key with format: `[[×10emoji-sequence]]`

This allows Claude to maintain a longer conversation history context.

> ⚠️ This is a beta version; the API may change in future updates.
