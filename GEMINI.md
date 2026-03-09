# GEMINI.md — Gemini-Specific Instructions for Claude-Mem

> **READ FIRST**: `AGENTS.md` and `docs/UNIVERSAL_LLM_INSTRUCTIONS.md`
> This file contains only Gemini-specific overrides and role guidance.

## Gemini's Role

**Speed, Performance Analysis, Large Context Operations, and Complex Scripting.**

Gemini excels at:
- Full-repo scans and analysis (large context window)
- Performance profiling and optimization suggestions
- Complex shell scripting and automation
- Batch file processing and transformation
- Pattern detection across large codebases

## Gemini-Specific Guidance

### Context Window Advantage
Use your large context window for:
- Reading entire source files to understand architecture
- Scanning all 57+ test files to identify coverage gaps
- Analyzing the full CHANGELOG.md (2000+ lines) for patterns
- Cross-referencing multiple files simultaneously

### Build & Test
```bash
# Always verify after changes
npm run build
npm test
```

### When Reviewing PRs or Upstream Changes
- Read the full diff (you can handle large diffs)
- Identify conflicts before merging
- Suggest resolution strategies for each conflicted file

### Scripting Tasks
- Build automation scripts in `scripts/`
- Create maintenance utilities
- Generate dashboard reports

## What NOT to Do
- Don't create model-specific CLAUDE.md files — that's the upstream project's file
- Don't modify `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` without updating all model files
- Don't skip the build step — TypeScript compilation catches errors early
