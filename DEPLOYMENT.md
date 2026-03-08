# Ultrawork 플러그인 사내 배포 가이드

## 개요

Ultrawork는 Claude Code의 내부 모델(Opus/Sonnet/Haiku)을 적재적소에 활용하여
비용 효율적이고 빠른 개발 워크플로우를 제공하는 오케스트레이션 플러그인입니다.

oh-my-opencode의 강점을 Claude Code 환경에 맞게 재구현했습니다.

## 핵심 기능

| 기능 | 설명 |
|------|------|
| **병렬 에이전트** | 독립적인 작업을 동시에 처리 |
| **모델 최적화** | Haiku(빠름), Sonnet(균형), Opus(고품질) 자동 선택 |
| **TODO 관리** | 작업 추적 및 자동 재개 |
| **팀별 프리셋** | 프론트/백엔드/DevOps/기획팀 맞춤 설정 |
| **Ralph Loop** | 완료까지 자동 반복 실행 |
| **메트릭 추적** | 모델 사용량, 비용 추정, 성능 통계 |
| **컨텍스트 관리** | 70%/85% 경고, 중요 컨텍스트 보존 |

## 제공 스킬

| 스킬 | 명령어 | 용도 |
|------|--------|------|
| **ultrawork** | `/ultrawork <task>` | 전체 기능 활성화 |
| **plan** | `/plan <task>` | Prometheus 인터뷰 모드 |
| **quick** | `/quick <task>` | Haiku 기반 빠른 실행 |
| **loop** | `/loop <task>` | 완료까지 자동 반복 |
| **stats** | `/stats` | 세션 통계 확인 |

## 설치 방법

### 1. 전체 스킬 복사

```bash
# Windows (PowerShell)
$skills = @("ultrawork", "plan", "quick", "loop", "stats")
foreach ($skill in $skills) {
  Copy-Item -Path "C:\source\claude-sisyphus-plugin\skills\$skill" -Destination "$env:USERPROFILE\.claude\skills\$skill" -Recurse -Force
}

# 또는 수동 복사
xcopy /E /I /Y "C:\source\claude-sisyphus-plugin\skills\*" "%USERPROFILE%\.claude\skills\"

# macOS/Linux
cp -r /path/to/claude-sisyphus-plugin/skills/* ~/.claude/skills/
```

### 2. 설치 확인

Claude Code에서:
```
/ultrawork 테스트
/quick 테스트
/stats
```

각 스킬이 활성화되면 설치 완료.

### 3. (선택) MCP 서버 설치

번들된 MCP 서버를 사용하려면:
```bash
cd C:\source\claude-sisyphus-plugin
npm install
npm run build
```

## 사용법

### 기본 사용

```
/ultrawork <작업 설명>
```

예시:
```
/ultrawork 인증 모듈 리팩토링
/ultrawork API 엔드포인트 목록 찾기
/ultrawork 테스트 커버리지 분석
```

### 모델 선택 (자동)

플러그인이 작업 유형에 따라 자동으로 모델을 선택합니다:

| 작업 유형 | 선택 모델 | 이유 |
|-----------|-----------|------|
| 코드 검색 | Haiku | 빠르고 저비용 |
| 문서 분석 | Sonnet | 균형 잡힌 이해력 |
| 아키텍처 설계 | Opus | 깊은 추론 필요 |

### 병렬 실행

독립적인 작업은 자동으로 병렬 실행됩니다:

```
/ultrawork 다음 작업들을 병렬로 처리해줘:
1. src/components에서 모든 React 컴포넌트 찾기
2. API 엔드포인트 목록 추출
3. 테스트 파일 분석
```

## 팀별 프리셋

### Frontend Team

UI/UX, 컴포넌트, 스타일 작업에 최적화

```json
{
  "modelStrategy": {
    "default": "sonnet",
    "explore": "haiku",
    "design": "opus"
  },
  "concurrency": {
    "maxParallel": 5
  }
}
```

### Backend Team

API, 데이터베이스, 보안 작업에 최적화

```json
{
  "modelStrategy": {
    "default": "sonnet",
    "explore": "haiku",
    "security": "opus"
  },
  "concurrency": {
    "maxParallel": 3
  }
}
```

### DevOps Team

CI/CD, 인프라, 컨테이너 작업에 최적화

```json
{
  "modelStrategy": {
    "default": "haiku",
    "architecture": "opus"
  },
  "concurrency": {
    "maxParallel": 3
  }
}
```

### Design/Planning Team

요구사항, 문서화, 기획 작업에 최적화

```json
{
  "modelStrategy": {
    "default": "opus",
    "research": "sonnet"
  },
  "concurrency": {
    "maxParallel": 2
  }
}
```

## 커스터마이징

### 프리셋 파일 위치

```
~/.claude/skills/ultrawork/presets/
├── frontend.json
├── backend.json
├── devops.json
└── planning.json
```

### 프리셋 수정

