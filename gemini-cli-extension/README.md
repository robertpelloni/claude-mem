# Claude-Mem for Gemini CLI

This extension integrates [Claude-Mem](https://github.com/thedotmack/claude-mem) with the Gemini CLI using the Model Context Protocol (MCP).

## Features

- **Memory Search**: Allows Gemini to search your project history and past work.
- **Context Injection**: Automatically retrieves relevant context for the current task.
- **Observation Recording**: Saves Gemini's actions and outputs to the persistent memory.

## Installation

1.  Ensure the main Claude-Mem worker is running (`npm run worker:start` in the root `claude-mem` directory).
2.  Install this extension:
    ```bash
    cd gemini-cli-extension
    npm install
    npm run build
    ```
3.  Configure Gemini CLI to use this MCP server (refer to Gemini CLI documentation for adding MCP servers).
    - Command: `node path/to/gemini-cli-extension/dist/index.js`

## Tools

- `search_memory`: Search for past observations, decisions, and code snippets.
- `get_recent_context`: Retrieve the most recent context for the current project.
