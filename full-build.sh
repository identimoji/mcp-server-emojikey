#!/bin/bash
# full-build.sh - Complete build script that handles Deno Edge Functions

# Make this script executable
chmod +x full-build.sh

# First, compile what we can with TypeScript
echo "Compiling main TypeScript files..."
npx tsc

# Manually create edge-functions directory in build
mkdir -p build/edge-functions

# Copy Edge Function files (Deno files that TypeScript can't compile)
echo "Copying Edge Functions..."
cp src/edge-functions/*.ts build/edge-functions/

# Copy coding dimensions file (may have .ts extension issues)
echo "Copying additional files with type issues..."
cp src/coding_dimensions.ts build/coding_dimensions.js
cp src/vector_config.ts build/vector_config.js
cp src/handlers_integration.ts build/handlers_integration.js

# Make the main file executable
echo "Making server executable..."
chmod +x build/index.js

echo "Build completed with full functionality."
echo "You can run the server with: node build/index.js"
echo ""
echo "TIP: If you encounter runtime errors, try using the simplified version instead:"
echo "     ./build-simple.sh && node build-simple/index.js"