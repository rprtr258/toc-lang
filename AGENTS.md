# Agent Guidelines for toc-lang

## General Guidelines
- Do not update code which does not relate to the change.
- Do not modify any code, spacing, indentation, line breaks, or formatting outside the specific changes requested.
- Only edit files and lines directly related to the task at hand.
- Do not do additional tasks until explicitly asked.
- Do not run auto-formatting tools (like lint:fix or format) unless explicitly requested by the user.
- After making changes, run only the specified verification commands (lint, test), but do not fix or modify any unrelated issues that arise.
- Use Chrome MCP to debug changes using dev server running on `http://localhost:5173/`.
- Do not ever run your own dev server or stop existing one.

## Commands
- **Build**: `bun run build`
- **Lint**: `bun run lint`
- **Lint fix**: `bun run lint:fix`
- **Format**: `bun run format`
- **Test all**: `bun test`
- **Coverage**: `bun test --coverage`
