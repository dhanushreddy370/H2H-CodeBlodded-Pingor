# 🚀 Pingor - Master Launch Controller
# =====================================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         🚀 PINGOR V1 - KERNEL BOOTSTRAP" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Use script source directory as project root
$ROOT_DIR = $PSScriptRoot
$WEB_DIR = Join-Path $ROOT_DIR "client"
$APP_DIR = Join-Path $ROOT_DIR "server"

# 1. Path Stability Check
if (-not (Test-Path $WEB_DIR)) {
    Write-Host "❌ FATAL: Web folder missing at $WEB_DIR" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $APP_DIR)) {
    Write-Host "❌ FATAL: App folder missing at $APP_DIR" -ForegroundColor Red
    exit 1
}

# 2. Environmental Pre-flight
Write-Host "[SYSTEM] Validating Node Engine..." -ForegroundColor White
$npmCheck = Get-Command "npm" -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "❌ ERROR: npm (Node.js) is not in your PATH." -ForegroundColor Red
    exit 1
}
Write-Host "✅ [DETECTED] Local Engine Ready.`n" -ForegroundColor Green

# 3. Environmental Sync Backend
if (-not (Test-Path (Join-Path $APP_DIR "node_modules"))) {
    Write-Host "`n[BACKEND] node_modules not found. Running installation..." -ForegroundColor Yellow
    Push-Location $APP_DIR
    npm install
    Pop-Location
}
Write-Host "✅ [SYNCED] Backend Environment Stabilized.`n" -ForegroundColor Green

# 4. Launch Backend (Node)
Write-Host "[BACKEND] Launching Pingor Backend..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$APP_DIR'; `$host.UI.RawUI.WindowTitle = 'Pingor Backend'; npm start"
Write-Host "✅ [KERNEL BOOTED] Backend Started" -ForegroundColor Green

# 5. Frontend Environment Setup
if (-not (Test-Path (Join-Path $WEB_DIR "node_modules"))) {
    Write-Host "`n[FRONTEND] node_modules not found. Running installation..." -ForegroundColor Yellow
    Push-Location $WEB_DIR
    npm install
    Pop-Location
}

# 6. Launch Visual Dashboard
Write-Host "[FRONTEND] Spawning Visual Dashboard..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$WEB_DIR'; `$host.UI.RawUI.WindowTitle = 'Pingor Frontend'; npm start"
Write-Host "✅ [UI ENGINE BOOTED] http://localhost:3000" -ForegroundColor Green

# 7. Success Report
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "         🏆 PINGOR PLATFORM STABILIZED" -ForegroundColor White -BackgroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ● Visual Terminal : http://localhost:3000" -ForegroundColor White -BackgroundColor Black
Write-Host "  ● REST/WS Kernel  : Backend Server Started" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "Project Status: ACTIVE" -ForegroundColor Green
Write-Host "The Terminal is now running locally on your laptop." -ForegroundColor Cyan
Write-Host "`nPress any key to release this controller..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
