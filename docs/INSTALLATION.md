# Emojikey MCP Server: Installation and Update Guide

This guide provides instructions for installing and updating the Emojikey MCP server with v3 support and conversation ID tracking.

## Prerequisites

- Node.js 18+ and npm
- Access to Supabase project
- API credentials for emojikey service

## New Installation

1. **Clone the repository**

```bash
git clone https://github.com/identimoji/mcp-server-emojikey.git
cd mcp-server-emojikey
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Build the server**

```bash
npm run build
```

5. **Start the server**

```bash
node build/index.js
```

## Updating from v0.2.x to v0.3.x

1. **Pull the latest changes**

```bash
git pull origin main
```

2. **Update dependencies (new uuid package)**

```bash
npm install uuid @types/uuid --save
npm install
```

3. **Update environment variables**

```bash
# Add these variables to your existing .env file
SUPABASE_URL=https://dasvvxptyafaiwkmmmqz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
USE_EDGE_FUNCTIONS=true
```

4. **Rebuild and restart**

```bash
npm run build
node build/index.js
```

## Configuration Options

### Required Environment Variables:

- `EMOJIKEYIO_API_KEY`: API key for the emojikey service
- `SUPABASE_URL`: URL for your Supabase project
- `SUPABASE_ANON_KEY`: Anonymous key for your Supabase project

### Optional Environment Variables:

- `MODEL_ID`: The model ID to use in the database (default: "default")
- `USE_EDGE_FUNCTIONS`: Whether to use Supabase Edge Functions (default: true)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)

## Verifying the Installation

1. **Check that the server is running**

```bash
curl http://localhost:3000/healthcheck
```

2. **Verify MCP tool list**

```bash
curl -X POST http://localhost:3000/mcp/tools
```

You should see a list of available tools including `initialize_conversation`, `get_emojikey`, `set_emojikey`, and `get_emojikey_history`.

## Troubleshooting

- **Edge Function errors**: Check Supabase logs for more details
- **Connection issues**: Verify API keys and URLs in your .env file
- **UUID errors**: Make sure uuid package is installed
- **Database errors**: Check that the emojikeys_v3, emojikey_updates, and pair_registry tables exist in your Supabase project

### Fixing the "Supabase configuration missing: URL" Error

If you encounter this error with the MCP server, try these steps:

1. **Rebuild the project**:
   ```bash
   npm run build
   ```

2. **Create or update your .env file**:
   ```bash
   cp .env.example .env
   # Then edit .env with your actual Supabase credentials
   ```

3. **Verify config.ts has fallback values**:
   The config.ts file should have fallback values defined, like:
   ```typescript
   export const SUPABASE_CONFIG = {
     URL: process.env.SUPABASE_URL || "https://dasvvxptyafaiwkmmmqz.supabase.co",
     KEY: process.env.SUPABASE_ANON_KEY || "your_fallback_key_here",
   } as const;
   ```

4. **Run in verbose mode to see more details**:
   ```bash
   DEBUG=* node build/index.js
   ```

5. **Check environment loading order**:
   Make sure dotenv is being loaded before any code tries to access environment variables.

6. **Restart the MCP server**:
   Sometimes a clean restart after updating environment variables helps.

## Edge Function Deployment

The Edge Functions should be deployed separately to your Supabase project. See the `CONVERSATION_ID.md` file for more details on how conversation IDs work with the Edge Functions.
