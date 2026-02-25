# Handoff Notes

**State**: v7.4.0 - Feature Complete (Search, Gemini, OpenCode, Status).

**Next Task**: Implement the "System Dashboard" to visualize project structure and dependencies.

**Key Files**:
-   `src/ui/viewer/App.tsx`: Main routing logic.
-   `src/services/worker/http/routes/DataRoutes.ts`: Where new info endpoints should go.
-   `src/ui/viewer/components/`: New components go here.

**Build Process**:
-   `npm run build`: Builds everything (Worker, MCP, Viewer).
-   `cd gemini-cli-extension && npm run build`: Builds Gemini extension.
-   `cd opencode-plugin && bun run build`: Builds OpenCode plugin.

**Testing**:
-   `npm test`: Unit tests.
-   `python /home/jules/verification/verify_ui.py`: UI screenshots.
