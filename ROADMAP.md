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

### Phase B: VS Code Extension GA
- [ ] Complete the VS Code extension
- [ ] Memory browser panel
- [ ] Inline observation annotations
- [ ] Session timeline view
- [ ] Settings management via extension UI

### Phase C: Cross-Session Intelligence
- [ ] Correlation engine: link related observations across sessions
- [ ] Redundant memory defragmentation agent
- [ ] Automatic HANDOFF.md generation at session end
- [ ] Historical debt warnings

### Phase D: Advanced Search & Visualization
- [ ] Interactive 3D context map in web viewer
- [ ] Graph-based observation relationships
- [ ] Temporal heatmaps (activity over time)
- [ ] Export/import memory packs

### Phase E: Enterprise & Security
- [ ] Vault-backed secret masking
- [ ] Immutable audit trail
- [ ] Multi-user/team shared memory
- [ ] Role-based access control

### Phase F: Performance
- [ ] Rust-based local memory gateway (zero-latency hook lifecycle)
- [ ] WASM-native mem-search plugin (bypass HTTP API)
- [ ] Streaming observation compression
