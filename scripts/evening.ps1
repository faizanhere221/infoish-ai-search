# ============================================
# INFOISHAI - Evening Wrap-up Script (Windows)
# Run: .\evening.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI EVENING WRAP-UP" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

# Show what changed today
Write-Host "  CHANGES TODAY:" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
git diff --stat
Write-Host ""

# Uncommitted files
Write-Host "  UNCOMMITTED FILES:" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
git status --short
Write-Host ""

Write-Host "  Starting Claude AI for wrap-up..." -ForegroundColor Green
Write-Host ""

$prompt = "Let's wrap up today's work on Infoishai. Step 1: Run git diff and list all files modified, summarize what was accomplished. Step 2: Create proper git commits grouped by related changes using format type(scope): description where types are feat, fix, chore, docs, style, refactor. Stage and commit each group. Step 3: Update CHANGELOG.md with today's entry including Added, Fixed, Changed, and In Progress sections. Step 4: Update AUDIT_REPORT.md marking completed items as DONE and adding any new issues discovered. Step 5: Create tomorrow's top 3 priorities based on what is left in AUDIT_REPORT.md and save to DAILY_TASKS.md. Step 6: Run npm run build to ensure everything works. Step 7: Run git push origin main. Provide a summary of what was accomplished today and what is next for tomorrow."

claude --print $prompt

Write-Host ""
Write-Host "  Evening wrap-up complete!" -ForegroundColor Green
Write-Host "  Great work today! See you tomorrow."
Write-Host ""