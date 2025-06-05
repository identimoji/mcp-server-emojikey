# Emojikey v3 Angle Distribution

## Current Status

In the v3 emojikey system, angles have a theoretical range of 0-180 degrees, representing positioning along each dimension:

- 0° represents one extreme of the dimension
- 90° represents a balanced center position
- 180° represents the opposite extreme

However, we've observed that most generated angles tend to fall in the 0-90° range, which indicates a potential bias in the angle generation logic.

## Analysis of Angle Distribution Issue

The current implementation of angle assignment has several potential issues:

1. **Hard-coded angle values**: In `analyzeCodingContext.ts`, angles are assigned using fixed values (30, 90, 140, 150) rather than being calculated on a spectrum.

2. **Dimension inversion**: Some dimensions may have their polarities inverted, causing a mathematical bias toward lower angles.

3. **Normalization issues**: There's no explicit normalization step to ensure angles are properly distributed across the 0-180° range.

4. **Angle semantic meaning**: The meaning of angle values is defined in `coding_dimensions.ts`, but the actual angle generation logic may not align with these semantic definitions.

## Proposed Improvements

For future iterations, consider these changes to improve angle distribution:

1. **Normalized angle calculation**: Implement a function to convert detected patterns into normalized angles that properly utilize the full 0-180° range.

2. **Dimension polarity verification**: Review the polarity of each dimension to ensure the extremes are correctly mapped to 0° and 180°.

3. **Statistical normalization**: Add a post-processing step to ensure generated angles follow a more balanced distribution.

4. **Explicit angle ranges**: Define explicit angle ranges for each semantic meaning:
   - Low range: 0-60°
   - Middle range: 61-120°
   - High range: 121-180°

5. **Dynamic angle calculation**: Rather than using hard-coded values, calculate angles dynamically based on detected patterns.

## Implementation Example

```typescript
function calculateAngle(
  value: number,  // Detected value for the dimension
  minValue: number,  // Theoretical minimum
  maxValue: number,  // Theoretical maximum
  inverted: boolean = false  // Whether dimension is inverted
): number {
  // Normalize to 0-1 range
  const normalizedValue = (value - minValue) / (maxValue - minValue);
  
  // Convert to angle (0-180 degrees)
  let angle = normalizedValue * 180;
  
  // Invert if needed
  if (inverted) {
    angle = 180 - angle;
  }
  
  // Clamp to valid range
  return Math.max(0, Math.min(180, angle));
}
```

## Testing Strategy

1. Create a distribution test that generates multiple keys and analyzes angle distribution
2. Create a visualization tool to display angle distribution across dimensions
3. Verify angles match the semantic meaning defined for each dimension

## Timeline

These angle distribution improvements are targeted for v0.3.3 or v0.4.0.