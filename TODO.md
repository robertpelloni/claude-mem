# TODO — Claude-Mem

> Short-term features, bug fixes, and improvements.

## 🔴 Critical / Blocking

- [ ] **Merge upstream v10.5.2** — 20 commits behind upstream/main. 24 file conflicts need careful resolution. Includes `smart-explore` AST navigation, hook crash fixes, and skill conversions.
- [ ] **Fix CLAUDE.md stale version** — References v5.5.1, actual version is 10.3.1. Should read from `VERSION` file.

## 🟡 High Priority

- [ ] **Complete VS Code extension** — Scaffolded in `vscode-extension/` with extension.ts, session-manager.ts, worker-client.ts. Needs: build pipeline, marketplace publishing, feature completion (memory browser panel, inline annotations).
- [ ] **Endless Mode stabilization** — Currently beta-only. Needs production benchmarks, real-world testing, configurable compression levels.
- [ ] **Transcript viewer completion** — `src/ui/transcript-viewer.html` exists (614 lines) but integration status unclear.
- [ ] **Database migration system** — Currently "recreates on schema changes." CLAUDE.md explicitly says: "TODO: Add proper migrations for production."

## 🟢 Normal Priority

- [ ] **Search server consolidation** — `src/servers/search-server.ts` (2,347 lines) may need modularization. Formatter modules exist but the main file is very large.
- [ ] **Viewer UI sidebar** — `src/ui/viewer/components/Sidebar.tsx` (243 lines) added but integration with main App.tsx could be tighter.
- [ ] **Help modal/page** — `HelpModal.tsx` (117 lines) and `HelpPage.tsx` (171 lines) exist but may need content review.
- [ ] **System status page** — `SystemStatus.tsx` (170 lines) exists; verify it shows all relevant diagnostic info.
- [ ] **Integrations status** — `IntegrationsStatus.tsx` (99 lines) shows Chroma/OpenCode connectivity; expand for other integrations.
- [ ] **Search input** — `SearchInput.tsx` (67 lines) and `SearchPage.tsx` (147 lines) need UX polish.

## 🔵 Low Priority / Nice to Have

- [ ] **Branch memory** — Upstream has `branch-memory` branch; investigate feature scope.
- [ ] **Automated HANDOFF.md generation** — Auto-write session handoff at session end.
- [ ] **Gemini CLI extension** — `gemini-cli-extension/` directory exists (4 files). Document and complete.
- [ ] **OpenCode plugin** — `opencode-plugin/` directory exists (6 files). Document and verify.
- [ ] **Ragtime module** — `ragtime/` directory (4 files). Document purpose and status.
- [ ] **Cursor hooks** — `cursor-hooks/` (10 files). Verify compatibility with latest Cursor.
- [ ] **Benchmark suite** — `benchmarks/` (10 files). Document and ensure CI integration.
- [ ] **Installer improvements** — `installer/` (15 files). Cross-platform installer verification.

## 🐛 Known Issues

- [ ] Windows console window briefly appears when worker starts (documented in README)
- [ ] CHANGELOG.md previously had merge conflict markers (now fixed)
- [ ] README.md previously had merge conflict markers (now fixed)
- [ ] `docs/UNIVERSAL_LLM_INSTRUCTIONS.md` contains omni-workspace instructions not specific to claude-mem

## 📝 Documentation Gaps

- [x] `VERSION` file — Created
- [x] `VISION.md` — Created
- [x] `ROADMAP.md` — Created
- [x] `TODO.md` — This file
- [ ] `AGENTS.md` — In progress
- [ ] `GEMINI.md` — In progress
- [ ] `GPT.md` — In progress
- [ ] `.github/copilot-instructions.md` — In progress
- [ ] `DEPLOY.md` — In progress
- [ ] `MEMORY.md` — In progress
- [ ] `HANDOFF.md` — In progress
