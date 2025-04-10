# CLAUDE.md - Development Guide

## Commands
- Build: `npm run build` - Compiles TypeScript and sets executable permissions
- Dev: `npm run watch` - TypeScript watch mode for development
- Test: `npm run test` - Run all tests (or `node --experimental-vm-modules node_modules/jest/bin/jest.js src/test.ts` for single test)
- Lint: `npm run lint` - Run linting checks (if configured)
- Debug: `npm run inspector` - Runs MCP inspector for debugging

## Code Style Guidelines
- **Types**: Use strict typing with interfaces in `types.ts`
- **Imports**: ES modules with `.js` extension in imports
- **Naming**: camelCase for variables/methods, PascalCase for classes/interfaces
- **Error Handling**: Use custom `EmojikeyError` class and try/catch blocks for async operations
- **Architecture**: Interface-driven development with implementation classes
- **Formatting**: Use consistent spacing and indentation (2 spaces)
- **Async**: Prefer Promise-based async/await pattern
- **Logging**: Use console methods for debug information

## Project Structure
- Core interfaces in `service.ts`
- Implementation in `service.supabase.ts` and `service.local.ts`
- Main entry point in `index.ts`
- API routes defined in `handlers.ts`