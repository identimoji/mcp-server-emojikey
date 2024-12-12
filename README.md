# emojikey-server MCP Server

MCP Protocol for persisting LLM interaction style as emojikeys

This server allows LLMs to maintain consistent interaction styles across conversations using emoji-based context keys ("emojikeys").

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
    "emojikey": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-emojikey"],
      "env": {
        "EMOJIKEYIO_API_KEY": "your-api-key",
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
