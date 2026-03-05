# TODO — Claude-Mem

> Short-term features, bug fixes, and improvements.

## 🔴 Critical / Blocking

- [x] **Merge upstream v10.5.2** — 20 commits behind upstream/main. 24 file conflicts need careful resolution. Includes `smart-explore` AST navigation, hook crash fixes, and skill conversions.
- [x] **Fix CLAUDE.md stale version** — References v5.5.1, actual version is 10.3.1. Should read from `VERSION` file.

## 🟡 High Priority

- [x] **Complete VS Code extension** — Scaffolded in `vscode-extension/`. Needs build pipeline, marketplace sync logic, memory browser panel, and inline annotations.
- [ ] **OpenClaw Gateway** — `openclaw/` needs testing and validation for multi-agent capability.
- [ ] **Gemini CLI Bridge** — `gemini-cli-extension/` requires documentation on how memory spans between Claude and Antigravity.
- [ ] **Endless Mode stabilization** — Currently beta-only. Needs production benchmarks (via `benchmarks/`), real-world testing, and configurable compression levels.
- [x] **Transcript viewer completion** — `src/ui/transcript-viewer.html` exists (614 lines) and is now integrated and served at `/transcript-viewer`.
- [ ] **Database migration system** — Currently "recreates on schema changes." CLAUDE.md explicitly says: "TODO: Add proper migrations for production."

## 🟢 Normal Priority

- [ ] **Cursor Hooks** — Validate `cursor-hooks/` against the latest Cursor IDE release.
- [ ] **OpenCode Plugin** — Validate `opencode-plugin/` memory integration.
- [ ] **Installer Robustness** — Cross-platform verification of `installer/`.
- [ ] **Search server consolidation** — `src/servers/search-server.ts` (2,347 lines) may need modularization.
- [ ] **Viewer UI sidebar** — `src/ui/viewer/components/Sidebar.tsx` (243 lines) added but integration with main App.tsx could be tighter.
- [ ] **Help & Status UI** — Review `HelpModal.tsx`, `SystemStatus.tsx`, and `IntegrationsStatus.tsx` content and diagnostics.
- [ ] **Search input** — `SearchInput.tsx` (67 lines) and `SearchPage.tsx` (147 lines) need UX polish.

## 🔵 Low Priority / Nice to Have

- [ ] **Ragtime Module** — Document `ragtime/` purpose (external email/DB timeline generation).
- [ ] **Branch memory** — Upstream has `branch-memory` branch; investigate feature scope.
- [ ] **Automated HANDOFF.md generation** — Auto-write session handoff at session end.

## 🐛 Known Issues

- [ ] Windows console window briefly appears when worker starts (documented in README)
- [x] CHANGELOG.md previously had merge conflict markers (now fixed)
- [x] README.md previously had merge conflict markers (now fixed)
- [x] `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` contains omni-workspace instructions not specific to claude-mem (now fixed)

## 📝 Documentation Gaps

- [x] `VERSION` file — Created
- [x] `VISION.md` — Created
- [x] `ROADMAP.md` — Created
- [x] `TODO.md` — This file
- [x] `AGENTS.md` — Completed
- [x] `GEMINI.md` — Completed
- [x] `GPT.md` — Completed
- [x] `.github/copilot-instructions.md` — Completed
- [x] `DEPLOY.md` — Completed
- [x] `MEMORY.md` — Completed
- [x] `HANDOFF.md` — Completed
