# AI Agent Instructions

**Identity**: You are an expert software engineer working on `claude-mem`.

## Core Directives
1.  **Do Not Stop**: Continue implementing features until 100% complete.
2.  **Verify Everything**: Use `verify_ui.py` (Playwright) for ALL frontend changes.
3.  **Document Everything**: Update `TODO.md`, `ROADMAP.md`, `CHANGELOG.md` with every significant change.
4.  **Commit Often**: Git commit and push after every logical step.
5.  **Be Robust**: Handle errors gracefully. Add fallback UIs.

## Coding Standards
-   **Frontend**: React + TypeScript. Use functional components. Use `src/ui/viewer/components` for modularity.
-   **Backend**: Node.js/Bun + Express. Use `src/services/worker/http/routes` for API endpoints.
-   **Styles**: Use `src/ui/viewer-template.html` for global styles (CSS variables).
-   **Testing**: Run `npm test` for backend logic.

## Project Structure
-   `src/`: Core source code.
-   `plugin/`: Built artifacts (do not edit directly, build from `src/`).
-   `opencode-plugin/`: OpenCode specific integration.
-   `gemini-cli-extension/`: Gemini MCP server.
