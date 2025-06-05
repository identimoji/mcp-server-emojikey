// Edge Function: analyzeCodingContext.ts
// This function analyzes conversation for coding context and updates the emojikey accordingly

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CODING_DIMENSIONS } from '../coding_dimensions.ts';

// Supabase client initialization
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for incoming request
interface AnalyzeRequest {
  user_id: string;
  model_id: string;
  conversation_id: string;
  conversation_sample: string; // Recent conversation text for analysis
  current_emojikey?: string;   // Current emojikey if available
}

// Interface for programming language analysis
interface LanguageSignature {
  language: string;
  patterns: string[];
  keywords: string[];
  score: number;
}

// Define language signatures for detection
const LANGUAGE_SIGNATURES: LanguageSignature[] = [
  {
    language: "JavaScript",
    patterns: ["const ", "let ", "function(", "() =>", "===", "!==", "async/await", "Promise"],
    keywords: ["javascript", "js", "node", "npm", "react", "vue", "angular", "express"],
    score: 0
  },
  {
    language: "TypeScript",
    patterns: ["interface ", "type ", ": string", ": number", ": boolean", "<T>", "implements ", "extends "],
    keywords: ["typescript", "ts", "angular", "react", "type safety", "generics"],
    score: 0
  },
  {
    language: "Python",
    patterns: ["def ", "class ", "import ", "from ", "__init__", "self.", "if __name__ == \"__main__\":", "->"],
    keywords: ["python", "py", "django", "flask", "numpy", "pandas", "pytorch", "tensorflow"],
    score: 0
  },
  {
    language: "Java",
    patterns: ["public class", "private ", "protected ", "@Override", "implements ", "extends ", "void ", "new "],
    keywords: ["java", "spring", "maven", "gradle", "jvm", "jdbc", "hibernate", "tomcat"],
    score: 0
  },
  {
    language: "C#",
    patterns: ["namespace ", "using ", "public class", "private ", "protected ", "async Task", "var ", "=>"],
    keywords: ["c#", "csharp", ".net", "asp.net", "dotnet", "linq", "entity framework", "visual studio"],
    score: 0
  },
  {
    language: "SQL",
    patterns: ["SELECT ", "FROM ", "WHERE ", "JOIN ", "GROUP BY", "ORDER BY", "INSERT INTO", "UPDATE "],
    keywords: ["sql", "database", "query", "postgresql", "mysql", "sqlite", "relational database", "supabase"],
    score: 0
  },
  {
    language: "Rust",
    patterns: ["fn ", "let mut", "struct ", "impl ", "match ", "enum ", "Option<", "Result<"],
    keywords: ["rust", "cargo", "crate", "ownership", "borrowing", "lifetime", "rust-lang", "rustc"],
    score: 0
  },
  {
    language: "HTML/CSS",
    patterns: ["<div>", "<span>", "<p>", "<a href", "<script", "<link", "class=\"", "id=\""],
    keywords: ["html", "css", "web development", "frontend", "dom", "stylesheet", "responsive", "selector"],
    score: 0
  }
];

// Development patterns to detect
const DEVELOPMENT_PATTERNS = {
  debugging: ["debug", "error", "exception", "bug", "fix", "issue", "crash", "log", "trace", "stacktrace"],
  architecture: ["architecture", "design pattern", "interface", "abstract", "dependency", "component", "module", "service"],
  performance: ["performance", "optimize", "efficiency", "speed", "memory", "cpu", "latency", "bottleneck"],
  security: ["security", "vulnerability", "authentication", "authorization", "encrypt", "hash", "protect", "sanitize"],
  testing: ["test", "unit test", "integration test", "mock", "stub", "assertion", "coverage", "spec"]
};

