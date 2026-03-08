# Sisyphus Plugin for Claude Code

Claude Code 생산성 향상을 위한 내부 개발 플러그인

## 설치

### 방법 1: One-liner (SSH 키 설정된 경우)
```powershell
iwr -useb https://gitlab.suprema.co.kr/claude-code/sisyphus/-/raw/main/install.ps1 | iex
```

### 방법 2: 수동 설치
```powershell
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git $env:USERPROFILE\.claude-sisyphus
cd $env:USERPROFILE\.claude-sisyphus
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

설치 후 **Claude Code 재시작** 필요

## 키워드 (슬래시 없이 사용)

메시지 **맨 앞에** 작성 시 자동 활성화

| 키워드 | 기능 | 예시 |
|--------|------|------|
| `ulw` | 병렬 에이전트 + TODO 관리 | `ulw 로그인 기능 구현해줘` |
| `search` | 코드베이스 빠른 검색 | `search 인증 관련 파일` |
| `analyze` | 심층 코드 분석 | `analyze 이 함수 뭐하는거야` |
| `ultrathink` | 복잡한 문제 깊이 사고 | `ultrathink 아키텍처 설계` |

```
ulw 로그인 기능 구현해줘     (O) 작동
로그인 기능 ulw 구현해줘     (X) 작동 안함
```

**[상세 사용법 및 예시 보기 →](./USECASE.md)**

## 슬래시 명령어

| 명령어 | 기능 |
|--------|------|
| `/ultrawork` | ulw와 동일 |
| `/plan` | 구조화된 계획 수립 |
| `/quick` | 빠른 실행 (간단한 작업) |
| `/loop` | 완료까지 연속 실행 |
| `/stats` | 세션 통계 확인 |
| `/deep-research` | 심층 리서치 |
| `/setup-mcp` | MCP 서버 설정 |

## MCP 도구 (Claude 자동 사용)

### LSP 도구
`lsp_goto_definition`, `lsp_find_references`, `lsp_workspace_symbols`, `lsp_document_symbols`, `lsp_rename`, `lsp_hover`, `lsp_diagnostics`

### AST 도구
`ast_search`, `ast_replace`, `ast_refactor`, `ast_find_functions`, `ast_find_classes`, `ast_find_imports`

## 업데이트

```bash
cd ~/.claude-sisyphus && git pull && npm run setup
```

## 문의

박세원2 (swpark2@suprema.co.kr)
