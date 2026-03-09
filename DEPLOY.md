# DEPLOY — Claude-Mem Deployment Guide

## Method 1: Plugin Marketplace (Recommended for Users)

Start a Claude Code session and run:

```
> /plugin marketplace add thedotmack/claude-mem
> /plugin install claude-mem
```

Restart Claude Code. Memory is automatic from here.

## Method 2: Manual Clone & Build (For Development)

```bash
# Clone the fork
git clone https://github.com/robertpelloni/claude-mem.git
cd claude-mem

# Install dependencies
npm install

# Build the plugin
npm run build

# Sync to Claude Code's plugin directory
npm run sync-marketplace

# Start the worker service
npm run worker:start

# Verify worker is healthy
curl http://localhost:37777/api/health
```

### After Code Changes
```bash
# Hooks or skills changed:
npm run build
npm run sync-marketplace
# (takes effect next Claude Code session)

# Worker service changed:
npm run build
npm run sync-marketplace
npm run worker:restart

# Viewer UI changed:
npm run build
npm run sync-marketplace
npm run worker:restart
# (refresh browser at http://localhost:37777)
```

## Method 3: OpenClaw Gateway

One-liner installer for OpenClaw agents:

```bash
curl -fsSL https://install.cmem.ai/openclaw.sh | bash
```

The installer handles:
- Platform detection (macOS, Linux, WSL)
- Dependency management (Bun, uv, Node.js)
- AI provider setup
- Plugin installation and worker startup

### OpenClaw Configuration

Add to your OpenClaw gateway config:

```json
{
  "plugins": {
    "claude-mem": {
      "enabled": true,
      "config": {
        "project": "my-project",
        "syncMemoryFile": true,
        "observationFeed": {
          "enabled": true,
          "channel": "telegram",
          "to": "your-chat-id"
        }
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_MEM_MODEL` | `claude-sonnet-4-5` | AI model for observations |
| `CLAUDE_MEM_WORKER_PORT` | `37777` | Worker service port |
| `CLAUDE_MEM_WORKER_HOST` | `127.0.0.1` | Worker bind address |
| `CLAUDE_MEM_DATA_DIR` | `~/.claude-mem` | Data directory |
| `CLAUDE_MEM_LOG_LEVEL` | `INFO` | Log verbosity |
| `CLAUDE_MEM_CONTEXT_OBSERVATIONS` | `50` | Observations injected per session |

## File Locations

| Path | Description |
|------|-------------|
| `~/.claude-mem/claude-mem.db` | SQLite database |
| `~/.claude-mem/settings.json` | User settings |
| `~/.claude-mem/chroma/` | Vector embeddings |
| `~/.claude-mem/usage-logs/` | API usage tracking |
| `~/.claude/plugins/marketplaces/thedotmack/` | Installed plugin |

## Verification

```bash
# Check worker status
pm2 list

# View worker logs
npm run worker:logs

# Test context injection
npm run test:context

# Open web viewer
# Navigate to http://localhost:37777

# Check database integrity
sqlite3 ~/.claude-mem/claude-mem.db "PRAGMA integrity_check;"
```

## Troubleshooting

- **Worker not starting**: `npm run worker:restart` or `pm2 delete claude-mem-worker` for clean start
- **No context appearing**: `npm run test:context:verbose` to debug
- **Database issues**: Check `PRAGMA integrity_check` output
- **Windows console popup**: Cosmetic issue, doesn't affect functionality
- **Port in use**: Set `CLAUDE_MEM_WORKER_PORT` in `~/.claude-mem/settings.json`
