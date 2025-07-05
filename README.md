[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/identimoji-mcp-server-emojikey-badge.png)](https://mseep.ai/app/identimoji-mcp-server-emojikey)

# mcp-server-emojikey

[![smithery badge](https://smithery.ai/badge/@identimoji/mcp-server-emojikey)](https://smithery.ai/server/@identimoji/mcp-server-emojikey)

MCP server for persisting LLM relationship context as emoji-based memory keys. This allows Claude to maintain consistent interaction styles and remember relationship context across conversations.

Emojikeys are stored online, so you can use them across devices and applications. No user information is stored other than the emojikeys.

## Building and Running

There are multiple ways to build and run the server:

### Quick Start (Recommended)

```bash
# Install dependencies
npm install

# Build the project (all TypeScript errors fixed)
npm run build

# Run the server (coding features disabled by default)
npm run start

# Optional: Run with coding features enabled
CODE_MODE=true npm run start
```

### Alternative Build Options

For more build options, see [BUILD_OPTIONS.md](BUILD_OPTIONS.md) which includes:

1. Standard Build with Coding Features Disabled (recommended)
2. Full Build with All Features (if you need coding dimensions)
3. Simplified Build without Coding Files (alternative stable option)

<a href="https://glama.ai/mcp/servers/e042rg25ct">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/e042rg25ct/badge" alt="emojikey-server Server MCP server" />
</a>

> 📝 **Note**
> Usage note: The first time you use the tool in Claude desktop, tell Claude to "Set emojikey" then next time you start a conversation, he will automatically use this key. You can ask to set vibe, or show emojikey history as well. Have fun!

> ⚠️ **Warning**
> This is a beta version, more features are planned, so the API may change.

## Usage with Claude Desktop

Get your API key from [emojikey.io](https://emojikey.io) and add this to your config:

```json
{
  "mcpServers": {
    "emojikey": {
      "command": "npx",
      "args": ["-y", "@identimoji/mcp-server-emojikey"],
      "env": {
        "EMOJIKEYIO_API_KEY": "your-api-key-from-emojikey.io",
        "MODEL_ID": "Claude-3-7-Sonnet",
        "CODE_MODE": "false" // Set to "true" to enable coding features
      }
    }
  }
}
```

Note: The `-y` flag in the `args` array tells npx to skip confirmation prompts when installing packages.

Config locations:
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

First-time usage: Tell Claude to "Set emojikey". On subsequent conversations, Claude will automatically use this key to maintain context.

### Emojikey Initialization Display

When initializing a conversation, the server now displays:

1. **Starting Key** - The most recent key or baseline key if no history exists
2. **Aggregated Keys** - Time-based summaries of your emojikey history:
   - **Lifetime** - Aggregated key from all your previous conversations
   - **90-day** - Aggregated key from the past 90 days (if available)
   - **30-day** - Aggregated key from the past 30 days (if available)
   - **7-day** - Aggregated key from the past 7 days (if available)
   - **24-hour** - Aggregated key from the past 24 hours (if available)
3. **Conversation ID** - Used for tracking keys within each conversation

## Environment Variables

You can customize the behavior with these environment variables:

- `EMOJIKEYIO_API_KEY` - Your API key from emojikey.io
- `MODEL_ID` - The Claude model ID (e.g., "Claude-3-7-Sonnet")
- `CODE_MODE` - Set to "true" to enable coding dimensions (disabled by default, may show safe-to-ignore integration warnings)
- `SUPABASE_URL` - Custom Supabase URL (optional)
- `SUPABASE_ANON_KEY` - Custom Supabase anonymous key (optional)

## Tools

- `initialize_conversation` - Get current emojikey at start of conversation
- `get_emojikey` - Retrieve current emojikey when requested
- `set_emojikey` - Create and store a new emojikey
- `create_superkey` - Create a compressed superkey (after 10 regular emojikeys)
- `get_emojikey_history` - View previous emojikeys

## New in v0.3.1: Coding Context Support

This version includes special dimensions for tracking programming-related interaction patterns:

- 💻🔧 (ImplementationFocus) - Balance between high-level design and implementation details
- 🏗️🔍 (CodeScope) - Building new features vs. improving existing code
- 🧩🧠 (ProblemSolving) - Practical vs. analytical approaches to coding problems
- 🔄📊 (ProcessVsResults) - Emphasizing coding process vs. outcomes
- 📚🧪 (LearnVsApply) - Teaching programming concepts vs. applying them
- 🚀🛡️ (SpeedVsSecurity) - Development speed vs. security considerations
- 👥💻 (CollaborationStyle) - Solo coding vs. collaborative approaches
- 🧬🎨 (CodeStructuring) - Systematic vs. creative code organization
- 📦🔧 (AbstractionLevel) - Preference for abstraction vs. concrete implementations
- 🐞📚 (DebugApproach) - Practical vs. theoretical debugging approaches

These dimensions help Claude adapt to your programming style, providing the right balance of theoretical explanations and practical guidance.

### Example Coding Emojikey

```
[ME|💻🔧8∠45|🧩🧠7∠60|🐞📚6∠40]~[CONTENT|🏗️🔍9∠30|📚🧪8∠65]~[YOU|👥💻7∠70|🧬🎨8∠55]
```

This shows Claude positioning itself with a balanced implementation focus and somewhat analytical problem-solving approach, while perceiving the user as preferring collaborative coding with creative structuring.

## Angle Distribution and Dimension Balance

Emojikey angles represent positioning on each dimension:
- 0° represents one extreme of a dimension
- 90° represents a balanced center position
- 180° represents the opposite extreme

The current implementation assigns angles primarily in the 0-90° range. Future updates will improve angle distribution to better utilize the full 0-180° spectrum, providing more nuanced dimension positioning.

## Superkeys

After creating 10 regular emojikeys, Claude will be prompted to create a superkey that compresses their meaning into a single key with format: `[[×10emoji-sequence]]`

This allows Claude to maintain a longer conversation history context.

> ⚠️ This is a beta version; the API may change in future updates.
