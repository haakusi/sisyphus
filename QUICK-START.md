# Sisyphus Plugin 빠른 시작 가이드

Claude Code를 시니어 개발자처럼 만들어주는 오케스트레이션 플러그인입니다.

---

## 설치

### 원클릭 설치 (권장)

**Windows (PowerShell):**
```powershell
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git $env:USERPROFILE\.claude-sisyphus
cd $env:USERPROFILE\.claude-sisyphus
npm install
npm run build
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

**macOS/Linux:**
```bash
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git ~/.claude-sisyphus
cd ~/.claude-sisyphus
chmod +x install.sh && ./install.sh
```

### 수동 설치

```bash
# 1. Clone
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git ~/.claude-sisyphus

# 2. Build
cd ~/.claude-sisyphus && npm install && npm run build

# 3. 스킬 복사 (Windows PowerShell)
Copy-Item -Path "~\.claude-sisyphus\skills\*" -Destination "$env:USERPROFILE\.claude\skills\" -Recurse -Force

# 3. 스킬 복사 (macOS/Linux)
cp -r ~/.claude-sisyphus/skills/* ~/.claude/skills/

# 4. Claude Code 재시작
```

### 업데이트

새 기능이 추가되면 pull 받고 다시 설치:

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\.claude-sisyphus
git pull origin main
npm run build
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

**macOS/Linux:**
```bash
cd ~/.claude-sisyphus
git pull origin main
npm run build && ./install.sh
```

---

## 설치 확인

Claude Code에서 다음 명령어로 테스트:

```
/ultrawork 테스트
```

"Ultrawork Mode Activated" 메시지가 나오면 성공입니다.

---

## 포함된 기능

### 7개 슬래시 명령어

| 명령어 | 용도 | 예시 |
|--------|------|------|
| `/ultrawork <작업>` | **풀 기능 모드** - 병렬 에이전트, TODO 추적, 전문가 워크플로우 | `/ultrawork 인증 시스템 리팩토링` |
| `/plan <작업>` | **계획 모드** - 복잡한 작업의 요구사항 정리 | `/plan 결제 시스템 설계` |
| `/quick <작업>` | **빠른 실행** - 단순 작업을 신속하게 처리 | `/quick 버튼 색상 변경` |
| `/loop <작업>` | **반복 실행** - 완료될 때까지 자동 진행 | `/loop API 엔드포인트 전체 마이그레이션` |
| `/stats` | **세션 통계** - 사용량 및 비용 추정 | `/stats` |
| `/deep-research <주제>` | **심층 조사** - 여러 소스 기반 리서치 | `/deep-research OAuth2 모범 사례` |
| `/setup-mcp` | **MCP 설정** - Figma, GitHub 등 연동 | `/setup-mcp figma` |

### 2개 MCP 서버 (코드 분석 도구)

플러그인 설치 시 **자동으로 등록**됩니다. 직접 도구 이름을 호출할 필요 없이 자연어로 요청하면 Claude가 알아서 사용합니다.

```
사용자: "getUserById 함수 정의 어디있어?"
Claude: (자동으로 적절한 도구 선택) → "src/services/user.ts:45에 있습니다"
```

#### LSP (Language Server Protocol) - IDE 수준의 코드 인텔리전스

| 도구 | 기능 | 자연어 요청 예시 |
|------|------|------------------|
| `lsp_goto_definition` | 함수/변수 정의 위치로 이동 | "이 함수 어디서 정의됐어?" |
| `lsp_find_references` | 모든 참조 찾기 | "이 함수 어디서 호출돼?" |
| `lsp_rename` | 전체 프로젝트에서 안전하게 이름 변경 | "이 변수 이름 바꿔줘" |
| `lsp_hover` | 타입 정보, 문서 표시 | "이 변수 타입이 뭐야?" |
| `lsp_diagnostics` | 에러/경고 조회 | "이 파일 에러 있어?" |

#### AST-Grep - 구조적 패턴 매칭 (정규식보다 정확)

| 도구 | 기능 | 자연어 요청 예시 |
|------|------|------------------|
| `ast_search` | 패턴으로 코드 검색 | "console.log 다 찾아줘" |
| `ast_replace` | 구조적 코드 치환 | "var를 const로 바꿔줘" |
| `ast_refactor` | 내장 리팩토링 규칙 | "이 파일 리팩토링해줘" |
| `ast_find_functions` | 모든 함수 정의 찾기 | "함수 목록 보여줘" |
| `ast_find_classes` | 모든 클래스 찾기 | "클래스 구조 보여줘" |

#### 언제 뭘 써야 하나? (Claude가 자동 선택)

| 상황 | 사용되는 도구 |
|------|--------------|
| "이 함수 정의 어디야?" | LSP `lsp_goto_definition` |
| "이 변수 어디서 사용돼?" | LSP `lsp_find_references` |
| "console.log 다 찾아줘" | AST `ast_search` |
| "var를 const로 바꿔줘" | AST `ast_replace` |
| "이 함수 이름 바꿔줘" | LSP `lsp_rename` |
| "모든 async 함수 찾아줘" | AST `ast_search` |

#### MCP 도구 사용을 위한 선택적 설치

MCP 서버가 완전히 작동하려면 아래 도구들이 필요합니다:

```bash
# AST-grep CLI (ast_search, ast_replace 등)
npm install -g @ast-grep/cli

# TypeScript Language Server (LSP 도구들)
npm install -g typescript-language-server typescript
```

> 없어도 플러그인 기본 기능(스킬)은 동작하지만, MCP 도구 사용 시 에러가 발생합니다.

### 병렬 에이전트 시스템

독립적인 작업을 동시에 처리:
- **Explore 에이전트**: 빠른 코드베이스 탐색
- **Plan 에이전트**: 아키텍처 결정
- **general-purpose 에이전트**: 복잡한 멀티스텝 작업

### TODO 자동 관리

복잡한 작업을 자동으로 할일 목록으로 분해하고 추적합니다.

---

## 사용 예시

### 코드 리팩토링
```
/ultrawork 인증 모듈을 JWT에서 OAuth2로 변경해줘
```

### 빠른 수정
```
/quick 로그인 버튼에 로딩 스피너 추가
```

### 복잡한 기능 구현
```
/loop 전체 결제 플로우 구현 (장바구니 -> 결제 -> 확인)
```

### 코드 분석
```
/ultrawork 이 프로젝트에서 사용되지 않는 함수 찾아줘
```

---

## vs 기본 Claude Code

| 기능 | 기본 Claude Code | + Sisyphus |
|------|-----------------|------------|
| 병렬 처리 | 수동 | 자동 병렬 에이전트 |
| 작업 추적 | 없음 | TODO 자동 관리 |
| 코드 분석 | 기본 검색 | LSP + AST-Grep |
| 워크플로우 | 단순 Q&A | 전문가 모드 |

---

## 문제 해결

### 명령어가 인식되지 않을 때
```bash
# 스킬 폴더 확인
ls "$env:USERPROFILE\.claude\skills"
# ultrawork, plan, quick 등 폴더가 있어야 함
```

### MCP 도구가 작동하지 않을 때
```bash
# 빌드 확인
cd ~/.claude-sisyphus && npm run build

# MCP 설정 확인
cat "$env:USERPROFILE\.claude\mcp.json"
```

---

## 지원

- GitLab: http://gitlab.suprema.co.kr/claude-code/sisyphus
- 문의: ai@suprema.co.kr
