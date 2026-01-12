# Actions to Perform After Completing a Task

After making code changes:

1. Run `bun run lint` to check for linting errors
2. Run `bun test` to ensure all tests pass
3. If tests use snapshots and you added new functionality, run `bun test --update-snapshots` first, then `bun test`
4. Do NOT run `bun run lint:fix` or any auto-formatting unless explicitly requested
5. Do NOT commit changes unless explicitly asked by the user

## Important Guidelines
- Only edit files and lines directly related to the task
- Do not update unrelated code, spacing, indentation, or formatting
- Do not modify any unrelated issues found during linting/testing
- Use Chrome MCP for debugging if needed, but do not start/stop dev server yourself