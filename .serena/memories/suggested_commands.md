# Suggested Commands

## Development
- `bun dev`: Start development server on http://127.0.0.1:5173/
- `bun run preview`: Preview production build locally

## Building
- `bun run build`: Build for production (TypeScript compilation + Vite build)

## Code Quality
- `bun run lint`: Run ESLint on all TypeScript/Vue files
- `bun run lint:fix`: Auto-fix ESLint issues

## Testing
- `bun test`: Run all tests
- `bun test --update-snapshots`: Update test snapshots
- `bun test --coverage`: Run tests with coverage report

## CI
- `bun run ci`: Run lint + test + TypeScript check (equivalent to `bun lint && bun test && vue-tsc -p tsconfig.json`)

## Other
- `bun i`: Install dependencies
- `git`: Standard Git commands for version control