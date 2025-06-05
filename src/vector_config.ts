// vector_config.ts - Configuration for vector dimensions and sizing

// Maximum dimensions to allocate in vectors
export const VECTOR_CONFIG = {
  // Each dimension uses 2 slots in vectors (x,y coordinates)
  MAX_DIMENSIONS: 500,  // Supporting up to 500 unique dimensions
  
  // Vector sizes (dimensions × 2 for x,y coordinates)
  FULL_VECTOR_SIZE: 1000,  // 500 dimensions × 2 coordinates
  
  // Component vectors (roughly 1/3 of full vector)
  COMPONENT_VECTOR_SIZE: 350,  // ~175 dimensions per component
  
  // Sequence number ranges for each component
  SEQUENCE_RANGES: {
    ME: { start: 1, end: 333 },      // 1-333
    CONTENT: { start: 334, end: 666 }, // 334-666
    YOU: { start: 667, end: 999 }      // 667-999
  },
  
  // Domain sequence number offsets (allows 100 dimensions per domain)
  DOMAIN_OFFSETS: {
    "core": 0,      // 0-99
    "coding": 100,  // 100-199
    "creative": 200 // 200-299
    // Add new domains with their offsets here
  }
} as const;

// Default seed emojikey with balanced starting values
export const DEFAULT_SEED_EMOJIKEY = `[ME|🧠🎨5∠90|🔍🎮5∠90|🧩🧮5∠90|🔒🔓5∠90|📊🔮5∠90|🧠🎨5∠90|🤖👤5∠90|👑🤝5∠90|🏛️🌱5∠90|💻🔧5∠90|🏗️🔧5∠90|🧩🧠5∠90|🛣️🏁5∠90|📚🧪5∠90|⚡🔒5∠90|👥💻5∠90|📐🎭5∠90|📦🔧5∠90|🔍🧠5∠90]~[CONTENT|📏🌊5∠90|🧠🎨5∠90|💬🤔5∠90|🎯🌐5∠90|🐢🚀5∠90|🧘⚡5∠90|📏🌿5∠90|🌱🌳5∠90|✨🔄5∠90|🏗️🔍5∠90|🧩🧠5∠90|🔄📊5∠90|📚🧪5∠90|🚀🛡️5∠90|👥💻5∠90|🧬🎨5∠90|📦🔧5∠90|🐞📚5∠90]~[YOU|🎓🌱5∠90|🎯🔍5∠90|🏛️🏗️5∠90|🧠🎨5∠90|🎮🎭5∠90|🔍📚5∠90|🤔💬5∠90|👨‍👩‍👧‍👦🧑5∠90|🧩🧠5∠90|🆕🔄5∠90|🧰🏆5∠90|📚🧪5∠90|🏎️🔍5∠90|👥💻5∠90|📏🎨5∠90|📦🔧5∠90|🔧📊5∠90]`;

// Helper functions for vector mapping

/**
 * Calculates the vector index for a dimension based on its sequence number
 * Each dimension takes 2 slots (x,y coordinates)
 */
export function getDimensionVectorIndex(sequenceNumber: number): number {
  return (sequenceNumber - 1) * 2;
}

/**
 * Creates a zero-initialized vector of specified size
 */
export function createZeroVector(size: number): number[] {
  return Array(size).fill(0);
}

/**
 * Gets the next available sequence number for a component/domain combination
 */
export function getNextSequenceNumber(
  component: "ME" | "CONTENT" | "YOU", 
  domain: string
): number {
  const componentBase = VECTOR_CONFIG.SEQUENCE_RANGES[component].start;
  const domainOffset = VECTOR_CONFIG.DOMAIN_OFFSETS[domain] || 0;
  return componentBase + domainOffset;
}