#!/bin/bash
# build-simple.sh - Build a simplified version without the coding features

# Make this script executable
chmod +x build-simple.sh

# Create temporary tsconfig for simplified build
cat > tsconfig.simple.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "./build-simple",
    "rootDir": "./src",
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/index.simplified.ts", 
    "src/handlers.ts",
    "src/service.ts",
    "src/service.local.ts",
    "src/service.supabase.ts",
    "src/config.ts",
    "src/types.ts"
  ],
  "exclude": [
    "node_modules", 
    "build", 
    "src/edge-functions/**/*",
    "src/code_analyzer.ts",
    "src/coding_dimensions.ts",
    "src/handlers_integration.ts",
    "src/handlers_coding.ts",
    "src/vector_config.ts"
  ]
}
EOF

# Run the build process
echo "Building simplified version..."
npx tsc -p tsconfig.simple.json && \
mkdir -p build-simple/edge-functions && \
chmod +x build-simple/index.simplified.js && \
cp build-simple/index.simplified.js build-simple/index.js

# Clean up
echo "Simplified build completed."
echo "You can run the server with: node build-simple/index.js"