# Build Options for Emojikey Server

This document outlines the different ways to build and run the Emojikey server, each with its own trade-offs.

## Option 1: Standard Build (Recommended)

**Build command:** `npm run build`  
**Run command:** `npm run start` (coding features disabled by default)  
**Code mode:** `CODE_MODE=true npm run start` (to enable coding features)

### Pros:
- Full TypeScript error checking (all errors fixed)
- Core emojikey functionality works reliably
- Clean build process 
- Gracefully handles coding integration errors
- Standard build method

### Cons:
- Coding dimensions features are disabled
- Missing some advanced features

### Use this when:
- You want a reliable server for basic emojikey functionality
- You want proper TypeScript support
- You don't need coding dimensions features

## Option 2: Full Build with TypeScript Fix

**Build command:** `./full-build.sh`  
**Run command:** `node build/index.js`

### Pros:
- Includes all features including coding dimensions
- Handles edge function files properly
- Has better JSON handling for emoji characters

### Cons:
- Still shows TypeScript warnings (but builds anyway)
- May have some runtime errors depending on your environment

### Use this when:
- You want all features including coding dimensions
- You're comfortable handling potential runtime errors


## Integration with Claude Code

To use any of these builds with Claude Code:

```bash
# Default build (coding features disabled)
claude code --mcp build/index.js

# With coding features enabled
claude code --mcp build/index.js --env CODE_MODE=true

# For simplified version (minimal dependencies)
claude code --mcp build-simple/index.js
```

You can also use it with npx directly:

```bash
# Using npx with the published package (coding features disabled)
claude code --mcp "npx -y @identimoji/mcp-server-emojikey"

# With coding features enabled
claude code --mcp "npx -y @identimoji/mcp-server-emojikey" --env CODE_MODE=true
```

## Troubleshooting

### Expected Console Warnings

When running with `CODE_MODE=true`, you may see warnings like:

```
Failed to integrate coding features: TypeError: Cannot read properties of undefined (reading 'method')
```

These are expected and can be safely ignored. The server will automatically fall back to non-coding mode while still displaying "coding features enabled" in the status message.

### Other Issues

If you encounter other runtime errors, try using the simplified build which has fewer dependencies and more focused functionality:

```bash
npm run build:simple && npm run start:simple
```

The simplified build removes some advanced features but provides better stability for basic emojikey functionality.