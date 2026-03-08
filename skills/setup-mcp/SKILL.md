---
name: setup-mcp
description: Configure MCP servers with presets or individual servers. Supports Figma, GitHub, OpenAPI, and more.
---

# Setup MCP Skill

Easily add and manage MCP (Model Context Protocol) servers for Claude Code.

## Usage

```
/setup-mcp [preset|server] [options]
```

## Quick Start

### Add Figma Integration
```
/setup-mcp figma --token YOUR_FIGMA_TOKEN
```

### Add Frontend Preset (Figma + GitHub + Context7)
```
/setup-mcp frontend --figma-token xxx --github-token xxx
```

### Add All Servers
```
/setup-mcp full --figma-token xxx --github-token xxx
```

## Available Presets

| Preset | Description | Servers Included |
|--------|-------------|------------------|
| `frontend` | Frontend development | figma, figma-context, context7, github, filesystem |
| `backend` | Backend development | openapi, swagger, context7, github, filesystem, microsoft-docs |
| `devops` | DevOps | github, github-project-manager, filesystem, microsoft-docs |
| `planning` | Planning/Design | github, github-project-manager, software-planning, context7 |
| `full` | All servers | All available servers |

## Available Servers

| Server | Description | Required Token |
|--------|-------------|----------------|
| `figma` | Figma design access | FIGMA_ACCESS_TOKEN |
| `figma-context` | Figma layout context | FIGMA_ACCESS_TOKEN |
| `github` | GitHub repos/issues/PRs | GITHUB_TOKEN |
| `github-project-manager` | GitHub Projects | GITHUB_TOKEN |
| `context7` | Library documentation | - |
| `openapi` | OpenAPI/Swagger tools | - |
| `swagger` | Swagger document wrapper | - |
| `microsoft-docs` | Microsoft documentation | - |
| `filesystem` | File system access | - |
| `software-planning` | Software planning tools | - |

## Token Setup URLs

- **Figma**: https://www.figma.com/developers/api#access-tokens
- **GitHub**: https://github.com/settings/tokens (repo, read:org scopes)

## MCP Tools Available After Setup

This skill adds the following tools to your Claude Code:

### `mcp_add_server`
Add individual server or preset:
```json
{
  "preset": "frontend",
  "tokens": {
    "FIGMA_ACCESS_TOKEN": "figd_xxx",
    "GITHUB_TOKEN": "ghp_xxx"
  }
}
```

### `mcp_remove_server`
Remove a registered server:
```json
{
  "server": "figma"
}
```

### `mcp_list_servers`
List all registered MCP servers.

### `mcp_list_presets`
Show available presets and servers.

## Examples

### Add Figma with Token
```
/setup-mcp figma
Token: figd_QN-RkIAnGzsMqtlEazJlCApUUfpFkiFjfLaxirGJ
```

### Check Current Servers
```
/setup-mcp list
```

### Remove Server
```
/setup-mcp remove github
```

## After Setup

1. **Restart Claude Code** to load new MCP servers
2. Run `/mcp` to verify servers are active
3. Use Figma tools: `get_file`, `get_images`, etc.

## Troubleshooting

### Server not loading
- Check `~/.claude/claude_desktop_config.json` for correct config
- Verify tokens are valid
- Check Claude Code logs: `~/.claude/logs/`

### Token expired
Run `/setup-mcp [server] --token NEW_TOKEN` to update
