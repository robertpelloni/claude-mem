# Ideas & Brainstorming

## 1. Architectural Refactoring

*   **Microservices Split**: Currently, `WorkerService` is a monolith. We could split it into:
    *   `StorageService`: SQLite + Vector DB management.
    *   `IngestionService`: HTTP API for hooks + MCP server.
    *   `QueryService`: Search logic and Graph generation.
    *   `UIService`: Serving the frontend.
    *   *Benefit*: Independent scaling (e.g., heavy vector ops don't block UI).
*   **Event Bus**: Replace direct service calls with a proper event bus (e.g., Redis or internal EventEmitter) for decoupling.
    *   *Benefit*: Plugins can subscribe to events (e.g., "onObservationAdded") without modifying core code.
*   **Language Port**:
    *   **Rust**: Rewrite the Worker in Rust for maximum performance and memory safety, especially the vector search and graph generation.
    *   **Go**: Good middle ground for concurrency (handling many hook requests).

## 2. Feature Pivots

*   **Team Memory Server**: Pivot from "local-only" to a self-hosted team server.
    *   Deploy `claude-mem` as a Docker container on a shared server.
    *   All team members' hooks point to this central instance.
    *   Add user authentication and access control.
*   **Active Context Agent**: Instead of passive storage, make it an active participant.
    *   The system actively monitors file changes (watch mode) and proactively suggests relevant past memories *before* the user asks.
    *   Integration with LSP (Language Server Protocol) to provide "Memory Completions".

## 3. Advanced Visualization

*   **3D Graph**: Use `Three.js` or `React Three Fiber` for a 3D knowledge graph.
    *   "Galaxy View": Sessions as solar systems, concepts as constellations.
*   **Time Travel Debugger**:
    *   A slider to replay the evolution of the project's memory. See how concepts emerged and files changed over time.
*   **Code Heatmap**:
    *   Overlay memory density on the file tree. Which files have the most associated memories/bugs/decisions?

## 4. AI Enhancements

*   **Self-Healing Database**:
    *   Background agent that periodically reviews "orphaned" or "vague" observations and re-summarizes them using a stronger model.
*   **Conflict Detection**:
    *   Detect when a new observation contradicts an old one (e.g., "We decided to use PostgreSQL" vs "We are switching to SQLite"). Alert the user.
*   **Automatic Tagging Taxonomy**:
    *   Use clustering to automatically discover and consolidate synonymous tags (e.g., "auth", "authentication", "login" -> "Authentication").

## 5. IDE / Tooling

*   **VS Code Extension**:
    *   Instead of just a WebView, a full extension that decorates the editor gutter with memory indicators.
    *   "Click here to see 5 past bug fixes for this function."
*   **CLI Dashboard**:
    *   A TUI (Text User Interface) using `ink` or `blessed` for users who live in the terminal and don't want a web browser open.

## 6. Data Integrity

*   **Git-backed Storage**:
    *   Instead of SQLite, store memories as JSON/Markdown in a hidden git branch (`memories`).
    *   *Benefit*: Free sync, version history, and conflict resolution via standard git tools.