// Detect coding context in conversation sample
function detectCodingContext(text: string): { 
  isCodingContext: boolean;
  dominantLanguages: { language: string, score: number }[];
  devPatterns: Record<string, number>;
} {
  // Reset language scores
  LANGUAGE_SIGNATURES.forEach(lang => lang.score = 0);
  
  // Score each language
  LANGUAGE_SIGNATURES.forEach(lang => {
    // Check for patterns (code snippets)
    lang.patterns.forEach(pattern => {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) lang.score += matches.length * 2; // Patterns are stronger indicators
    });
    
    // Check for keywords (discussion about language)
    lang.keywords.forEach(keyword => {
      const matches = text.match(new RegExp('\\b' + keyword + '\\b', 'gi'));
      if (matches) lang.score += matches.length;
    });
  });
  
  // Detect development patterns
  const devPatterns: Record<string, number> = {};
  Object.entries(DEVELOPMENT_PATTERNS).forEach(([category, patterns]) => {
    devPatterns[category] = 0;
    patterns.forEach(pattern => {
      const matches = text.match(new RegExp('\\b' + pattern + '\\b', 'gi'));
      if (matches) devPatterns[category] += matches.length;
    });
  });
  
  // Get dominant languages (score > 3)
  const dominantLanguages = LANGUAGE_SIGNATURES
    .filter(lang => lang.score > 3)
    .map(lang => ({ language: lang.language, score: lang.score }))
    .sort((a, b) => b.score - a.score);
  
  // Determine if this is a coding context (at least one dominant language or strong dev pattern)
  const isCodingContext = 
    dominantLanguages.length > 0 || 
    Object.values(devPatterns).some(score => score > 3);
  
  return {
    isCodingContext,
    dominantLanguages,
    devPatterns
  };
}

// Generate coding-focused emojikey based on context analysis
function generateCodingEmojikey(
  analysis: ReturnType<typeof detectCodingContext>,
  currentEmojikey?: string
): string {
  // Start with default dimensions if we need to create from scratch
  let dimensions = [
    { pair: "💻🔧", magnitude: 7, angle: 90 }, // Default: balanced implementation focus
    { pair: "🧩🧠", magnitude: 7, angle: 90 }  // Default: balanced problem solving
  ];
  
  // Adjust dimensions based on detected patterns
  if (analysis.devPatterns.debugging > 3) {
    dimensions.push({ pair: "🐞📚", magnitude: 8, angle: 30 }); // Practical debugging
  }
  
  if (analysis.devPatterns.architecture > 3) {
    dimensions[0] = { pair: "💻🔧", magnitude: 8, angle: 150 }; // Architecture focus
    dimensions.push({ pair: "📦🔧", magnitude: 7, angle: 140 }); // Higher abstractions
  }
  
  if (analysis.devPatterns.performance > 3) {
    dimensions.push({ pair: "🏗️🔍", magnitude: 8, angle: 150 }); // Improving code
  }
  
  if (analysis.devPatterns.security > 3) {
    dimensions.push({ pair: "🚀🛡️", magnitude: 8, angle: 150 }); // Security focus
  }
  
  if (analysis.devPatterns.testing > 3) {
    dimensions.push({ pair: "🔄📊", magnitude: 7, angle: 150 }); // Process-oriented
  }
  
  // Format the emojikey string
  const dimensionString = dimensions
    .map(d => `${d.pair}${d.magnitude}∠${d.angle}`)
    .join('|');
  
  return `[ME|${dimensionString}]`;
}

// Main handler function
Deno.serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const { user_id, model_id, conversation_id, conversation_sample, current_emojikey } = await req.json() as AnalyzeRequest;
    
    // Validate required parameters
    if (!user_id || !model_id || !conversation_id || !conversation_sample) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Analyze the conversation text for coding context
    const analysis = detectCodingContext(conversation_sample);
    
    // Generate appropriate emojikey for the coding context
    let responseData: any = { is_coding_context: analysis.isCodingContext };
    
    if (analysis.isCodingContext) {
      // Generate coding-specific emojikey
      const codingEmojikey = generateCodingEmojikey(analysis, current_emojikey);
      
      // Store the emojikey in the database
      const { data, error } = await supabase.rpc('update_emojikey_v3', {
        input_user_id: user_id,
        input_model_id: model_id,
        input_conversation_id: conversation_id,
        input_emojikey: codingEmojikey
      });
      
      if (error) throw error;
      
      // Include analysis details in response
      responseData = {
        ...responseData,
        emojikey: codingEmojikey,
        dominant_languages: analysis.dominantLanguages,
        development_patterns: analysis.devPatterns,
        dimensions: CODING_DIMENSIONS.map(d => ({ 
          pair: d.pair, 
          name: d.name,
          description: d.description 
        }))
      };
    }
    
    // Return the response - Use null, 0 to prevent pretty printing and control characters
    return new Response(
      JSON.stringify(responseData, null, 0),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle errors
    console.error("Error in analyzeCodingContext:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }, null, 0),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});