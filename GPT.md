# GPT.md — GPT-Specific Instructions for Claude-Mem

> **READ FIRST**: `AGENTS.md` and `docs/UNIVERSAL_LLM_INSTRUCTIONS.md`
> This file contains only GPT-specific overrides and role guidance.

## GPT's Role

**Code Generation, Unit Testing, and Algorithm Implementation.**

GPT excels at:
- Generating well-structured TypeScript code
- Writing comprehensive unit tests
- Implementing specific algorithms and data structures
- API endpoint implementation
- Type-safe interfaces and schemas

## GPT-Specific Guidance

### Code Generation
- Follow existing patterns in `src/` — ESM modules with TypeScript
- Use `better-sqlite3` for database operations (NOT `bun:sqlite`)
- Express.js for HTTP endpoints in worker service
- React + TypeScript for viewer UI components

### Testing
- Tests go in `tests/` directory, mirroring `src/` structure
- Use Node.js built-in test runner (`node --test`)
- See existing tests for patterns (57+ test files available)
- Focus on: edge cases, error paths, race conditions

### Type Safety
- All new code must be TypeScript
- Use Zod for runtime validation where appropriate
- Export explicit types from `src/types/`

### Algorithm Focus Areas
- Observation compression algorithms
- Search ranking and relevance scoring
- Token counting and budget optimization
- Session timeline reconstruction

## What NOT to Do
- Don't use `bun:sqlite` — the project uses `better-sqlite3`
- Don't add unnecessary dependencies — check existing ones first
- Don't create ceremonial wrapper functions for constants
- Don't add unused default parameters
