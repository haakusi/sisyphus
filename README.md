# Sisyphus Plugin for Claude Code

Advanced agent orchestration plugin that transforms Claude Code into a senior engineer workflow.

## Quick Start (팀원용)

### 1. 최초 설치 (1회만)

```bash
# 레포 클론
git clone http://192.168.1.18:8080/claude-code/sisyphus.git
cd sisyphus

# 설치 (의존성 + 빌드 + 스킬 symlink)
npm install
npm run build
npm run setup
```

### 2. Claude Code에 플러그인 등록

```bash
claude plugin add sisyphus@local --path <sisyphus 폴더 경로>
claude plugin enable sisyphus@local
```

### 3. (선택) 프로젝트에 Sisyphus 기본 적용

`/ultrawork` 없이도 Sisyphus 모드를 기본으로 사용하려면:

```bash
# 프로젝트 루트에 CLAUDE.md 복사
cp <sisyphus>/templates/CLAUDE.md <your-project>/CLAUDE.md
```

이후 해당 프로젝트에서 Claude Code 실행 시 자동으로 Sisyphus 모드 적용.

---

## 키워드 트리거 (Keyword Triggers)

슬래시 명령 없이도 키워드만으로 스킬이 자동 활성화됩니다.

| 키워드 | 활성화 기능 | 설명 |
|--------|-------------|------|
| `ultrawork` / `ulw` / `sisyphus` | Sisyphus 오케스트레이터 | 병렬 실행, 자동 위임, TODO 추적 |
| `search` / `find` | 병렬 탐색 모드 | 코드베이스 빠른 검색 |
| `analyze` / `investigate` / `examine` | 심층 분석 모드 | 코드/버그 깊은 분석 |
| `research` / `deep-research` | 연구 모드 | 다중 소스 종합 연구 |
| `ultrathink` / `think deeply` / `think hard` | Extended Thinking | 복잡한 문제 심층 사고 |

### 사용 예시

```
# 슬래시 명령 방식
/ultrawork 사용자 인증 구현해줘

# 키워드 방식 (동일하게 동작)
ultrawork 사용자 인증 구현해줘
ulw 사용자 인증 구현해줘

# 검색
search 로그인 관련 파일 찾아줘
find authentication 구현 위치

# 분석
analyze 이 버그 원인 파악해줘
investigate 성능 저하 원인

# 깊은 사고
ultrathink 이 아키텍처 최적화 방안
```

---

## 업데이트 방법

### 스킬/기능 업데이트 시

```bash
cd sisyphus
git pull
# 끝! 스킬은 symlink라 자동 반영됨
```

### 새 스킬 추가 시 (관리자가 추가한 경우)

```bash
git pull
npm run build
npm run setup   # 새 스킬 symlink 추가
```

---

## What's Included

- **11 Skills**: /ultrawork, /ulw, /plan, /quick, /loop, /stats, /setup-mcp, /deep-research, /search, /analyze, /ultrathink
- **2 MCP Servers**: LSP tools, AST-grep tools
- **Parallel Agents**: Explore, Plan, general-purpose

## Features

### Skills (Slash Commands)

| Skill | Keyword Triggers | Description |
|-------|------------------|-------------|
| `/ultrawork` | ultrawork, ulw, sisyphus | Full Sisyphus mode with parallel agents and TODO tracking |
| `/plan` | plan | Structured planning with requirements gathering |
| `/quick` | quick | Fast execution for simple tasks (uses Haiku) |
| `/loop` | loop | Continuous execution until task completion |
| `/stats` | stats | Session metrics and cost estimates |
| `/deep-research` | research, investigate | Thorough multi-source research |
| `/search` | search, find | Parallel codebase exploration |
| `/analyze` | analyze, examine | Deep code analysis mode |
| `/ultrathink` | ultrathink, think deeply | Extended thinking for complex problems |
| `/setup-mcp` | - | MCP server configuration helper |

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

## Requirements

- Node.js 18+
- Claude Code CLI

### Optional (for full functionality)

```bash
npm install -g @ast-grep/cli typescript-language-server typescript
```

## Project Structure

```
sisyphus/
├── src/
│   ├── servers/           # MCP server implementations
│   ├── tools/
│   │   ├── lsp/           # LSP client and tools
│   │   ├── ast-grep/      # AST-grep engine and tools
│   │   └── comment-sanitizer/
│   ├── hooks/             # Extension hooks
│   ├── context/           # Auto-inject and monitoring
│   ├── metrics/           # Session tracking
│   └── scripts/
│       └── setup.ts       # Installation script
├── skills/                # Slash command definitions (symlinked)
│   ├── ultrawork/         # + ulw alias
│   ├── search/            # search/find keywords
│   ├── analyze/           # analyze/investigate keywords
│   ├── ultrathink/        # think deeply keyword
│   ├── plan/
│   ├── quick/
│   ├── loop/
│   ├── stats/
│   ├── deep-research/
│   └── setup-mcp/
├── templates/
│   └── CLAUDE.md          # Sisyphus 기본 모드 템플릿
└── mcp/
    └── recommended-servers.json
```

## Usage Examples

### Ultrawork Mode
```
/ultrawork implement user authentication with OAuth2
ultrawork implement user authentication with OAuth2
ulw implement user authentication with OAuth2
```

### Quick Fix
```
/quick fix the typo in error message
```

### Search Mode
```
search 로그인 관련 코드
find authentication implementation
```

### Analysis Mode
```
analyze 이 함수의 성능 문제
investigate memory leak
```

### Deep Thinking
```
ultrathink 마이크로서비스 아키텍처 설계
think deeply about caching strategy
```

## Auto-Update Architecture

```
sisyphus/skills/          ← 마스터 소스 (git 관리)
        ↓ symlink
~/.claude/skills/         ← Claude Code가 읽는 위치

git pull 하면 ~/.claude/skills/ 에 자동 반영!
```

## License

MIT
