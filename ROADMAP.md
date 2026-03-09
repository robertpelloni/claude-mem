# ROADMAP — Claude-Mem

> Long-term structural plans and milestones.

## Completed Milestones

### v1–v5: Foundation
- [x] SQLite-based observation storage with FTS5 search
- [x] 5 lifecycle hooks (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd)
- [x] Smart install with cached dependency checking
- [x] Worker service on port 37777 with Express.js API
- [x] PM2 process management → Bun migration
- [x] Web viewer UI with real-time SSE updates
- [x] Skill-based search (mem-search) replacing MCP tools (~2,250 token savings)
- [x] Hybrid search: Chroma vector DB + SQLite FTS5
- [x] Progressive disclosure (3-layer memory retrieval)

### v6–v7: Privacy & Configuration
- [x] `<private>` tags for user-controlled privacy
- [x] System-level `<claude-mem-context>` tags (anti-recursion)
- [x] Version channel switching (stable ↔ beta) from web UI
- [x] Configuration dashboard in web viewer
- [x] 11 context injection settings for fine-grained control

### v8–v9: Stability & Community
- [x] 100-PR triage (v9.1.0 "The Great PR Triage")
- [x] Fail-open hook architecture
- [x] DB initialization guard middleware
- [x] Security: CORS restricted to localhost, XSS defense via DOMPurify
- [x] Manual `save_memory` MCP tool
- [x] Project exclusion setting
- [x] Zombie process prevention (ProcessRegistry, orphan reaper)
- [x] Windows platform improvements (PowerShell spawn, Chroma re-enabled)
- [x] In-process worker architecture for Windows
- [x] Credential isolation (`~/.claude-mem/.env` only)

### v10: Ecosystem & Integration
- [x] **OpenClaw plugin** — persistent memory for OpenClaw gateway agents
- [x] OpenClaw installer (`curl | bash`)
- [x] Observation feeds (Telegram, Discord, Slack, Signal, WhatsApp, LINE)
- [x] MEMORY.md live sync for OpenClaw agents
- [x] Chroma MCP Manager (replaced WASM/native with persistent MCP connection)
- [x] SessionStart `systemMessage` for ANSI-colored timeline display
- [x] PID-based + port-based daemon guards (prevent duplicate workers)
- [x] Self-healing message queue

### v10.4-v10.5: Upstream Merge & UI Polish
- [x] VS Code extension completion (`vscode-extension/`)
- [x] Endless Mode stabilization
- [x] Transcript viewer UI integration
- [x] **v10.5.0**: `smart-explore` AST-based code navigation skill
- [x] **v10.5.1–v10.5.2**: Benchmark data and hooks.json restoration
- [x] **v10.4.4**: Remove `save_observation` from MCP tool surface
- [x] **v10.4.3**: Fix hook crashes and `CLAUDE_PLUGIN_ROOT` fallback
- [x] **v10.4.1**: Convert `make-plan` and `do` commands to skills; terminal output control

## Current: v10.5.2

### In Progress
- [x] Windows console window briefly appears when worker starts

## Future Phases

### Phase A: Endless Mode GA
- [x] Move Endless Mode from beta to stable
- [x] Production benchmarks (real-world, not theoretical)
- [x] Configurable compression aggressiveness
- [x] Automatic mode switching based on session length

### Phase B: Ecosystem Submodules (The Omnipresent Memory API)
- [x] **Cursor Integration** (`cursor-hooks/`): Verify compatibility with the latest Cursor IDE release and build specialized injection routes.
- [x] **OpenCode Integration** (`opencode-plugin/`): Document and verify the OpenCode environment plugin.

### Phase C: Operations & Workflow Automation
- [x] **Autonomous Installer** (`installer/`): Provide a deep cross-platform installer that handles SQLite, Node, Bun, and system pathing gracefully.
- [x] **End-to-End Benchmarks** (`benchmarks/`): Run heavy endurance and throughput test suites for endless mode context saturation.
- [x] **Ragtime Exploration** (`ragtime/`): Integrate external RAG/timeline exploration tools for email and external databases.
- [x] **Automated Session Handoffs**: Auto-generate `HANDOFF.md` autonomously at session end.

### Phase D: Cross-Session Intelligence (The Collective)
- [x] **Correlation Engine**: Link related observations across sessions (e.g. bugfix in Session A caused by design in Session B).
- [x] **Redundant Memory Defragmentation Agent**: Daemon process that prunes redundant context.
- [x] **Historical Debt Warnings**: Proactively warn Claude of architectural drift.

### Phase E: Advanced Visualization & Analytics
- [x] **Search Server Consolidation**: Handlers refactored into a modular `src/servers/search-server/handlers` structure.
- [x] **UI Audits and Polish**: `Sidebar.tsx`, `HelpModal.tsx`, and `IntegrationsStatus.tsx` refined visually.
- [x] **Antigopilot Standardization**: Renamed UI sections properly to Antigopilot Extension.
- [x] **Token Control Safeguards**: Added text chunking to `get_observations` along with payload truncation boundaries.

### Phase F: Security & Extreme Performance
- [x] **Vault-backed Secret Masking**: Strip credentials before SQLite insertion.
- [x] **Rust-based Local Memory Gateway**: Replace Node-based hooks with a high-throughput Rust server for zero-latency hook lifecycles.
- [x] **WASM-native mem-search**: Bypass HTTP API for in-memory, ultra-fast SQLite search execution.

### Phase G: Ecosystem Expansion & Windows Polish
- [x] **Windows Console Warts**: Patch node `spawn` functions to inject `windowsHide: true`.
- [x] **Ragtime Module Docs**: Formalized `ragtime/README.md`.
- [x] **Branch Memory**: Explored the upstream `branch-memory` integration plan for Phase H.
