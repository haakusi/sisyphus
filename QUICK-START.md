# Sisyphus Plugin 빠른 시작 가이드

Claude Code를 시니어 개발자처럼 만들어주는 오케스트레이션 플러그인입니다.

---

## 설치 (1분)

### 방법 1: 전역 설치 (권장)

모든 프로젝트에서 사용 가능합니다.

```bash
# 1. 플러그인 clone
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git ~/.claude-sisyphus

# 2. 빌드
cd ~/.claude-sisyphus && npm install && npm run build

# 3. 전역 스킬 복사 (PowerShell)
Copy-Item -Path "~\.claude-sisyphus\skills\*" -Destination "$env:USERPROFILE\.claude\skills\" -Recurse -Force

# 4. 전역 MCP 설정 (선택)
Copy-Item -Path "~\.claude-sisyphus\.mcp.json" -Destination "$env:USERPROFILE\.claude\mcp.json"
```

### 방법 2: 프로젝트별 설치

특정 프로젝트에서만 사용합니다.

```bash
# 프로젝트 루트에서
git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git .claude-plugins/sisyphus
cd .claude-plugins/sisyphus && npm install && npm run build

# 프로젝트 스킬 폴더로 복사
Copy-Item -Path ".claude-plugins\sisyphus\skills\*" -Destination ".claude\skills\" -Recurse -Force
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

#### LSP 도구 (Language Server Protocol)
- `lsp_goto_definition` - 함수/변수 정의로 이동
- `lsp_find_references` - 모든 참조 찾기
- `lsp_rename` - 안전한 리네임 (전체 프로젝트)
- `lsp_diagnostics` - 에러/경고 조회

#### AST-Grep 도구 (구조적 코드 검색)
- `ast_search` - 패턴 기반 코드 검색 (정규식보다 정확)
- `ast_replace` - 구조적 코드 치환
- `ast_refactor` - 내장 리팩토링 규칙 적용

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
