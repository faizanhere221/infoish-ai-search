# ============================================
# INFOISHAI - Complete Windows Setup Script
# Run: .\setup.ps1
# ============================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  INFOISHAI AUTOMATION SETUP" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"

if (-not (Test-Path $ProjectPath)) {
    Write-Host "Project not found at default path" -ForegroundColor Yellow
    $ProjectPath = Read-Host "Enter your Infoishai project path"
}

Write-Host "Project: $ProjectPath" -ForegroundColor Green
Write-Host ""

# Create directories
Write-Host "Creating directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$ProjectPath\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectPath\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectPath\reports" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectPath\content\blog" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectPath\.github\workflows" | Out-Null
Write-Host "Directories created" -ForegroundColor Green

# Check Claude Code
Write-Host ""
Write-Host "Checking Claude Code..." -ForegroundColor Cyan
$claudeCheck = Get-Command claude -ErrorAction SilentlyContinue

if (-not $claudeCheck) {
    Write-Host "Installing Claude Code..." -ForegroundColor Yellow
    npm install -g @anthropic-ai/claude-code
    Write-Host "Claude Code installed" -ForegroundColor Green
    Write-Host "Run 'claude login' after setup!" -ForegroundColor Yellow
} else {
    Write-Host "Claude Code already installed" -ForegroundColor Green
}

# Setup PowerShell profile
Write-Host ""
Write-Host "Setting up PowerShell profile..." -ForegroundColor Cyan

$aliasBlock = @"

# INFOISHAI COMMANDS
function infoishai { Set-Location "$ProjectPath"; .\scripts\startup.ps1 }
function info { Set-Location "$ProjectPath"; .\scripts\auto.ps1 `$args }
function info-start { Set-Location "$ProjectPath"; .\scripts\startup.ps1 }

"@

$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
}

if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Force -Path $profilePath | Out-Null
}

$existingContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($existingContent -notlike "*INFOISHAI COMMANDS*") {
    Add-Content -Path $profilePath -Value $aliasBlock
    Write-Host "PowerShell profile updated" -ForegroundColor Green
} else {
    Write-Host "Profile already configured" -ForegroundColor Green
}

# Create Desktop Shortcut
Write-Host ""
Write-Host "Creating desktop shortcut..." -ForegroundColor Cyan

$desktopPath = [Environment]::GetFolderPath("Desktop")
$batchContent = @"
@echo off
title Infoishai Command Center
cd /d "$ProjectPath"
powershell -NoExit -ExecutionPolicy Bypass -File ".\scripts\startup.ps1"
"@

$batchFile = "$desktopPath\Infoishai.bat"
Set-Content -Path $batchFile -Value $batchContent
Write-Host "Desktop shortcut created: Infoishai.bat" -ForegroundColor Green

# Ask about Windows Startup
Write-Host ""
$addStartup = Read-Host "Add to Windows Startup? (y/n)"

if ($addStartup -eq "y") {
    $startupPath = [Environment]::GetFolderPath("Startup")
    $startupBatch = "$startupPath\Infoishai.bat"
    Set-Content -Path $startupBatch -Value $batchContent
    Write-Host "Added to Windows Startup!" -ForegroundColor Green
}

# Done
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart PowerShell" -ForegroundColor White
Write-Host "2. Run: claude login" -ForegroundColor White
Write-Host "3. Double-click 'Infoishai.bat' on Desktop" -ForegroundColor White
Write-Host ""
Write-Host "Or type 'infoishai' in any PowerShell!" -ForegroundColor Yellow
Write-Host ""

# Start now?
$startNow = Read-Host "Start Infoishai Command Center now? (y/n)"
if ($startNow -eq "y") {
    Set-Location $ProjectPath
    & ".\scripts\startup.ps1"
}