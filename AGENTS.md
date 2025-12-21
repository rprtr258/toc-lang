# Agent Guidelines for toc-lang

## Commands

- **Build**: `bun run build` (tsc -p tsconfig.prod.json && vite build)
- **Lint**: `bun run lint` (eslint src/\*_/_.{js,jsx,ts,tsx,json} --ignore-pattern src/generated/)
- **Lint fix**: `bun run lint:fix`
- **Format**: `bun run format` (prettier --write with config)
- **Test all**: `bun test` (NODE_ENV=test vitest run)
- **Test single**: `bun vitest run path/to/test.ts:line_number`
- **Coverage**: `bun run coverage`

## Code Style

- **Language**: TypeScript with ES modules
- **Formatting**: Prettier (no semicolons, double quotes, no trailing commas)
- **Linting**: ESLint with standard-with-typescript + React rules
- **Types**: strictNullChecks: true, strict: false, explicit return types optional
- **Imports**: At top of file, use relative paths, disable eslint rules with comments when needed
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error handling**: Use try/catch for async operations, console.log for debugging
- **Comments**: Minimal, only for complex logic; no JSDoc required
