# MEMORY — Codebase Observations & Design Preferences

> Ongoing observations about the claude-mem codebase, design decisions, quirks, and preferences.
> Updated by AI agents across sessions to preserve institutional knowledge.

## Architecture Observations

### Hook System
- Hooks have strict timeout limits imposed by Claude Code. Heavy processing MUST go through the worker service.
- `smart-install.js` is NOT a lifecycle hook — it's a pre-hook dependency checker that runs before `context-hook.js` via command chaining in `hooks.json`.
- The in-process worker architecture (v9.0.14) means hooks can become the worker when port 37777 is available, eliminating Windows spawn issues.

### Worker Service
- Express.js on port 37777, managed by PM2/Bun.
- Must be CJS format (`plugin/worker-service.cjs`) — this is a deliberate decision.
- Worker handles all AI processing asynchronously to avoid hook timeouts.
- Graceful shutdown is critical — zombie processes have been a recurring issue (v9.0.8, v10.2.6).

### Database
- Uses `better-sqlite3` — NOT `bun:sqlite` (that's legacy from an older version).
- FTS5 virtual tables for full-text search. Automatic sync triggers keep FTS5 synchronized.
- Foreign key constraints have caused issues — `ON UPDATE CASCADE` was added in v9.1.0.
- `CHECK` constraints on observation type column were removed in v9.1.1 because the mode system (v8.0.0+) allows custom types.

### Chroma Vector DB
- Evolved: in-process → HTTP server → chroma-mcp MCP connection (v10.3.0).
- chroma-mcp spawn storms were a critical bug (v10.0.3, reverted in v10.0.4, properly fixed in v10.3.1).
- WASM embeddings replaced native binaries to eliminate cross-platform issues.
- Model cache moved to `~/.claude-mem/models/` to survive `node_modules` reinstalls.

### Viewer UI
- React + TypeScript, bundled via esbuild into a single self-contained HTML file.
- Served by the worker service Express.js app.
- SSE (Server-Sent Events) for real-time updates — no polling.
- Configuration dashboard was added in v7.4.0.

## Design Preferences

- **YAGNI above all** — the project explicitly prefers "write the dumb, obvious thing first."
- **Fail-open** — hooks must never block Claude Code, even if the worker is down.
- **Progressive disclosure** — don't dump all context; show index first, details on demand.
- **Privacy-first** — all data local, `<private>` tags for user control.
- **Anti-patterns explicitly documented** in CLAUDE.md — read them.

## Platform Quirks

### Windows
- Console window briefly appears when worker starts (known issue, documented in README).
- WMIC was deprecated → migrated to PowerShell `Start-Process -WindowStyle Hidden` (v10.0.0).
- Chroma was temporarily disabled on Windows (v9.0.6), re-enabled in v10.0.0.
- Path spaces in Windows usernames caused failures (fixed v9.1.0).
- `bun-runner.js` wrapper handles Bun discovery across all platforms (v9.0.17).

### macOS/Linux
- Generally stable. PM2 process management works well.
- Homebrew and Linuxbrew Bun paths supported.

## Recurring Bug Patterns

1. **Zombie processes** — Observer Claude CLI subprocesses not terminating. Fixed multiple times (v9.0.8, v9.0.13, v10.2.6). ProcessRegistry + orphan reaper is the current defense.
2. **chroma-mcp spawn storms** — Concurrent connections racing through check-then-act guard. Fixed with connection mutex + circuit breaker (v10.3.1).
3. **Stale session IDs** — After worker restart, database session IDs become invalid. Fixed by clearing `memory_session_id` on load.
4. **FTS5 sync drift** — FTS5 tables can fall out of sync if triggers aren't properly maintained.
5. **Hook timeout failures** — Heavy processing in hooks causes Claude Code to timeout. Solution: send work to worker service.

## Version History Key Moments
- **v5.0.0**: Hybrid search with Chroma
- **v6.0.0**: Major session management rewrite
- **v9.1.0**: "The Great PR Triage" — 100 PRs, 35+ contributors
- **v10.0.0**: OpenClaw plugin, Windows improvements
- **v10.3.0**: chroma-mcp MCP connection (eliminated native binary issues)
