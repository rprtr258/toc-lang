# Code Style and Conventions

## Language and Framework
- TypeScript with Vue 3
- Uses Composition API
- Strict type checking enabled

## Naming Conventions
- Functions: camelCase
- Types/Interfaces: PascalCase
- Variables: camelCase
- Files: kebab-case for Vue components, camelCase for TS files
- Constants: UPPER_SNAKE_CASE where appropriate

## Code Organization
- Interfaces and types defined at top of files
- Export default for main components/functions
- Named exports for utilities

## TypeScript Specific
- Use explicit types, avoid `any`
- Interface definitions for complex objects
- Union types for discriminated unions (e.g., StatementAst)
- Optional properties with `?`

## Vue Specific
- Single-file components (.vue)
- Script setup syntax
- Reactive refs and computed properties
- Emits for component communication

## Error Handling
- Custom SyntaxError for parsing errors
- Throw errors with descriptive messages
- Try-catch blocks where appropriate

## Comments
- JSDoc comments for public APIs
- Inline comments for complex logic
- No comments for obvious code

## Formatting
- Uses ESLint and Prettier
- Standard TypeScript ESLint config
- Consistent indentation (2 spaces)
- Semicolons required