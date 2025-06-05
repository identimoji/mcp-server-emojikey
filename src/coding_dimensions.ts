// Coding-specific dimension pairs for emojikey v3
// These dimensions help track programming-related interaction styles

export interface DimensionPair {
  pair: string;          // The emoji pair (e.g., "💻🔧")
  name: string;          // Name of the dimension (e.g., "CodeImplementation")
  description: string;   // Description of what this dimension tracks
  lowDescription: string; // Meaning when angle is low (0-30°)
  midDescription: string; // Meaning when angle is mid (60-120°)
  highDescription: string; // Meaning when angle is high (150-180°)
}

// Coding-specific dimension pairs
export const CODING_DIMENSIONS: DimensionPair[] = [
  {
    pair: "💻🔧",
    name: "ImplementationFocus",
    description: "Tracks focus between high-level code design and low-level implementation details",
    lowDescription: "Detailed implementation focus, emphasizing specific code syntax and patterns",
    midDescription: "Balanced implementation approach, addressing both details and overall design",
    highDescription: "High-level design focus, emphasizing architecture and patterns over syntax"
  },
  {
    pair: "🏗️🔍",
    name: "CodeScope",
    description: "Tracks balance between building new features and improving existing code",
    lowDescription: "Emphasis on building new functionality and features",
    midDescription: "Balanced approach to building and refining code",
    highDescription: "Focus on refactoring, optimizing, and improving existing code"
  },
  {
    pair: "🧩🧠",
    name: "ProblemSolving",
    description: "Tracks approach to solving programming problems",
    lowDescription: "Practical, pattern-matching approach to programming solutions",
    midDescription: "Mixed approach using both patterns and first principles",
    highDescription: "First-principles, analytical approach to programming problems"
  },
  {
    pair: "🔄📊",
    name: "ProcessVsResults",
    description: "Tracks emphasis on coding process versus outcomes and results",
    lowDescription: "Results-oriented, focused on shipping working code quickly",
    midDescription: "Balanced attention to both process and results",
    highDescription: "Process-oriented, emphasizing best practices and proper methodology"
  },
  {
    pair: "📚🧪",
    name: "LearnVsApply",
    description: "Tracks balance between teaching programming concepts and applying them",
    lowDescription: "Applied focus, emphasizing practical code examples and implementations",
    midDescription: "Mixed approach with both explanation and application",
    highDescription: "Explanatory focus, emphasizing concepts, patterns, and theory"
  },
  {
    pair: "🚀🛡️",
    name: "SpeedVsSecurity",
    description: "Tracks emphasis on development speed versus security considerations",
    lowDescription: "Speed-focused, prioritizing rapid development and deployment",
    midDescription: "Balanced approach to speed and security concerns",
    highDescription: "Security-focused, prioritizing robust, safe code over quick solutions"
  },
  {
    pair: "👥💻",
    name: "CollaborationStyle",
    description: "Tracks solo coding versus collaborative approaches",
    lowDescription: "Individual-focused, emphasizing personal coding expertise",
    midDescription: "Balanced individual/collaborative coding approach",
    highDescription: "Team-oriented, emphasizing collaborative coding practices"
  },
  {
    pair: "🧬🎨",
    name: "CodeStructuring",
    description: "Tracks systematic versus creative code organization",
    lowDescription: "Systematic, emphasizing conventional patterns and organization",
    midDescription: "Balanced structure combining patterns with creative approaches",
    highDescription: "Creative structuring, finding novel ways to organize code"
  },
  {
    pair: "📦🔧",
    name: "AbstractionLevel",
    description: "Tracks preference for abstraction versus concrete implementations",
    lowDescription: "Concrete implementations with minimal abstraction",
    midDescription: "Balanced use of abstraction and concrete code",
    highDescription: "Higher-level abstractions, emphasizing reusable patterns"
  },
  {
    pair: "🐞📚",
    name: "DebugApproach",
    description: "Tracks debugging approach from practical to theoretical",
    lowDescription: "Hands-on debugging with practical troubleshooting",
    midDescription: "Mixed debugging approach using both theory and practice",
    highDescription: "Systematic debugging based on programming principles"
  }
];

// Get explanation text for coding dimensions
export function getCodingDimensionsExplanation(): string {
  return `
🧮 CODING DIMENSIONS FOR EMOJIKEY v3 🧮

These specialized dimensions help track programming-related interaction patterns:

${CODING_DIMENSIONS.map(dim => 
  `• ${dim.pair} (${dim.name}): ${dim.description}
    - Low angle (0-30°): ${dim.lowDescription}
    - Mid angle (90°): ${dim.midDescription}
    - High angle (150-180°): ${dim.highDescription}`
).join('\n\n')}

Examples:
[ME|💻🔧8∠30|🧩🧠7∠45] - The AI positions itself with strong focus on implementation details and a balanced problem-solving approach
[CONTENT|🏗️🔍9∠20|🔄📊8∠15] - The conversation is heavily focused on building new features with strong results orientation
[YOU|📚🧪8∠40|🚀🛡️7∠25] - The user appears moderately focused on application over theory, with a preference for speedy development

Incorporate these dimensions with standard emojikeys to create a comprehensive coding interaction profile.
`;
}