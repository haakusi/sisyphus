# Sisyphus Plugin for Claude Code

Advanced agent orchestration plugin that transforms Claude Code into a senior engineer workflow.

## One-Line Install

### From Internal GitLab (Recommended)
```bash
/plugin install git:gitlab.suprema.co.kr/claude-code/sisyphus
```

### Manual Install
```bash
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git
cd sisyphus
npm install && npm run build
```

## What's Included

- **7 Skills**: /ultrawork, /plan, /quick, /loop, /stats, /setup-mcp, /deep-research
- **2 MCP Servers**: LSP tools, AST-grep tools
- **Parallel Agents**: Explore, Plan, general-purpose

## Features

### Skills (Slash Commands)

| Skill | Description |
|-------|-------------|
| `/ultrawork <task>` | Full Sisyphus mode with parallel agents and TODO tracking |
| `/plan <task>` | Structured planning with requirements gathering |
| `/quick <task>` | Fast execution for simple tasks (uses Haiku) |
| `/loop <task>` | Continuous execution until task completion |
| `/stats [period]` | Session metrics and cost estimates |
| `/deep-research <topic>` | Thorough multi-source research |

### MCP Tools

#### LSP Tools (Language Server Protocol)
- `lsp_goto_definition` - Jump to symbol definition
- `lsp_find_references` - Find all references
- `lsp_workspace_symbols` - Search symbols across workspace
- `lsp_document_symbols` - Get document outline
- `lsp_rename` - Rename symbol across workspace
- `lsp_hover` - Get type info and documentation
- `lsp_diagnostics` - Get errors and warnings

#### AST-Grep Tools
- `ast_search` - Pattern-based code search
- `ast_replace` - Structural code replacement
- `ast_refactor` - Apply built-in refactoring rules
- `ast_find_functions` - Find all functions
- `ast_find_classes` - Find all classes
- `ast_find_imports` - Find import statements
- `ast_list_rules` - List available refactoring rules

#### Utility Tools
- `sanitize_comments` - Remove AI-generated redundant comments
- `sisyphus_stats` - Session statistics

## Requirements

- Node.js 18+
- Claude Code CLI

### Optional (for full functionality)

```bash
npm install -g @ast-grep/cli typescript-language-server typescript
```

## Installation Methods

| Method | Command | Use Case |
|--------|---------|----------|
| **GitLab (Internal)** | `/plugin install git:gitlab.suprema.co.kr/claude-code/sisyphus` | Internal team (Recommended) |
| **Manual** | `git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git` | Direct clone |

## Project Structure

```
claude-sisyphus-plugin/
├── src/
│   ├── servers/           # MCP server implementations
│   │   ├── tools-server.ts   # Combined server (recommended)
│   │   ├── lsp-server.ts     # LSP-only server
│   │   └── ast-server.ts     # AST-only server
│   ├── tools/
│   │   ├── lsp/           # LSP client and tools
│   │   ├── ast-grep/      # AST-grep engine and tools
│   │   └── comment-sanitizer/
│   ├── hooks/             # 25 extension hooks
│   ├── context/           # Auto-inject and monitoring
│   ├── metrics/           # Session tracking
│   └── scripts/
│       └── setup.ts       # Installation script
├── skills/                # Slash command definitions
│   ├── ultrawork/
│   ├── plan/
│   ├── quick/
│   ├── loop/
│   ├── stats/
│   └── deep-research/
└── mcp/
    ├── recommended-servers.json  # External MCP server configs
    └── setup-mcp-servers.ps1    # Setup script for extras
```

## Usage Examples

### Ultrawork Mode
```
/ultrawork implement user authentication with OAuth2
```

### Quick Fix
```
/quick fix the typo in error message
```

### Planning Mode
```
/plan refactor the database layer for better performance
```

### Continuous Loop
```
/loop migrate all API endpoints to v2
```

## License

MIT
