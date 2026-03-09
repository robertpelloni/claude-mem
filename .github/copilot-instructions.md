# Copilot Instructions for Claude-Mem

> For full project context, see `AGENTS.md` in the repository root.

## Project Overview

Claude-mem is a persistent memory compression system for Claude Code. It captures tool usage observations, compresses them via AI, and injects relevant context into future sessions.

## Key Conventions

- **Language**: TypeScript (strict mode)
- **Module System**: ESM (`"type": "module"` in package.json)
- **Database**: `better-sqlite3` — NOT `bun:sqlite`
- **HTTP**: Express.js for worker service API
- **UI**: React + TypeScript for viewer (built to self-contained HTML bundle)
- **Testing**: Node.js built-in test runner (`node --test`)

## Architecture Hints

- **Hooks** in `src/hooks/` are lifecycle event handlers called by Claude Code
- **Worker service** in `src/services/worker-service.ts` runs on port 37777
- **SQLite store** in `src/services/sqlite/` handles all persistence
- **Vector search** via Chroma MCP manager in `src/services/sync/`
- **Viewer UI** in `src/ui/viewer/` uses React components

## Coding Style

- Simple, obvious solutions first
- Explicit error handling (fail fast, never silent)
- Meaningful comments explaining *why*, not *what*
- No magic numbers — use named constants
- No unused parameters or ceremonial wrappers

## Common Patterns

```typescript
// Database access
import { SessionStore } from './services/sqlite/SessionStore.js';
import { SessionSearch } from './services/sqlite/SessionSearch.js';

// Logging
import { logger } from './utils/logger.js';
logger.info('COMPONENT', 'message', { data });

// Settings
import { getSettings } from './shared/settings.js';
const settings = getSettings();
```

## Don't Suggest

- `bun:sqlite` imports (use `better-sqlite3`)
- Direct process spawning in hooks (use worker service)
- Synchronous file I/O in hot paths
- `console.log` (use the structured logger)
