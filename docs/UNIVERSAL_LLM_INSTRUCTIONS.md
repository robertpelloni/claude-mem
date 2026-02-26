# Universal LLM Instructions — Claude-Mem

> **SINGLE SOURCE OF TRUTH for all AI agents operating on the claude-mem project.**
> Model-specific overrides: `CLAUDE.md`, `GEMINI.md`, `GPT.md`, `.github/copilot-instructions.md`
> Quick reference: `AGENTS.md`

## 1. Project Context & Vision

Claude-mem is a **persistent memory compression system** for Claude Code. It captures tool usage observations, compresses them via AI, and injects relevant context into future sessions.

- **Upstream**: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) (original author: Alex Newman)
- **Fork**: [robertpelloni/claude-mem](https://github.com/robertpelloni/claude-mem)
- **Vision**: See `VISION.md` for the full project vision and design philosophy.
- **Roadmap**: See `ROADMAP.md` for milestones and future phases.

## 2. Global Mandates

- **Autonomy First**: Proceed with implementation, research, and documentation autonomously. Do not pause for confirmation unless a critical, irreversible destructive action is about to be taken.
- **Never Lose Features**: When merging branches or syncing upstream, **ALWAYS intelligently merge and solve conflicts.** Favor local/new changes that represent progress.
- **Conventions**: Follow existing project conventions (TypeScript, ESM modules, better-sqlite3, Express.js, esbuild).
- **Upstream Syncing**: Always check for and merge upstream changes from `thedotmack/claude-mem` into the `robertpelloni` fork.
- **Fail-Open**: Hooks must never block Claude Code. Exit cleanly on errors.

## 3. Documentation & Versioning Protocol

- **Single Source of Truth**: The `VERSION` file contains the current version number.
- **Increment on Build**: Every significant change set MUST bump the version.
- **Changelog**: Record changes in `CHANGELOG.md` with every version bump.
  - Format: `## [vX.Y.Z] - YYYY-MM-DD`
  - Categories: New Features, Bug Fixes, Breaking Changes, Technical Details
- **Commit Message**: `chore: bump version to X.Y.Z — <description>`
- **Version Sync Locations**: `VERSION`, `package.json`, `CLAUDE.md`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- **Model-Specific Files**: `CLAUDE.md`, `GEMINI.md`, `GPT.md` must only contain model-specific overrides and reference this document.
- **Handoff**: End sessions by updating `HANDOFF.md` with findings, changes, and next steps.

## 4. Workflow Protocols

### A. Feature Implementation
1. **Analyze**: Read `ROADMAP.md`, `TODO.md`, `AGENTS.md`. Search codebase for context.
2. **Plan**: Select a feature. Break into atomic steps.
3. **Execute**: Implement. Self-correct errors immediately.
4. **Verify**: Run `npm run build` and `npm test`.
5. **Commit**: Descriptive messages, push.
6. **Loop**: Next feature without pausing.

### B. Upstream Sync
1. `git fetch upstream`
2. `git merge upstream/main` — resolve conflicts preserving fork features.
3. `npm run build` and `npm test` to verify.
4. Push merged result.

## 5. Model-Specific Roles

- **Claude**: Architect, Planner, Documentation Lead. Holistic system understanding, large-scale refactoring.
- **Gemini**: Speed, Performance, Large Context. Full-repo scans, complex scripting, pattern detection.
- **GPT**: Code Generation, Unit Testing. Algorithm implementation, type-safe interfaces.

## 6. Architecture Quick Reference

| Component | Source | Built Output | Format |
|-----------|--------|--------------|--------|
| Hooks | `src/hooks/` | `plugin/scripts/*-hook.js` | ESM |
| Worker | `src/services/worker-service.ts` | `plugin/worker-service.cjs` | CJS |
| Viewer UI | `src/ui/viewer/` | `plugin/ui/viewer.html` | HTML bundle |
| Skills | `plugin/skills/` | (markdown, no build) | MD |
| Database | `src/services/sqlite/` | — | SQLite3 |
| Vector | `src/services/sync/` | — | Chroma MCP |

## 7. Key Commands

```bash
npm run build              # Compile TypeScript → plugin/
npm run sync-marketplace   # Sync to ~/.claude/plugins/marketplaces/thedotmack/
npm test                   # Run all tests
npm run worker:start       # Start worker
npm run worker:restart     # Restart worker
npm run worker:logs        # View worker logs
```
