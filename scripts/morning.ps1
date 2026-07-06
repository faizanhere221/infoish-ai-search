# ============================================
# INFOISHAI - Morning Standup Script (Windows)
# Run: .\morning.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI MORNING STANDUP" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

# Git status
Write-Host "  GIT STATUS:" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
git status --short
Write-Host ""

# Recent commits
Write-Host "  LAST 5 COMMITS:" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
git log --oneline -5 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  No commits yet"
}
Write-Host ""

# Check for TypeScript errors
Write-Host "  CHECKING FOR ERRORS..." -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
Write-Host "  TypeScript Check:"
$tsOutput = npx tsc --noEmit 2>&1
$tsOutput | Select-Object -Last 10
Write-Host ""

# Start Claude for morning tasks
Write-Host "  STARTING CLAUDE AI..." -ForegroundColor Green
Write-Host "  ----------------------------------------"
Write-Host ""

$prompt = "Good morning! Do the Infoishai daily standup. First, review the last 5 git commits. Then run npx tsc --noEmit and npm run lint to check for errors. Check if AUDIT_REPORT.md exists and read any Critical or High priority issues. Finally, create today's top 3 priority tasks with time estimates and save them to DAILY_TASKS.md file. Format the file with checkboxes for each task."

claude --print $prompt

Write-Host ""
Write-Host "  Morning standup complete!" -ForegroundColor Green
Write-Host "  Check DAILY_TASKS.md for today's plan"
Write-Host ""