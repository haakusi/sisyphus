# Sisyphus Plugin Team Installation Script
# Run this in PowerShell as your team member

param(
    [string]$RepoPath = "C:\source\claude-sisyphus-plugin"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sisyphus Plugin Team Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check if repo exists
if (-not (Test-Path $RepoPath)) {
    Write-Host "ERROR: Repository not found at $RepoPath" -ForegroundColor Red
    Write-Host "Please clone the repository first or provide correct path" -ForegroundColor Yellow
    exit 1
}

# Run setup
Write-Host "`nRunning setup..." -ForegroundColor Cyan
Push-Location $RepoPath

try {
    npm run setup

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  Installation Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Restart Claude Code" -ForegroundColor White
        Write-Host "2. Try: /ultrawork hello" -ForegroundColor White
        Write-Host "3. Try: /stats" -ForegroundColor White
    } else {
        Write-Host "Setup failed. Check errors above." -ForegroundColor Red
    }
} finally {
    Pop-Location
}
