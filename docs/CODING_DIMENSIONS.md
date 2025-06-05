# Emojikey v3.1: Coding Dimensions Guide

This document explains the programming-specific dimension pairs added in Emojikey v3.1 to track coding-specific interaction styles.

## Overview

Coding dimensions are specialized emoji pairs that represent programming-related interaction patterns. These dimensions help Claude adapt to your software development style, providing more tailored assistance for coding tasks.

## Standard Format

Each coding dimension follows the standard Emojikey v3 format:

```
[COMPONENT|emoji₁emoji₂N∠A|...]
```

Where:
- **COMPONENT**: ME, CONTENT, or YOU
- **emoji₁emoji₂**: The emoji pair representing a dimension
- **N**: Magnitude (0-9) indicating strength
- **A**: Angle (0-180°) indicating position on the spectrum

## Coding-Specific Dimension Pairs

| Emoji Pair | Dimension Name | Description | Low Angle (0-30°) | Mid Angle (90°) | High Angle (150-180°) |
|------------|----------------|-------------|-------------------|-----------------|------------------------|
| 💻🔧 | ImplementationFocus | Balance between high-level design and low-level implementation | Detailed implementation focus | Balanced implementation approach | High-level design focus |
| 🏗️🔍 | CodeScope | Building new features vs. improving existing code | Emphasis on building new functionality | Balanced approach | Focus on refactoring and optimizing |
| 🧩🧠 | ProblemSolving | Approach to solving programming problems | Practical, pattern-matching approach | Mixed approach | First-principles, analytical approach |
| 🔄📊 | ProcessVsResults | Emphasis on coding process vs. outcomes | Results-oriented, shipping quickly | Balanced attention | Process-oriented, emphasizing best practices |
| 📚🧪 | LearnVsApply | Teaching programming concepts vs. applying them | Applied focus, practical examples | Mixed approach | Explanatory focus, theory-oriented |
| 🚀🛡️ | SpeedVsSecurity | Development speed vs. security considerations | Speed-focused development | Balanced approach | Security-focused development |
| 👥💻 | CollaborationStyle | Solo coding vs. collaborative approaches | Individual-focused coding | Balanced approach | Team-oriented, collaborative coding |
| 🧬🎨 | CodeStructuring | Systematic vs. creative code organization | Systematic, conventional patterns | Balanced structure | Creative structuring approaches |
| 📦🔧 | AbstractionLevel | Preference for abstraction vs. concrete code | Concrete implementations | Balanced use | Higher-level abstractions |
| 🐞📚 | DebugApproach | Debugging approach from practical to theoretical | Hands-on debugging | Mixed approach | Systematic, principle-based debugging |

## Usage Examples

### Example 1: Detail-oriented implementation with balanced problem-solving

```
[ME|💻🔧8∠30|🧩🧠5∠90]
```

This shows Claude positioning itself with a strong focus on implementation details (magnitude 8, low angle 30°) and a balanced, moderate approach to problem-solving (magnitude 5, center angle 90°).

### Example 2: Full component set for a coding session

```
[ME|💻🔧7∠40|🧩🧠8∠60]~[CONTENT|🏗️🔍9∠20|🔄📊6∠50]~[YOU|📚🧪4∠120|🚀🛡️8∠15]
```

This complex emojikey shows:
- **ME**: Claude leaning toward implementation details with a mixed problem-solving approach
- **CONTENT**: Conversation heavily focused on building new features with moderate process focus
- **YOU**: User perceived as preferring theoretical explanations (but not strongly) and strongly preferring rapid development

### Example 3: Security-focused development with high abstraction

```
[ME|🚀🛡️8∠150|📦🔧7∠135]
```

This shows Claude positioning itself with a strong focus on security (magnitude 8, high angle 150°) and a preference for somewhat abstract approaches (magnitude 7, angle 135°).

## Integration with Standard Dimensions

Coding dimensions can be used alongside standard Emojikey dimensions. For example:

```
[ME|💻🔧8∠30|🧠🎨7∠45|🔒🔓5∠90]
```

This combines the coding-specific "ImplementationFocus" dimension with standard dimensions for "Analytical/Creative" and "Constrained/Exploratory" thinking.

## Best Practices

1. **Relevant Dimensions**: Only include dimensions relevant to the current coding context
2. **Magnitude Significance**: Use higher magnitudes (7-9) for dominant characteristics
3. **Angle Precision**: Choose angles that accurately reflect position on the spectrum
4. **Update Frequency**: Update coding dimensions when programming context significantly changes
5. **Component Selection**: Use ME for Claude's approach, CONTENT for conversation focus, YOU for user preferences

## Coding Context Detection

The system automatically detects coding contexts through:
1. Programming language mentions
2. Code blocks or syntax patterns
3. Software development terminology
4. Programming framework or library references

When a coding context is detected, the system activates these specialized dimensions for more precise tracking of programming-related interaction styles.