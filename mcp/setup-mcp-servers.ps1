<#
.SYNOPSIS
    Sisyphus MCP 서버 설정 스크립트
.DESCRIPTION
    권장 MCP 서버들을 Claude Code에 설정합니다.
    팀 프리셋에 따라 필요한 서버만 선택적으로 설치할 수 있습니다.
.PARAMETER Preset
    설치할 프리셋 (frontend, backend, devops, planning, full)
.PARAMETER ConfigPath
    Claude Code 설정 파일 경로
.EXAMPLE
    .\setup-mcp-servers.ps1 -Preset frontend
    .\setup-mcp-servers.ps1 -Preset full
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("frontend", "backend", "devops", "planning", "full", "custom")]
    [string]$Preset = "full",

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "$env:USERPROFILE\.claude\claude_desktop_config.json"
)

$ErrorActionPreference = "Stop"

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

Write-Info @"

╔═══════════════════════════════════════════════════════════╗
║           Sisyphus MCP Server Setup Script                ║
║                                                           ║
║   Preset: $Preset
╚═══════════════════════════════════════════════════════════╝

"@

# 서버 정의
$servers = @{
    "figma" = @{
        command = "npx"
        args = @("-y", "@anthropic/mcp-server-figma")
        env = @{
            FIGMA_ACCESS_TOKEN = "`${FIGMA_ACCESS_TOKEN}"
        }
        description = "Figma 디자인 접근"
    }
    "figma-context" = @{
        command = "npx"
        args = @("-y", "figma-context-mcp")
        env = @{
            FIGMA_PERSONAL_ACCESS_TOKEN = "`${FIGMA_ACCESS_TOKEN}"
        }
        description = "Figma 레이아웃 컨텍스트"
    }
    "openapi" = @{
        command = "npx"
        args = @("-y", "@aws/mcp-server-openapi")
        env = @{}
        description = "OpenAPI 스펙 기반 도구 생성"
    }
    "swagger" = @{
        command = "npx"
        args = @("-y", "swagger-mcp")
        env = @{}
        description = "Swagger 문서 래핑"
    }
    "context7" = @{
        command = "npx"
        args = @("-y", "@upstash/context7-mcp")
        env = @{}
        description = "라이브러리 문서 자동 가져오기"
    }
    "github" = @{
        command = "npx"
        args = @("-y", "@github/mcp-server")
        env = @{
            GITHUB_TOKEN = "`${GITHUB_TOKEN}"
        }
        description = "GitHub 리포/이슈/PR 관리"
    }
    "github-project-manager" = @{
        command = "npx"
        args = @("-y", "mcp-github-project-manager")
        env = @{
            GITHUB_TOKEN = "`${GITHUB_TOKEN}"
        }
        description = "GitHub Projects 자동화"
    }
    "microsoft-docs" = @{
        command = "npx"
        args = @("-y", "@microsoft/mcp-docs-server")
        env = @{}
        description = "Microsoft 공식 문서"
    }
    "filesystem" = @{
        command = "npx"
        args = @("-y", "@modelcontextprotocol/server-filesystem", ".")
        env = @{}
        description = "파일 시스템 접근"
    }
    "software-planning" = @{
        command = "npx"
        args = @("-y", "software-planning-mcp")
        env = @{}
        description = "소프트웨어 계획/태스크 분해"
    }
}

# 프리셋 정의
$presets = @{
    "frontend" = @("figma", "figma-context", "context7", "github", "filesystem")
    "backend" = @("openapi", "swagger", "context7", "github", "filesystem", "microsoft-docs")
    "devops" = @("github", "github-project-manager", "filesystem", "microsoft-docs")
    "planning" = @("github", "github-project-manager", "software-planning", "context7")
    "full" = @("figma", "figma-context", "openapi", "swagger", "context7", "github", "github-project-manager", "microsoft-docs", "filesystem", "software-planning")
}

# 선택된 서버 목록
$selectedServers = $presets[$Preset]

Write-Info "선택된 프리셋: $Preset"
Write-Info "설치할 서버:"
foreach ($server in $selectedServers) {
    Write-Output "  - $server : $($servers[$server].description)"
}
Write-Output ""

# 환경 변수 확인
Write-Info "환경 변수 확인..."
$missingEnvVars = @()

if ($selectedServers -contains "figma" -or $selectedServers -contains "figma-context") {
    if (-not $env:FIGMA_ACCESS_TOKEN) {
        $missingEnvVars += "FIGMA_ACCESS_TOKEN"
    }
}

if ($selectedServers -contains "github" -or $selectedServers -contains "github-project-manager") {
    if (-not $env:GITHUB_TOKEN) {
        $missingEnvVars += "GITHUB_TOKEN"
    }
}

if ($missingEnvVars.Count -gt 0) {
    Write-Warning "다음 환경 변수가 설정되지 않았습니다:"
    foreach ($var in $missingEnvVars) {
        Write-Warning "  - $var"
    }
    Write-Warning "해당 MCP 서버는 환경 변수 설정 후 사용 가능합니다."
    Write-Output ""
}

# 설정 파일 디렉토리 생성
$configDir = Split-Path $ConfigPath -Parent
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Success "설정 디렉토리 생성: $configDir"
}

# 기존 설정 읽기 또는 새로 생성
if (Test-Path $ConfigPath) {
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    Write-Info "기존 설정 파일 로드: $ConfigPath"
} else {
    $config = @{ mcpServers = @{} }
    Write-Info "새 설정 파일 생성"
}

# mcpServers 속성이 없으면 추가
if (-not $config.mcpServers) {
    $config | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{} -Force
}

# 서버 설정 추가
foreach ($serverName in $selectedServers) {
    $serverConfig = $servers[$serverName]

    $mcpConfig = @{
        command = $serverConfig.command
        args = $serverConfig.args
    }

    if ($serverConfig.env.Count -gt 0) {
        $mcpConfig.env = $serverConfig.env
    }

    $config.mcpServers | Add-Member -NotePropertyName $serverName -NotePropertyValue $mcpConfig -Force
    Write-Success "  + $serverName 추가됨"
}

# 설정 파일 저장
$config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
Write-Success "설정 저장 완료: $ConfigPath"

Write-Output ""
Write-Info @"
╔═══════════════════════════════════════════════════════════╗
║                     설정 완료!                            ║
╚═══════════════════════════════════════════════════════════╝

다음 단계:
"@

if ($missingEnvVars.Count -gt 0) {
    Write-Warning @"
1. 환경 변수 설정:
"@
    foreach ($var in $missingEnvVars) {
        switch ($var) {
            "FIGMA_ACCESS_TOKEN" {
                Write-Output "   - FIGMA_ACCESS_TOKEN: https://www.figma.com/developers/api#access-tokens"
            }
            "GITHUB_TOKEN" {
                Write-Output "   - GITHUB_TOKEN: https://github.com/settings/tokens (repo, read:org 권한)"
            }
        }
    }
    Write-Output ""
}

Write-Info @"
2. Claude Code 재시작

3. MCP 서버 테스트:
   claude 실행 후 /mcp 명령어로 서버 상태 확인

문제 발생 시:
   - 로그 확인: ~/.claude/logs/
   - 환경 변수 확인: echo `$env:GITHUB_TOKEN
"@
