# ============================================
# INFOISHAI - Weekly Review Script (Windows)
# Run: .\weekly.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$WeekNum = Get-Date -UFormat "%V"
$Year = Get-Date -Format "yyyy"
$Date = Get-Date -Format "dddd, MMMM dd, yyyy"

# Create reports directory if needed
New-Item -ItemType Directory -Force -Path "reports" | Out-Null

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI WEEKLY REVIEW" -ForegroundColor Yellow
Write-Host "  Week $WeekNum of $Year" -ForegroundColor Cyan
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting Claude AI for weekly review..." -ForegroundColor Green
Write-Host ""

$prompt = "Do the weekly review for Infoishai Week $WeekNum of $Year. Part 1 Last Week Analysis: Run git log --since=7 days ago --oneline to count commits and list major changes. Run git diff --stat to see files changed and lines added/removed. Check AUDIT_REPORT.md for items marked DONE this week. Part 2 Progress Metrics: Update progress percentage for each module (Authentication, Creator Profiles, Creator Search, Deal System, Messaging, Dashboards, Overall MVP). Check TypeScript errors remaining and ESLint warnings and build status. Part 3 Blockers: What slowed progress? Any technical debt accumulating? Part 4 Next Week Planning: List top 3 priorities, stretch goals if time permits, and content goals for blog posts. Part 5 Milestone Tracking: Days until MVP ready, critical items remaining, path to 100K showing current phase, users registered, deals completed, revenue. Create file reports/weekly-review-$Year-W$WeekNum.md with Summary, Accomplishments list, Metrics table comparing last week to this week, Challenges list, Next Week priorities, and Notes."

claude --print $prompt

Write-Host ""
Write-Host "  Weekly review complete!" -ForegroundColor Green
Write-Host "  Report saved to: reports\weekly-review-$Year-W$WeekNum.md"
Write-Host ""