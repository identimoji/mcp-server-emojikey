# CLAUDE.md: EmojiKey Server Guidelines

## Build and Test Commands
- Build: `npm run build`
- Development with auto-rebuild: `npm run watch`
- Test script: `npm run test`
- Debug: `npm run inspector`

## Code Style Guidelines
- **TypeScript Config**: ES2022, NodeNext, strict typing
- **Imports**: ES modules with .js extension, third-party first, then local
- **Formatting**: 2-space indentation, consistent spacing
- **Types**: Explicit interfaces, parameter and return type annotations
- **Naming**: Interfaces/Classes=PascalCase, variables/functions=camelCase, constants=UPPER_SNAKE_CASE
- **Error Handling**: Custom `EmojikeyError`, try/catch with specific handling
- **Architecture**: Interface-based design, service implementation pattern
- **Documentation**: JSDoc for complex functions
- **Environment**: dotenv for variables, config constants centralized

## Project Structure
- `src/service.ts`: Core service interfaces
- `src/service.*.ts`: Service implementations
- `src/config.ts`: Configuration constants
- `src/handlers.ts`: Request handlers
- `src/types.ts`: Type definitions