# Project Information

## Purpose
TOC-Lang is a tool to generate Theory of Constraints diagrams from text-based notation. It supports three types of diagrams:
- Goal Tree
- Problem Tree (Current Reality Tree)
- Evaporating Cloud (Conflict Resolution Diagram)

## Tech Stack
- Frontend: Vue 3, TypeScript
- Build tool: Vite
- Runtime/Package Manager: Bun
- Parsing: Lezer (LR parser)
- Graph Layout: Dagre
- Code Editor: CodeMirror
- Testing: Bun test framework

## Code Structure
- `src/parser.ts`: Parses text into AST (Abstract Syntax Tree)
- `src/interpreter.ts`: Converts AST into semantic tree structures for each diagram type
- `src/tokenizer.ts`: Tokenizes input text
- Vue components in `src/`: UI for editing and displaying diagrams
- `src/testcases.ts`: Test case definitions
- Tests in `src/*.test.ts`

## Testing
- Uses Bun's test framework
- Snapshots for AST and semantics verification
- Separate test files for parser/interpreter logic

## Deployment
- Hosted on GitHub Pages
- Build command: `bun run build`
- Preview: `bun run preview`