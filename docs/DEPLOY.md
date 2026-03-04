# Deployment & Packaging Guide

This guide details the deployment flow and packaging strategy for Claude-Mem.

## Core Packages
Claude-Mem manages the following local module ecosystem:
- `gemini-cli-extension`: The primary interface handling Google Gemini CLI interactions via Model Context Protocol (MCP).
- `opencode-plugin`: Handles the underlying structure, execution environments, and hooks for OpenCode AI.

## Deployment Strategy
Our strategy relies heavily on the `npm run build` process which compiles:
- Hooks (`*-hook.js`)
- Worker service (`worker-service.cjs`)
- MCP Server (`mcp-server.cjs`)
- UI build output (`viewer-bundle.js` and HTML)

The output is bundled into the `plugin/` directory, from which the entire extension can be served or published to the target marketplace.

## Quick Start
1. Ensure dependencies are up-to-date: `npm install`
2. Build the project: `npm run build`
3. Link the package locally: `npm link`
4. Deploy the plugin by moving the contents of `plugin/` to the targeted plugin folder (`~/.claude/plugins/marketplaces/thedotmack`).

## Submodules
Currently, `gemini-cli-extension` and `opencode-plugin` function as standalone, local internal packages rather than formal Git Submodules. They are deeply integrated into the worker logic and their status is visually reported in the Settings Dashboard.
