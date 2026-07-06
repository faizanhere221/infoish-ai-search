# ============================================
# INFOISHAI - Fix All Errors Script (Windows)
# Run: .\fix-errors.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI ERROR FIXER" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting Claude AI to fix all errors..." -ForegroundColor Green
Write-Host ""

$prompt = "Fix ALL errors in the Infoishai project. Step 1: Run npx tsc --noEmit and fix every TypeScript error with proper types, not any. Step 2: Run npm run lint and fix all linting errors. Step 3: Run npm run build and fix any build errors. Step 4: Check for console.error, TODO, FIXME comments. Step 5: Update AUDIT_REPORT.md marking fixed issues as DONE. Do not suppress errors, fix the root cause. Show me progress as you go."

claude --print $prompt

Write-Host ""
Write-Host "  Error fixing session complete!" -ForegroundColor Green
Write-Host "  Check AUDIT_REPORT.md for status"
Write-Host ""