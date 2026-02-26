# Handoff Document

## Architecture Overview

`claude-mem` is a memory compression system for Claude Code, built as a local plugin ecosystem.

### Core Components

1.  **Worker Service** (`src/services/worker-service.ts`)
    *   **Role**: Central orchestrator running on port 37777.
    *   **Responsibilities**:
        *   Manages SQLite database (`SessionStore`, `SessionSearch`).
        *   Manages Vector database sync (`ChromaSync`).
        *   Serves HTTP API for the Viewer UI and Plugins.
        *   Hosts the MCP server for Gemini integration.
    *   **Key files**: `WorkerService.ts`, `DatabaseManager.ts`, `SessionManager.ts`.

2.  **Viewer UI** (`src/ui/viewer/`)
    *   **Role**: Web-based dashboard for visualizing memory.
    *   **Tech Stack**: React, TypeScript, SSE (Server-Sent Events).
    *   **Key Pages**:
        *   `Feed`: Real-time stream of observations and summaries.
        *   `Search`: Full-text and vector search interface.
        *   `Dashboard`: System diagnostics, project structure, and Endless Mode stats.
        *   `Graph`: Interactive knowledge graph using HTML5 Canvas.
        *   `Status`: Live logs and integration health.

3.  **Hooks** (`src/hooks/`)
    *   **Role**: Integration points with Claude Code lifecycle.
    *   **Mechanism**: Executed by Claude Code, they communicate with the Worker via HTTP or direct DB access (legacy).
    *   **Key Hooks**: `context-hook`, `new-hook`, `save-hook`.

4.  **Plugins**
    *   **Gemini CLI Extension**: MCP server proxying to the worker.
    *   **OpenCode Plugin**: HTTP client for reading/recording memory.

## Recent Changes (v7.4.0)

-   **System Dashboard**: Added project structure visualization and dependency listing.
-   **Knowledge Graph**: Implemented `/api/graph` and a custom force-directed graph visualizer.
-   **Robustness**: Added `ErrorBoundary` wrappers and better error handling.
-   **Endless Mode**: Added backend logic for token savings calculation.

## Next Steps

1.  **Help Search**: Implement search within the in-app documentation.
2.  **Robust Token Counting**: Improve the accuracy of "Tokens Saved" metrics.
3.  **Remote Sync**: Begin planning for cloud synchronization.

## Build & Verify

-   **Build**: `npm run build` (Builds hooks, worker, and viewer).
-   **Test**: `npm test` (Vitest).
-   **Verify UI**: `python3 verification/verify_dashboard.py` (Requires worker running).