1. 해당 팀 프리셋 파일 복사
2. 본인 팀 필요에 맞게 수정
3. `~/.claude/skills/ultrawork/presets/custom.json`으로 저장

### 프리셋 구조

```json
{
  "name": "Custom Team",
  "description": "팀 설명",

  "modelStrategy": {
    "default": "sonnet",
    "rules": [
      { "pattern": "keyword", "model": "haiku|sonnet|opus" }
    ]
  },

  "agents": {
    "explorer": { "model": "haiku" },
    "analyzer": { "model": "sonnet" },
    "architect": { "model": "opus" }
  },

  "concurrency": {
    "maxParallel": 3
  },

  "keywords": ["domain", "specific", "terms"],
  "filePatterns": ["**/*.ext"]
}
```

## 추가 도구

### LSP 도구 (Language Server Protocol)

코드 탐색을 위한 IDE 수준의 기능:

```typescript
// 사용 예시
lsp_goto_definition({ file: "src/app.ts", line: 10, character: 5 })
lsp_find_references({ file: "src/utils.ts", line: 20, character: 10 })
lsp_rename({ file: "src/service.ts", line: 15, character: 8, newName: "newFunction" })
lsp_diagnostics({ file: "src/app.ts", severityFilter: "error" })
```

| 도구 | 설명 |
|------|------|
| `lsp_goto_definition` | 심볼 정의로 이동 |
| `lsp_find_references` | 모든 참조 찾기 |
| `lsp_workspace_symbols` | 워크스페이스 심볼 검색 |
| `lsp_rename` | 안전한 리네임 |
| `lsp_diagnostics` | 에러/경고 조회 |

### AST-Grep 도구 (구조적 검색/치환)

AST 기반으로 코드 패턴을 검색하고 안전하게 변환:

```typescript
// 사용 예시
ast_search({ pattern: "console.log($$$)", language: "typescript" })
ast_replace({ pattern: "var $NAME = $VALUE", replacement: "const $NAME = $VALUE" })
ast_refactor({ ruleId: "ts-var-to-const" })
```

| 도구 | 설명 |
|------|------|
| `ast_search` | 패턴 기반 코드 검색 |
| `ast_replace` | 구조적 코드 치환 (dry-run 기본) |
| `ast_refactor` | 내장 리팩토링 규칙 적용 |
| `ast_find_functions` | 모든 함수 정의 찾기 |
| `ast_find_classes` | 모든 클래스 정의 찾기 |

### Comment Sanitizer (주석 정리)

AI가 생성한 과도한 주석을 정리:

```typescript
// 제거되는 주석 예시
// Import the module (자명한 import 위의 주석)
// This function returns the result (불필요한 설명)
// Loop through the array (코드를 그대로 설명)

// 보존되는 주석 예시
// TODO: 나중에 최적화 필요
// WARNING: 이 함수는 thread-safe하지 않음
/** JSDoc 문서화 */
```

## MCP 서버 설정

### 권장 MCP 서버

프리셋별 권장 MCP 서버:

| 팀 | 권장 서버 |
|----|----------|
| Frontend | Figma, Context7, GitHub |
| Backend | OpenAPI, Swagger, Context7, GitHub |
| DevOps | GitHub, GitHub Project Manager |
| Planning | GitHub, Software Planning MCP |

### MCP 서버 설치

```powershell
# PowerShell 스크립트로 일괄 설치
cd C:\source\claude-sisyphus-plugin\mcp
.\setup-mcp-servers.ps1 -Preset frontend

# 또는 전체 설치
.\setup-mcp-servers.ps1 -Preset full
```

### 환경 변수 설정

```bash
# GitHub (필수)
GITHUB_TOKEN=ghp_xxxxx

# Figma (Frontend팀)
FIGMA_ACCESS_TOKEN=figd_xxxxx
```

## FAQ

### Q: 외부 API (GPT, Gemini) 비용이 발생하나요?

A: 아니요. Ultrawork는 Claude 내부 모델(Opus/Sonnet/Haiku)만 사용합니다.
   Claude Code Max 구독 내에서 추가 비용 없이 사용 가능합니다.

### Q: Haiku는 품질이 낮지 않나요?

A: 단순 검색/탐색 작업에는 Haiku가 충분합니다.
   복잡한 추론이 필요한 경우에만 Opus를 사용하여 비용을 최적화합니다.

### Q: 기존 Claude Code와 뭐가 다른가요?

A: Ultrawork는 다음을 추가합니다:
   - 자동 모델 선택 (작업 유형에 따른 최적 모델)
   - 병렬 에이전트 실행 (독립 작업 동시 처리)
   - TODO 자동 관리 (작업 추적 및 재개)
   - 팀별 최적화 프리셋

### Q: 기존 스킬/MCP와 충돌하나요?

A: 아니요. Ultrawork는 기존 설정과 독립적으로 동작합니다.
   필요 시 다른 스킬과 함께 사용 가능합니다.

## 지원

문의: ai@suprema.co.kr
GitLab: http://gitlab.suprema.co.kr/claude-code/sisyphus
