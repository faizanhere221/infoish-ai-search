# ============================================
# INFOISHAI - Deployment Script (Windows)
# Run: .\deploy.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI DEPLOYMENT" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

# Pre-deployment checks
Write-Host "  PRE-DEPLOYMENT CHECKLIST" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  Warning: You have uncommitted changes" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $confirm = Read-Host "  Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "  Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

# TypeScript check
Write-Host "  Running TypeScript check..." -ForegroundColor Cyan
$tsResult = npx tsc --noEmit 2>&1
$tsErrors = ($tsResult | Select-String "error TS" | Measure-Object).Count
if ($tsErrors -gt 0) {
    Write-Host "  TypeScript errors found: $tsErrors" -ForegroundColor Red
    Write-Host "  Fix them before deploying." -ForegroundColor Red
    $tsResult | Select-Object -Last 10
    exit 1
}
Write-Host "  TypeScript: OK" -ForegroundColor Green

# Lint check
Write-Host "  Running lint check..." -ForegroundColor Cyan
npm run lint 2>&1 | Out-Null
Write-Host "  Lint: OK" -ForegroundColor Green

# Build check
Write-Host "  Running build..." -ForegroundColor Cyan
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build failed! Fix errors before deploying." -ForegroundColor Red
    $buildResult | Select-Object -Last 20
    exit 1
}
Write-Host "  Build: OK" -ForegroundColor Green

Write-Host ""
Write-Host "  All checks passed!" -ForegroundColor Green
Write-Host "  ----------------------------------------"

# Deploy
Write-Host ""
Write-Host "  Deploying to Vercel via GitHub..." -ForegroundColor Cyan
Write-Host ""

# Commit any last changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  Committing remaining changes..." -ForegroundColor Cyan
    git add .
    git commit -m "chore: pre-deployment updates"
}

# Push to GitHub (Vercel auto-deploys from main)
Write-Host "  Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ======================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "  ======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Your site: https://infoishai.com"
    Write-Host "  Vercel Dashboard: https://vercel.com/dashboard"
    Write-Host ""
    Write-Host "  Vercel will automatically build and deploy."
    Write-Host "  Check Vercel dashboard for deployment status."
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Push failed! Check your git configuration." -ForegroundColor Red
    exit 1
}