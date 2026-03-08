# Sisyphus Plugin

Claude Code 생산성 향상 플러그인

## 기능

### 키워드 (메시지 맨 앞에 작성)
| 키워드 | 기능 |
|--------|------|
| `ulw` | 병렬 에이전트 + TODO 관리 |
| `search` | 코드베이스 빠른 검색 |
| `analyze` | 심층 코드 분석 |
| `ultrathink` | 복잡한 문제 깊이 사고 |

### 슬래시 명령어
`/ultrawork`, `/plan`, `/quick`, `/loop`, `/stats`, `/deep-research`, `/setup-mcp`

### MCP 도구 (Claude 자동 사용)
- **LSP**: 심볼 정의 이동, 참조 찾기, 타입 확인
- **AST**: 코드 패턴 검색/치환, 함수/클래스 찾기

## 설치

### 마켓플레이스에서 설치 (스킬만)
```bash
/plugin install sisyphus@bss-marketplace
```

### MCP 도구 사용 시 (추가 설치 필요)
```bash
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git ~/.claude-sisyphus
cd ~/.claude-sisyphus && npm install && npm run build
```

## 문의

박세원2 (swpark2@suprema.co.kr)
