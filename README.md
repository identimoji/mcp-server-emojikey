# emojikey-server MCP Server

MCP Protocol for persisting LLM interaction style as emojikeys

This server allows LLMs to maintain consistent interaction styles across conversations using emoji-based context keys ("emojikeys").

Emojikeys are stored online, so you can use them accross devices and applications. No user information is stored other than the emojikeys.

If there is interest in a local-only version, or other suggestions, please reach out and let me know. Actively developing this concept now.

> 📝 **Note**
> Usage note: The first time you use the tool in Claude desktop, tell Claude to "Set emojikey" then next time you start a conversation, he will automatically use this key. You can ask to set vibe, or show emojikey history as well. Have fun!


> ⚠️ **Warning**
> This is a beta version, more features are planned, so the API may change.

## Features

### Emojikey Management
- Get current emojikey for a user/model combination
- Set new emojikeys during conversations
- Retrieve emojikey history
- Automatic API key generation and validation

### Tools
- `initialize_conversation` - Get current emojikey at start of conversation
- `get_emojikey` - Retrieve current emojikey
- `set_emojikey` - Update the emojikey
- `get_emojikey_history` - View previous emojikeys

## Installation

1. Get your API key from [emojikey.io](https://emojikey.io)

2. Add the server config to Claude Desktop:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-server-emojikey": {
      "command": "npx",
      "args": ["@identimoji/mcp-server-emojikey"],
      "env": {
        "EMOJIKEYIO_API_KEY": "your-api-key-goes-here", //get it from emojikey.io
        "MODEL_ID": "Claude-3-5-Sonnet-20241022"
      }
    }
  }
}
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

Test the server:
```bash
npm run test
```

### Environment Variables

- `EMOJIKEYIO_API_KEY` - Your emojikey.io API key
- `MODEL_ID` - Identifier for the LLM model (e.g., "Claude-3-5-Sonnet-20241022")

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend:

1. Using the test script: `npm run test`
2. Using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):
```bash
npm run inspector
```
