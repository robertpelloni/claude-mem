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
        *   `Dashboard`: System diagnostics, analytics (Top Files/Concepts), and Endless Mode stats.
        *   `Graph`: Interactive knowledge graph using HTML5 Canvas with search integration.
        *   `Status`: Live logs and integration health.
    *   **Widget Mode**: `?mode=widget` for compact IDE embedding.

3.  **Hooks** (`src/hooks/`)
    *   **Role**: Integration points with Claude Code lifecycle.
    *   **Mechanism**: Executed by Claude Code, they communicate with the Worker via HTTP or direct DB access (legacy).
    *   **Key Hooks**: `context-hook`, `new-hook`, `save-hook`.

4.  **Plugins**
    *   **Gemini CLI Extension**: MCP server proxying to the worker.
    *   **OpenCode Plugin**: HTTP client for reading/recording memory.

## Recent Changes (v7.5.0)

-   **Graph Interactivity**: Clicking nodes in the graph now navigates to the search page filtered by that entity.
-   **Analytics**: Added "Most Active Files" and "Top Concepts" to the Dashboard.
-   **Widget Mode**: Full support for compact layouts in IDEs.
-   **Robustness**: Transactional migrations and robust token estimation.

## Next Steps

1.  **Remote Sync**: Begin planning for cloud synchronization.
2.  **Advanced Analytics**: Deepen insights (e.g., code heatmaps).
3.  **3D Graph**: Upgrade the graph visualization.

## Build & Verify

-   **Build**: `npm run build` (Builds hooks, worker, and viewer).
-   **Test**: `npm test` (Vitest).
-   **Verify UI**: `python3 verification/verify_dashboard.py` (Requires worker running).
