# Sisyphus Plugin Installer for Windows
# Usage: iwr -useb https://gitlab.suprema.co.kr/claude-code/sisyphus/-/raw/main/install.ps1 | iex
# Or: .\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Sisyphus Plugin Installer ===" -ForegroundColor Cyan

# 1. Clone or Update
$installPath = "$env:USERPROFILE\.claude-sisyphus"

if (Test-Path $installPath) {
    Write-Host "Updating existing installation..." -ForegroundColor Yellow
    Set-Location $installPath
    git pull origin main
} else {
    Write-Host "Cloning repository..." -ForegroundColor Yellow
    git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git $installPath
    Set-Location $installPath
}

# 2. Build
Write-Host "Installing dependencies and building..." -ForegroundColor Yellow
npm install
npm run build

# 3. Copy skills to global Claude skills folder
$skillsSource = "$installPath\skills\*"
$skillsDest = "$env:USERPROFILE\.claude\skills\"

if (-not (Test-Path $skillsDest)) {
    New-Item -ItemType Directory -Path $skillsDest -Force | Out-Null
}

Write-Host "Copying skills to global folder..." -ForegroundColor Yellow
Copy-Item -Path $skillsSource -Destination $skillsDest -Recurse -Force

# 4. Optional: Copy MCP config
$mcpSource = "$installPath\.mcp.json"
$mcpDest = "$env:USERPROFILE\.claude\mcp.json"

if (-not (Test-Path $mcpDest)) {
    Copy-Item -Path $mcpSource -Destination $mcpDest
    Write-Host "MCP config copied." -ForegroundColor Green
} else {
    Write-Host "MCP config already exists. Skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  /ultrawork <task>  - Full orchestration mode"
Write-Host "  /plan <task>       - Planning mode"
Write-Host "  /quick <task>      - Fast execution"
Write-Host "  /loop <task>       - Continuous execution"
Write-Host "  /stats             - Session statistics"
Write-Host ""
Write-Host "Restart Claude Code to apply changes." -ForegroundColor Yellow
Write-Host ""
Write-Host "To update later: cd ~/.claude-sisyphus && git pull && npm run build" -ForegroundColor Gray
