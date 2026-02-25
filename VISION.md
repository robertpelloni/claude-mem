# Vision: Claude-Mem

**Goal:** To create a seamless, persistent, and intelligent memory layer for AI coding assistants (Claude Code, OpenCode, Gemini) that mimics human memory patterns to extend context windows indefinitely and provide deep historical awareness.

## Core Philosophy
1.  **Biomimetic Memory**: Move from a "flat context" to a "hierarchical memory" (Short-term Working Memory vs. Long-term Archive).
2.  **Progressive Disclosure**: Show summaries first, reveal details on demand. Minimize token usage while maximizing context availability.
3.  **Universal Integration**: Work across all major AI coding environments via standard protocols (MCP, HTTP).
4.  **Zero Friction**: Automated capture, summarization, and retrieval. No manual "save" required.

## Architecture
-   **Central Worker**: A robust Node.js/Bun service acting as the "hippocampus", processing streams of observations and storing them.
-   **Plugins/Extensions**: Lightweight clients (Claude Plugin, OpenCode Plugin, Gemini MCP) that forward tool inputs/outputs to the worker and inject retrieved context.
-   **Viewer UI**: A transparency layer allowing users to see, search, and manage their AI's memory.

## Future Direction
-   **Endless Mode**: Fully decoupled context management where the AI "forgets" raw details but "remembers" the learnings, enabling infinite session lengths.
-   **Multi-Modal Memory**: Storing screenshots, diagrams, and audio transcripts alongside code.
-   **Team Memory**: Synchronizing memory states across a team of developers.
