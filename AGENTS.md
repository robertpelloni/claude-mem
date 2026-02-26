# AGENTS.md — Universal AI Agent Instructions for Claude-Mem

> **All AI agents (Claude, Gemini, GPT, Copilot, Jules) MUST read this file first.**
> For model-specific overrides, see: `CLAUDE.md`, `GEMINI.md`, `GPT.md`, `.github/copilot-instructions.md`
> For the full universal instruction set, see: `docs/UNIVERSAL_LLM_INSTRUCTIONS.md`

## Project Identity

- **Name**: claude-mem
- **Purpose**: Persistent memory compression system for Claude Code
- **Version**: See `VERSION` file (single source of truth)
- **License**: AGPL-3.0
- **Upstream**: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- **Fork**: [robertpelloni/claude-mem](https://github.com/robertpelloni/claude-mem)

## Critical Rules

### 1. Version Management
- The `VERSION` file contains the **only** authoritative version number.
- When bumping versions, update: `VERSION`, `package.json`, `CLAUDE.md`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Every meaningful change set MUST bump the version.
- Commit message format: `chore: bump version to X.Y.Z — <description>`

### 2. Changelog Protocol
- Every version bump MUST have a corresponding entry in `CHANGELOG.md`.
- Format: `## [vX.Y.Z] - YYYY-MM-DD` followed by categorized changes.
- Categories: `### New Features`, `### Bug Fixes`, `### Breaking Changes`, `### Technical Details`, `### Files Changed`

### 3. Git Workflow
- Always work on `main` branch (this fork).
- Commit frequently with descriptive messages.
- Push after each logical change set.
- When merging upstream: preserve ALL fork features, resolve conflicts favoring new/local changes.
- Never force push. Never lose features.

### 4. Build Pipeline
```bash
npm run build          # Compile TypeScript → plugin/
npm run sync-marketplace  # Sync to ~/.claude/plugins/marketplaces/thedotmack/
npm run worker:restart    # Restart PM2 worker (if worker changes)
```

### 5. Testing
- Run `npm test` before committing.
- 57+ test files in `tests/` directory.
- Write tests for new features. Update tests when modifying behavior.

### 6. Architecture Rules
- **Hooks** (`src/hooks/`) → built to `plugin/scripts/*-hook.js` (ESM)
- **Worker Service** (`src/services/worker-service.ts`) → built to `plugin/worker-service.cjs` (CJS)
- **Viewer UI** (`src/ui/`) → built to `plugin/ui/viewer.html` (self-contained bundle)
- Hooks have **strict timeout limits** — never do heavy processing in hooks. Send to worker.
- Worker is managed by PM2/Bun — always running in background.
- **Fail-open**: hooks must never block Claude Code. Exit cleanly on errors.

### 7. Coding Standards
- Write the simple, obvious solution first.
- YAGNI — don't build it until needed.
- DRY — extract after second duplication, not before.
- Fail fast — explicit errors beat silent failures.
- Delete aggressively — less code = fewer bugs.
- Comment meaningfully — explain *why*, not *what*, unless the *what* is non-obvious.

### 8. Documentation Updates
When making changes, update these files as appropriate:
- `CHANGELOG.md` — what changed and why
- `VERSION` — increment version number
- `ROADMAP.md` — if completing or adding milestones
- `TODO.md` — if completing or discovering tasks
- `MEMORY.md` — if discovering codebase observations
- `HANDOFF.md` — at end of session, document findings for next agent

### 9. Key File Locations
| Path | Purpose |
|------|---------|
| `src/` | TypeScript source |
| `plugin/` | Built JavaScript output |
| `tests/` | Test files |
| `docs/` | Documentation |
| `vscode-extension/` | VS Code extension (WIP) |
| `openclaw/` | OpenClaw gateway plugin |
| `gemini-cli-extension/` | Gemini CLI integration |
| `opencode-plugin/` | OpenCode integration |
| `cursor-hooks/` | Cursor IDE hooks |
| `benchmarks/` | Performance benchmarks |
| `scripts/` | Build and utility scripts |
| `installer/` | Cross-platform installer |
| `ragtime/` | Email investigation workflows |

### 10. Environment
- **Runtime**: Node.js ≥18, Bun (auto-installed)
- **Database**: SQLite3 (better-sqlite3) at `~/.claude-mem/claude-mem.db`
- **Vector DB**: Chroma via chroma-mcp MCP connection
- **Worker Port**: 37777 (configurable)
- **Settings**: `~/.claude-mem/settings.json`
