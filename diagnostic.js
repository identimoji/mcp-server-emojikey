#!/usr/bin/env node
// diagnostic.js - Debug script for MCP server issues

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔍 EMOJIKEY MCP SERVER DIAGNOSTICS");
console.log("=====================================");

// 1. Check environment variables
console.log("\n1. Environment Variables:");
console.log("- EMOJIKEYIO_API_KEY:", process.env.EMOJIKEYIO_API_KEY ? "✅ Set" : "❌ Missing");
console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("- SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
console.log("- MODEL_ID:", process.env.MODEL_ID || "default (fallback)");

// 2. Check files exist
console.log("\n2. File Structure:");
const filesToCheck = [
  'src/config.ts',
  'src/handlers.ts',
  'src/service.ts',
  'src/index.ts',
  'docs/preamble_v3.md',
  'build/index.js'
];

filesToCheck.forEach(file => {
  try {
    const fullPath = join(__dirname, file);
    readFileSync(fullPath);
    console.log(`- ${file}: ✅ Exists`);
  } catch (error) {
    console.log(`- ${file}: ❌ Missing`);
  }
});

// 3. Test Supabase connection
console.log("\n3. Supabase Connection Test:");
try {
  const supabaseUrl = process.env.SUPABASE_URL || "https://dasvvxptyafaiwkmmmqz.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhc3Z2eHB0eWFmYWl3a21tbXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTM1NjEsImV4cCI6MjA0OTE4OTU2MX0.y9L2TahBajkUPQGJJ15kEckMK3sZDzuNL-2Mrmg_KoU";
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test basic connection
  const { data, error } = await supabase
    .from('mcp_preamble_data')
    .select('count(*)')
    .limit(1);
    
  if (error) {
    console.log(`- Supabase connection: ❌ Error - ${error.message}`);
  } else {
    console.log("- Supabase connection: ✅ Success");
    console.log(`- mcp_preamble_data view: ✅ Accessible`);
  }
} catch (error) {
  console.log(`- Supabase connection: ❌ Exception - ${error.message}`);
}

// 4. Test JSON parsing
console.log("\n4. JSON Parsing Test:");
try {
  const testObject = { test: "data" };
  const jsonString = JSON.stringify(testObject);
  const parsed = JSON.parse(jsonString);
  console.log("- JSON parsing: ✅ Working");
} catch (error) {
  console.log(`- JSON parsing: ❌ Error - ${error.message}`);
}

// 5. Check TypeScript compilation
console.log("\n5. Build Status:");
try {
  const buildPath = join(__dirname, 'build', 'index.js');
  const buildContent = readFileSync(buildPath, 'utf-8');
  if (buildContent.includes('setupToolHandlers')) {
    console.log("- Build compilation: ✅ Looks good");
  } else {
    console.log("- Build compilation: ⚠️  Incomplete");
  }
} catch (error) {
  console.log("- Build compilation: ❌ Build files missing");
}

console.log("\n=====================================");
console.log("✅ = Working | ❌ = Problem | ⚠️  = Check needed");
console.log("\nIf any items show ❌, fix those first before testing MCP server.");
