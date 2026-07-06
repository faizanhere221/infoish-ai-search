# ============================================
# INFOISHAI - Smart Startup Script (Windows)
# This runs when you open your computer
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Magenta
    Write-Host "  |                                                              |" -ForegroundColor Magenta
    Write-Host "  |   INFOISHAI COMMAND CENTER                                   |" -ForegroundColor Magenta
    Write-Host "  |   Your AI-Powered Development Dashboard                      |" -ForegroundColor Magenta
    Write-Host "  |                                                              |" -ForegroundColor Magenta
    Write-Host "  ================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Get-TimeOfDay {
    $hour = (Get-Date).Hour
    if ($hour -lt 12) { return "morning" }
    elseif ($hour -lt 17) { return "afternoon" }
    else { return "evening" }
}

function Show-QuickStatus {
    Write-Host "  QUICK STATUS CHECK" -ForegroundColor Cyan
    Write-Host "  -----------------------------------------------------------------" -ForegroundColor Gray
    
    # Git status
    $gitStatus = git status --porcelain 2>$null
    $uncommitted = 0
    if ($gitStatus) {
        $uncommitted = ($gitStatus | Measure-Object -Line).Lines
    }
    
    # Last commit
    $lastCommit = git log -1 --format="%ar - %s" 2>$null
    if (-not $lastCommit) { $lastCommit = "No commits yet" }
    
    # Check for TypeScript errors (quick check)
    $tsOutput = npx tsc --noEmit 2>&1
    $tsErrors = ($tsOutput | Select-String "error TS" | Measure-Object).Count
    
    # Check if AUDIT_REPORT exists
    $auditExists = Test-Path "$ProjectPath\AUDIT_REPORT.md"
    
    # Check if DAILY_TASKS exists
    $tasksExist = Test-Path "$ProjectPath\DAILY_TASKS.md"
    
    Write-Host ""
    Write-Host "  Project: " -NoNewline -ForegroundColor Gray
    Write-Host "Infoishai" -ForegroundColor White
    
    Write-Host "  Last Commit: " -NoNewline -ForegroundColor Gray
    Write-Host "$lastCommit" -ForegroundColor White
    
    Write-Host "  Uncommitted Changes: " -NoNewline -ForegroundColor Gray
    if ($uncommitted -gt 0) {
        Write-Host "$uncommitted files" -ForegroundColor Yellow
    } else {
        Write-Host "None" -ForegroundColor Green
    }
    
    Write-Host "  TypeScript Errors: " -NoNewline -ForegroundColor Gray
    if ($tsErrors -gt 0) {
        Write-Host "$tsErrors errors" -ForegroundColor Red
    } else {
        Write-Host "None" -ForegroundColor Green
    }
    
    Write-Host "  Audit Report: " -NoNewline -ForegroundColor Gray
    if ($auditExists) {
        Write-Host "Available" -ForegroundColor Green
    } else {
        Write-Host "Not created yet" -ForegroundColor Yellow
    }
    
    Write-Host "  Daily Tasks: " -NoNewline -ForegroundColor Gray
    if ($tasksExist) {
        Write-Host "Available" -ForegroundColor Green
    } else {
        Write-Host "Not created yet" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Show-Menu {
    $timeOfDay = Get-TimeOfDay
    
    Write-Host "  -----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "  WHAT WOULD YOU LIKE TO DO?" -ForegroundColor Cyan
    Write-Host "  -----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    if ($timeOfDay -eq "morning") {
        Write-Host "  [1] Morning Standup - Start your day with task planning" -ForegroundColor Yellow
    } else {
        Write-Host "  [1] Morning Standup" -ForegroundColor Gray
    }
    
    Write-Host "  [2] Fix All Errors - TypeScript, lint, build" -ForegroundColor Yellow
    Write-Host "  [3] Full Project Audit - Find all bugs" -ForegroundColor Yellow
    Write-Host "  [4] Complete a Feature - Auth, messaging, deals" -ForegroundColor Yellow
    Write-Host "  [5] Write Blog Post - SEO content" -ForegroundColor Yellow
    Write-Host "  [6] SEO Optimization - Meta tags, sitemap" -ForegroundColor Yellow
    
    if ($timeOfDay -eq "evening") {
        Write-Host "  [7] Evening Wrap-up - Commit and plan tomorrow" -ForegroundColor Yellow
    } else {
        Write-Host "  [7] Evening Wrap-up" -ForegroundColor Gray
    }
    
    Write-Host "  [8] Weekly Review - Progress report" -ForegroundColor Yellow
    Write-Host "  [9] Deploy to Production - Build and push" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [A] AUTO MODE - Claude decides what to do" -ForegroundColor Cyan
    Write-Host "  [C] Claude Interactive - Free chat with Claude" -ForegroundColor Green
    Write-Host ""
    Write-Host "  [Q] Exit" -ForegroundColor Gray
    Write-Host ""
}

function Start-AutoMode {
    Write-Host ""
    Write-Host "  AUTO MODE - Claude will analyze and decide what to do..." -ForegroundColor Cyan
    Write-Host ""
    
    $prompt = @"
Analyze the current state of the Infoishai project and decide what needs to be done RIGHT NOW.

Check:
1. Run 'git status' - any uncommitted changes?
2. Run 'npx tsc --noEmit' - any TypeScript errors?
3. Check if AUDIT_REPORT.md exists - read it for pending issues
4. Check if DAILY_TASKS.md exists - read today's tasks
5. What time is it? (morning = standup, evening = wrap-up)

Based on your analysis, automatically:
1. Tell me the current state (2-3 sentences)
2. List the TOP 3 things that need to be done right now
3. Ask me: "Should I start with #1? (yes/no)"

If I say yes, do it. Then ask about #2, and so on.

Be proactive - if there are errors, fix them. If features are incomplete, complete them.
Start the analysis now.
"@
    
    claude --print $prompt
}

function Start-Feature {
    Write-Host ""
    Write-Host "  FEATURE DEVELOPMENT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Available features to complete:" -ForegroundColor Gray
    Write-Host "    [1] authentication" -ForegroundColor White
    Write-Host "    [2] creator-profile" -ForegroundColor White
    Write-Host "    [3] creator-search" -ForegroundColor White
    Write-Host "    [4] deal-system" -ForegroundColor White
    Write-Host "    [5] messaging" -ForegroundColor White
    Write-Host "    [6] dashboard" -ForegroundColor White
    Write-Host "    [7] notifications" -ForegroundColor White
    Write-Host "    [8] reviews" -ForegroundColor White
    Write-Host "    [0] Custom (type your own)" -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "  Select feature (1-8 or 0 for custom)"
    
    $features = @{
        "1" = "authentication"
        "2" = "creator-profile"
        "3" = "creator-search"
        "4" = "deal-system"
        "5" = "messaging"
        "6" = "dashboard"
        "7" = "notifications"
        "8" = "reviews"
    }
    
    if ($choice -eq "0") {
        $featureName = Read-Host "  Enter feature name"
    } else {
        $featureName = $features[$choice]
    }
    
    if ($featureName) {
        Write-Host ""
        Write-Host "  Starting work on: $featureName" -ForegroundColor Green
        & "$ProjectPath\scripts\feature.ps1" -FeatureName $featureName
    }
}

function Start-BlogPost {
    Write-Host ""
    Write-Host "  BLOG POST WRITER" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Suggested topics:" -ForegroundColor Gray
    Write-Host "    - How to Find Tech Influencers for Your SaaS" -ForegroundColor White
    Write-Host "    - Why B2B Brands Need Tech Content Creators" -ForegroundColor White
    Write-Host "    - The Rise of Developer Advocates as Influencers" -ForegroundColor White
    Write-Host "    - Top 10 Platforms for Tech Creators in 2024" -ForegroundColor White
    Write-Host ""
    
    $title = Read-Host "  Enter blog post title"
    
    if ($title) {
        Write-Host ""
        Write-Host "  Writing blog post: $title" -ForegroundColor Green
        & "$ProjectPath\scripts\blog.ps1" -Title $title
    }
}

# Main loop
function Start-CommandCenter {
    while ($true) {
        Write-Banner
        Show-QuickStatus
        Show-Menu
        
        $choice = Read-Host "  Enter your choice"
        
        switch ($choice.ToUpper()) {
            "1" { 
                & "$ProjectPath\scripts\morning.ps1"
                Read-Host "Press Enter to continue"
            }
            "2" { 
                & "$ProjectPath\scripts\fix-errors.ps1"
                Read-Host "Press Enter to continue"
            }
            "3" { 
                & "$ProjectPath\scripts\audit.ps1"
                Read-Host "Press Enter to continue"
            }
            "4" { 
                Start-Feature
                Read-Host "Press Enter to continue"
            }
            "5" { 
                Start-BlogPost
                Read-Host "Press Enter to continue"
            }
            "6" { 
                & "$ProjectPath\scripts\seo.ps1"
                Read-Host "Press Enter to continue"
            }
            "7" { 
                & "$ProjectPath\scripts\evening.ps1"
                Read-Host "Press Enter to continue"
            }
            "8" { 
                & "$ProjectPath\scripts\weekly.ps1"
                Read-Host "Press Enter to continue"
            }
            "9" { 
                & "$ProjectPath\scripts\deploy.ps1"
                Read-Host "Press Enter to continue"
            }
            "A" { 
                Start-AutoMode
                Read-Host "Press Enter to continue"
            }
            "C" { 
                Write-Host ""
                Write-Host "  Starting Claude Interactive Mode..." -ForegroundColor Green
                Write-Host "  Type 'exit' to return to Command Center" -ForegroundColor Gray
                Write-Host ""
                claude
                Read-Host "Press Enter to continue"
            }
            "Q" { 
                Write-Host ""
                Write-Host "  Goodbye! Keep building Infoishai!" -ForegroundColor Cyan
                Write-Host ""
                exit 
            }
            default {
                Write-Host ""
                Write-Host "  Invalid choice. Please try again." -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    }
}

# Start the command center
Start-CommandCenter