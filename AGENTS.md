# AI Agent Instructions

**Identity**: You are an expert software engineer working on `claude-mem`, a local memory compression system for Claude Code.

## 1. Core Directives (The "Prime Directives")
1.  **Do Not Stop**: Continue implementing features until 100% complete. Do not ask for permission to proceed unless blocked by ambiguity.
2.  **Verify Everything**: Use `python3 verification/verify_dashboard.py` (or create specific scripts) to verify ALL frontend changes visually. Run `npm test` for backend logic.
3.  **Document Everything**: Update `TODO.md`, `ROADMAP.md`, and `CHANGELOG.md` with every significant change. Keep `HANDOFF.md` updated with the current architectural state.
4.  **Commit Often**: Git commit and push after every logical step (e.g., "feat: Add new route", "fix: Resolve UI bug").
5.  **Be Robust**: Handle errors gracefully. Use `ErrorBoundary` in React. Use `try/catch` in async backend handlers. Use transactions for DB migrations.

## 2. Architecture Overview

### Worker Service (`src/services/worker-service.ts`)
-   **Role**: Central nervous system. Runs on port 37777.
-   **Database**: SQLite (`SessionStore.ts`) + Chroma Vector DB (`ChromaSync.ts`).
-   **API**: Express.js server exposing REST endpoints (`/api/*`).
    -   `SystemRoutes.ts`: System info, Endless Mode stats.
    -   `AnalyticsRoutes.ts`: Top files, concepts.
    -   `GraphRoutes.ts`: Knowledge graph data.
-   **MCP**: Hosts an MCP server for external agents (Gemini, etc.).

### Viewer UI (`src/ui/viewer/`)
-   **Role**: The "Brain" visualization.
-   **Stack**: React, TypeScript, SSE (Server-Sent Events).
-   **Modes**:
    -   **Standard**: Full dashboard.
    -   **Widget (`?mode=widget`)**: Compact view for IDE embedding.
-   **Key Components**: `Feed`, `SearchPage`, `DashboardPage`, `GraphPage`.

### Hooks (`src/hooks/`)
-   **Role**: Sensory inputs. Executed by Claude Code lifecycle.
-   **Pattern**: Hooks are standalone scripts that send data to the Worker via HTTP.

## 3. Development Protocols

### Database Management
-   **Migrations**: ALWAYS use `SessionStore.runMigration(version, name, fn)` for schema changes. This ensures transactions and rollback safety.
-   **Idempotency**: All DB operations (insert, update, migrate) must be idempotent.

### Frontend Development
-   **Styling**: Use CSS variables defined in `src/ui/viewer-template.html`.
-   **Error Handling**: Wrap new page components in `<ErrorBoundary>`.
-   **Responsiveness**: Ensure components work in both Standard and Widget modes.

### Verification Workflow
1.  **Build**: `npm run build` (builds hooks, worker, and UI).
2.  **Test Backend**: `npm test` (runs Vitest).
3.  **Verify UI**:
    -   Start worker: `bun plugin/scripts/worker-service.cjs &`
    -   Run script: `python3 verification/verify_dashboard.py`
    -   Check screenshots in `verification/`.
    -   Kill worker.

## 4. Troubleshooting
-   **Worker won't start**: Check for zombie processes (`lsof -i :37777`).
-   **UI blank**: Check browser console for React errors. Verify `worker-bundle.js` was built.
-   **Database locked**: Ensure `SessionStore` is a singleton in the worker process.

## 5. Next Steps (See `TODO.md`)
-   Focus on "Short Term" items in `ROADMAP.md`.
-   Prioritize robustness and "Pro" features.
