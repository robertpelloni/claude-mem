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

## Current: v10.3.1

### In Progress
- [ ] VS Code extension (scaffolded in `vscode-extension/`)
- [ ] Endless Mode refinement (beta channel)
- [ ] Transcript viewer UI (`src/ui/transcript-viewer.html`)

## Upstream Pending (v10.4–v10.5)
> 20 commits on upstream/main not yet merged (24 file conflicts).

- [ ] **v10.5.0**: `smart-explore` AST-based code navigation skill
- [ ] **v10.5.1–v10.5.2**: Benchmark data and hooks.json restoration
- [ ] **v10.4.4**: Remove `save_observation` from MCP tool surface
- [ ] **v10.4.3**: Fix hook crashes and `CLAUDE_PLUGIN_ROOT` fallback
- [ ] **v10.4.1**: Convert `make-plan` and `do` commands to skills; terminal output control

## Future Phases

### Phase A: Endless Mode GA
- [ ] Move Endless Mode from beta to stable
- [ ] Production benchmarks (real-world, not theoretical)
- [ ] Configurable compression aggressiveness
- [ ] Automatic mode switching based on session length

### Phase B: Ecosystem Submodules (The Omnipresent Memory API)
- [ ] **VS Code Extension** (`vscode-extension/`): Move from WIP to GA. Add memory browser panel, inline annotations, timeline view. Publish to marketplace.
- [ ] **OpenClaw Integration** (`openclaw/`): Finalize the OpenClaw gateway connection to allow external multi-agent orchestrators to read/write memories.
- [ ] **Gemini CLI Bridge** (`gemini-cli-extension/`): Stabilize the Antigravity engine compatibility layer.
- [ ] **Cursor Integration** (`cursor-hooks/`): Verify compatibility with the latest Cursor IDE release and build specialized injection routes.
- [ ] **OpenCode Integration** (`opencode-plugin/`): Document and verify the OpenCode environment plugin.

### Phase C: Operations & Workflow Automation
- [ ] **Autonomous Installer** (`installer/`): Provide a deep cross-platform installer that handles SQLite, Node, Bun, and system pathing gracefully.
- [ ] **End-to-End Benchmarks** (`benchmarks/`): Run heavy endurance and throughput test suites for endless mode context saturation.
- [ ] **Ragtime Exploration** (`ragtime/`): Integrate external RAG/timeline exploration tools for email and external databases.
- [ ] **Automated Session Handoffs**: Auto-generate `HANDOFF.md` autonomously at session end.

### Phase D: Cross-Session Intelligence (The Collective)
- [ ] **Correlation Engine**: Link related observations across sessions (e.g. bugfix in Session A caused by design in Session B).
- [ ] **Redundant Memory Defragmentation Agent**: Daemon process that prunes redundant context.
- [ ] **Historical Debt Warnings**: Proactively warn Claude of architectural drift.

### Phase E: Advanced Visualization & Analytics
- [ ] **Interactive 3D Context Map**: Real-time visual graph rendering at localhost:37777.
- [ ] **Temporal Heatmaps**: Activity grouping over time.
- [ ] **Memory Pack Export**: Export/share anonymized expert context packs.

### Phase F: Security & Extreme Performance
- [ ] **Vault-backed Secret Masking**: Strip credentials before SQLite insertion.
- [ ] **Rust-based Local Memory Gateway**: Replace Node-based hooks with a high-throughput Rust server for zero-latency hook lifecycles.
- [ ] **WASM-native mem-search**: Bypass HTTP API for in-memory, ultra-fast SQLite search execution.
