// code_analyzer.ts - Code analysis utilities for emojikey context tracking
import { CODING_DIMENSIONS } from "./coding_dimensions.js";
import { EDGE_FUNCTION_CONFIG } from "./config.js";

// Interface for conversation analysis results
export interface CodeAnalysisResult {
  isCodingContext: boolean;
  dominantLanguages: { language: string; confidence: number }[];
  developmentFocus: {
    debugging: number;
    architecture: number;
    performance: number;
    security: number;
    testing: number;
    learning: number;
  };
  suggestedDimensions: {
    pair: string;
    magnitude: number;
    angle: number;
    reason: string;
  }[];
}

// Interface for code signatures to detect programming languages
interface CodeSignature {
  language: string;
  patterns: RegExp[];
  keywords: RegExp[];
}

// Define language detection patterns
const LANGUAGE_SIGNATURES: CodeSignature[] = [
  {
    language: "JavaScript/TypeScript",
    patterns: [
      /const\s+\w+\s*=/i,
      /let\s+\w+\s*=/i,
      /function\s+\w+\s*\(/i,
      /\w+\s*:\s*(string|number|boolean|any)/i,
      /interface\s+\w+\s*\{/i,
      /type\s+\w+\s*=/i,
      /import\s+.*from\s+['"]/i
    ],
    keywords: [
      /\bjavascript\b/i,
      /\btypescript\b/i,
      /\bnpm\b/i,
      /\bnode\b/i,
      /\breact\b/i,
      /\bangular\b/i,
      /\bvue\b/i,
      /\bts\b/i,
      /\bjs\b/i
    ]
  },
  {
    language: "Python",
    patterns: [
      /def\s+\w+\s*\(/i,
      /class\s+\w+\s*:/i,
      /import\s+\w+/i,
      /from\s+\w+\s+import/i,
      /if\s+__name__\s*==\s*('|")__main__('|"):/i
    ],
    keywords: [
      /\bpython\b/i,
      /\bpip\b/i,
      /\bdjango\b/i,
      /\bflask\b/i,
      /\bnumpy\b/i,
      /\bpandas\b/i
    ]
  },
  {
    language: "Java",
    patterns: [
      /public\s+class\s+\w+/i,
      /private\s+\w+\s+\w+/i,
      /protected\s+\w+\s+\w+/i,
      /import\s+java\./i,
      /System\.out\.println/i
    ],
    keywords: [
      /\bjava\b/i,
      /\bmaven\b/i,
      /\bgradle\b/i,
      /\bspring\b/i,
      /\bjvm\b/i
    ]
  },
  {
    language: "HTML/CSS",
    patterns: [
      /<html/i,
      /<div/i,
      /<head/i,
      /<body/i,
      /class=["']/i,
      /#\w+\s*{/i,
      /\.\w+\s*{/i
    ],
    keywords: [
      /\bhtml\b/i,
      /\bcss\b/i,
      /\bdom\b/i,
      /\bselector\b/i,
      /\bstylesheet\b/i
    ]
  },
  {
    language: "SQL",
    patterns: [
      /SELECT\s+.*\s+FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*\s+SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i
    ],
    keywords: [
      /\bsql\b/i,
      /\bdatabase\b/i,
      /\bquery\b/i,
      /\bjoin\b/i,
      /\bindex\b/i
    ]
  },
  {
    language: "C/C++",
    patterns: [
      /#include\s+[<"]/i,
      /int\s+main\s*\(\s*\)/i,
      /\w+::\w+/i,
      /std::/i,
      /nullptr/i
    ],
    keywords: [
      /\bc\+\+\b/i,
      /\bclang\b/i,
      /\bgcc\b/i,
      /\bcmake\b/i,
      /\bpointer\b/i
    ]
  }
];

// Development focus categories and their detection patterns
// Define a type for the focus categories that matches CodeAnalysisResult.developmentFocus structure
type DevelopmentFocusCategories = {
  debugging: RegExp[];
  architecture: RegExp[];
  performance: RegExp[];
  security: RegExp[];
  testing: RegExp[];
  learning: RegExp[];
};

const DEVELOPMENT_FOCUS: DevelopmentFocusCategories = {
  debugging: [
    /\bbug\b/i,
    /\bdebug\b/i,
    /\berror\b/i,
    /\bexception\b/i,
    /\bcrash\b/i,
    /\bissue\b/i,
    /\blog\b/i,
    /\btrace\b/i,
    /\bfix\b/i
  ],
  architecture: [
    /\barchitecture\b/i,
    /\bpattern\b/i,
    /\bdesign\b/i,
    /\binterface\b/i,
    /\babstract\b/i,
    /\bstructure\b/i,
    /\bcomponent\b/i,
    /\bmodule\b/i
  ],
  performance: [
    /\bperformance\b/i,
    /\boptimize\b/i,
    /\boptimization\b/i,
    /\bspeed\b/i,
    /\blatency\b/i,
    /\bmemory\b/i,
    /\bcpu\b/i,
    /\bbandwidth\b/i
  ],
  security: [
    /\bsecurity\b/i,
    /\bvulnerability\b/i,
    /\bauth\b/i,
    /\bencrypt\b/i,
    /\bhash\b/i,
    /\bpassword\b/i,
    /\bsanitize\b/i,
    /\binjection\b/i
  ],
  testing: [
    /\btest\b/i,
    /\bunit\s+test\b/i,
    /\bintegration\s+test\b/i,
    /\bmock\b/i,
    /\bassert\b/i,
    /\bcoverage\b/i,
    /\bspec\b/i,
    /\btesting\b/i
  ],
  learning: [
    /\blearn\b/i,
    /\bteach\b/i,
    /\bexplain\b/i,
    /\btutorial\b/i,
    /\bunderstand\b/i,
    /\bguide\b/i,
    /\bconcept\b/i,
    /\btheory\b/i
  ]
};

// Analyze conversation text for coding context
export function analyzeConversation(text: string): CodeAnalysisResult {
  // Initialize results
  const result: CodeAnalysisResult = {
    isCodingContext: false,
    dominantLanguages: [],
    developmentFocus: {
      debugging: 0,
      architecture: 0,
      performance: 0,
      security: 0,
      testing: 0,
      learning: 0
    },
    suggestedDimensions: []
  };

  // Look for code blocks which are strong indicators
  const codeBlockCount = (text.match(/```(\w+)?\n[\s\S]*?\n```/g) || []).length;
  if (codeBlockCount > 0) {
    result.isCodingContext = true;
  }

  // Detect programming languages
  const languageScores: Record<string, number> = {};
  
  LANGUAGE_SIGNATURES.forEach(signature => {
    let score = 0;
    
    // Check for language patterns in code
    signature.patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score += matches.length * 2; // Patterns are stronger indicators
    });
    
    // Check for language keywords in discussion
    signature.keywords.forEach(keyword => {
      const matches = text.match(keyword) || [];
      score += matches.length;
    });
    
    if (score > 0) {
      languageScores[signature.language] = score;
      result.isCodingContext = true;
    }
  });
  
  // Set dominant languages
  result.dominantLanguages = Object.entries(languageScores)
    .map(([language, score]) => ({ 
      language, 
      confidence: Math.min(0.99, score / 10) // Cap at 0.99
    }))
    .sort((a, b) => b.confidence - a.confidence);
  
  // Detect development focus
  Object.entries(DEVELOPMENT_FOCUS).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      // Use type assertion to tell TypeScript this is a valid key
      result.developmentFocus[category as keyof typeof result.developmentFocus] += matches.length;
    });
    
    // Normalize the score (0-10 scale)
    result.developmentFocus[category as keyof typeof result.developmentFocus] = 
      Math.min(10, result.developmentFocus[category as keyof typeof result.developmentFocus]);
  });
  
  // If we detected coding context, suggest dimensions
  if (result.isCodingContext) {
    // Suggest implementation focus dimension based on architecture vs debugging
    if (result.developmentFocus.architecture > 3 || result.developmentFocus.debugging > 3) {
      const archWeight = result.developmentFocus.architecture;
      const debugWeight = result.developmentFocus.debugging;
      
      // Calculate angle (0 = detailed implementation, 180 = high-level design)
      const angle = Math.round((archWeight / (archWeight + debugWeight)) * 180);
      
      result.suggestedDimensions.push({
        pair: "💻🔧",
        magnitude: 8,
        angle,
        reason: `Based on ${archWeight > debugWeight ? 'architectural discussion' : 'debugging focus'}`
      });
    }
    
    // Suggest problem-solving approach
    if (result.developmentFocus.learning > 3) {
      result.suggestedDimensions.push({
        pair: "🧩🧠",
        magnitude: 7,
        angle: 140, // More first-principles if learning is involved
        reason: "Based on learning/educational focus in conversation"
      });
    }
    
    // Suggest speed vs security dimension
    if (result.developmentFocus.security > 2 || result.developmentFocus.performance > 2) {
      const secWeight = result.developmentFocus.security;
      const perfWeight = result.developmentFocus.performance;
      
      // Calculate angle (0 = speed-focused, 180 = security-focused)
      const angle = Math.round((secWeight / (secWeight + perfWeight || 1)) * 180);
      
      result.suggestedDimensions.push({
        pair: "🚀🛡️",
        magnitude: 7,
        angle,
        reason: `Based on ${secWeight > perfWeight ? 'security concerns' : 'performance optimization'} in conversation`
      });
    }
    
    // Suggest building vs improving dimension
    if (result.developmentFocus.performance > 3) {
      result.suggestedDimensions.push({
        pair: "🏗️🔍",
        magnitude: 7,
        angle: 140, // More improvement-focused
        reason: "Based on performance optimization focus"
      });
    }
    
    // Suggest process vs results orientation
    if (result.developmentFocus.testing > 3) {
      result.suggestedDimensions.push({
        pair: "🔄📊",
        magnitude: 7,
        angle: 150, // More process-oriented
        reason: "Based on testing discussion in conversation"
      });
    }
    
    // Ensure we always have at least one dimension if this is a coding context
    if (result.suggestedDimensions.length === 0) {
      result.suggestedDimensions.push({
        pair: "💻🔧",
        magnitude: 6,
        angle: 90, // Balanced default
        reason: "Default coding dimension"
      });
    }
  }
  
  return result;
}

// Generate coding emojikey based on analysis
export function generateCodingEmojikey(analysis: CodeAnalysisResult): string {
  if (!analysis.isCodingContext || analysis.suggestedDimensions.length === 0) {
    return ""; // Not a coding context or no suggested dimensions
  }
  
  // Format dimensions string
  const dimensionsString = analysis.suggestedDimensions
    .map(dim => `${dim.pair}${dim.magnitude}∠${dim.angle}`)
    .join('|');
  
  return `[ME|${dimensionsString}]`;
}

// Call the Edge Function to analyze coding context
export async function callCodingContextAnalysis(
  userId: string, 
  modelId: string, 
  conversationId: string,
  conversationSample: string,
  currentEmojikey?: string
): Promise<any> {
  if (!EDGE_FUNCTION_CONFIG.ENABLED) {
    // If edge functions are disabled, fall back to local analysis
    const analysis = analyzeConversation(conversationSample);
    const emojikey = generateCodingEmojikey(analysis);
    
    return {
      is_coding_context: analysis.isCodingContext,
      emojikey: emojikey,
      dominant_languages: analysis.dominantLanguages,
      development_focus: analysis.developmentFocus,
      suggested_dimensions: analysis.suggestedDimensions
    };
  }
  
  try {
    // Get URL and key from config to avoid undefined process.env issues
    const url = EDGE_FUNCTION_CONFIG.URL || process.env.SUPABASE_URL;
    const key = EDGE_FUNCTION_CONFIG.KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error("Missing Supabase URL or key in environment variables");
    }
    
    // Call the Edge Function
    const response = await fetch(
      `${url}/functions/v1/analyzeCodingContext`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          user_id: userId,
          model_id: modelId,
          conversation_id: conversationId,
          conversation_sample: conversationSample,
          current_emojikey: currentEmojikey
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Function analyzeCodingContext failed: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (err) {
    // Type narrowing for the error
    const error = err as Error;
    console.error("Error calling coding context analysis:", error);
    
    // Fall back to local analysis if edge function fails
    const analysis = analyzeConversation(conversationSample);
    const emojikey = generateCodingEmojikey(analysis);
    
    return {
      is_coding_context: analysis.isCodingContext,
      emojikey: emojikey,
      fallback: true,
      error: error.message || String(error)
    };
  }
}