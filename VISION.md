# VISION — Borg-Extension

> **The Autonomous Collective Memory for AI Coding Agents**

## What Borg-Extension Is

Borg-Extension is a **persistent memory compression system** for Claude Code. It seamlessly preserves context across sessions by automatically capturing tool usage observations, generating semantic summaries, and making them available to future sessions. Claude knows what happened last time without being told.

## The Problem

AI coding agents suffer from **session amnesia**. Every time Claude Code starts a new session, it has zero memory of previous work — what was built, what broke, what decisions were made and *why*. Users end up re-explaining context, re-discovering bugs, and losing the benefit of accumulated project knowledge.

## The Ultimate Vision

### Phase 1: Session Memory (✅ Complete)
- Capture tool executions as structured observations
- AI-powered compression (500-token summaries of full tool outputs)
- Progressive disclosure: index → details → perfect recall
- FTS5 full-text search across all history
- Web viewer UI with real-time SSE stream

### Phase 2: Intelligent Retrieval (✅ Complete)
- Hybrid search: SQLite FTS5 + Chroma vector embeddings
- Semantic search via mem-search skill
- Timeline queries with contextual window
- 10 specialized search operations
- Privacy control with `<private>` tags

### Phase 3: Ecosystem Integration (🔄 In Progress)
- **OpenClaw plugin** — persistent memory for OpenClaw gateway agents
- **VS Code extension** — visual memory management in the editor
- **Observation feeds** — real-time streaming to Telegram, Discord, Slack, etc.
- **Multi-provider support** — Gemini, OpenRouter fallback agents

### Phase 4: Endless Mode (🔬 Beta)
- Biomimetic memory architecture for dramatically extended sessions
- Working memory (compressed context) + Archive memory (full on disk)
- Linear O(N) scaling instead of quadratic O(N²)
- Projected: significantly more tool uses before context exhaustion

### Phase 5: The Autonomous Collective (🗺️ Planned)
- **Cross-session correlation engine** — detect that a bugfix in Session A was caused by an architectural decision in Session B months ago
- **Adversarial context pruning** — agent that identifies and defragments redundant memory
- **Knowledge marketplace** — export/share anonymized expert context packs
- **Visual context map** — interactive 3D graph of memory clusters at localhost:37777
- **Vault-backed parameter masking** — automatic secret detection and replacement with vault links
- **Immutable audit trail** — engineering black box proving exactly why code changes were made
- **Smart-explore AST navigation** — structural code understanding beyond text search

## Design Principles

1. **Zero Configuration** — Works automatically from first install. No setup, no commands, no manual intervention.
2. **Privacy First** — All data stored locally. `<private>` tags give users absolute control. No data leaves the machine unless explicitly configured.
3. **Progressive Disclosure** — Don't dump everything into context. Show the index (Layer 1), fetch details on demand (Layer 2), access source code when needed (Layer 3).
4. **Fail Open** — Never block Claude Code. If the worker is down, hooks exit cleanly. Context injection returns empty gracefully. The coding experience is never degraded.
5. **Simple First** — Write the dumb, obvious thing. Add complexity only when hitting the problem. YAGNI, DRY, fail fast.
6. **Delete Aggressively** — Less code = fewer bugs. If it's not needed, remove it.

## Architecture at a Glance

```
┌──────────────────────────────────┐
│         Claude Code CLI          │
│  (User's coding sessions)        │
├──────────────────────────────────┤
│     5 Lifecycle Hooks            │
│  SessionStart → PostToolUse →    │
│  UserPrompt → Stop → SessionEnd  │
├──────────────────────────────────┤
│     Worker Service (port 37777)  │
│  Express.js API + Web Viewer UI  │
│  Managed by Bun/PM2              │
├──────────────────────────────────┤
│     Storage Layer                │
│  SQLite + FTS5 │ Chroma Vectors  │
├──────────────────────────────────┤
│     AI Processing                │
│  Claude Agent SDK │ Gemini/OR    │
└──────────────────────────────────┘
```

## Target Users

- **Solo developers** using Claude Code daily who want continuity across sessions
- **Teams** using OpenClaw for multi-agent orchestration with shared memory
- **Power users** who want to search, audit, and understand their AI collaboration history

## Success Metrics

- Context injection at session start in <100ms
- Observation compression in <2 seconds
- Zero impact on Claude Code performance (fail-open architecture)
- Complete session history searchable via natural language
- Works on macOS, Linux, and Windows without platform-specific issues
