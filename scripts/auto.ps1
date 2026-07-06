# ============================================
# INFOISHAI - Master Automation Script (Windows)
# Run: .\auto.ps1 [command]
# ============================================

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Argument
)

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $ProjectPath

# Colors
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Banner {
    Write-Host ""
    Write-Color "╔═══════════════════════════════════════════╗" "Magenta"
    Write-Color "║     🚀 INFOISHAI AUTOMATION SYSTEM        ║" "Magenta"
    Write-Color "║     Your AI-Powered Development Team      ║" "Magenta"
    Write-Color "╚═══════════════════════════════════════════╝" "Magenta"
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Color "Available Commands:" "Green"
    Write-Host ""
    Write-Host "  morning     - Daily standup & task planning"
    Write-Host "  fix         - Fix all TypeScript/lint/build errors"
    Write-Host "  feature     - Complete a specific feature"
    Write-Host "  audit       - Full project audit"
    Write-Host "  evening     - End of day wrap-up & commits"
    Write-Host "  blog        - Write an SEO blog post"
    Write-Host "  seo         - SEO optimization"
    Write-Host "  weekly      - Weekly progress review"
    Write-Host "  deploy      - Deploy to production"
    Write-Host "  full        - Run complete daily cycle"
    Write-Host "  start       - Start Claude Code interactive mode"
    Write-Host "  status      - Check project status"
    Write-Host ""
    Write-Color "Usage:" "Green"
    Write-Host "  .\auto.ps1 morning"
    Write-Host "  .\auto.ps1 feature 'messaging system'"
    Write-Host "  .\auto.ps1 blog 'How to Find Tech Influencers'"
    Write-Host ""
    Write-Color "Quick Start:" "Green"
    Write-Host "  1. .\auto.ps1 audit     # First, audit your project"
    Write-Host "  2. .\auto.ps1 fix       # Fix all errors"
    Write-Host "  3. .\auto.ps1 feature   # Complete features"
    Write-Host "  4. .\auto.ps1 deploy    # Deploy when ready"
    Write-Host ""
}

switch ($Command) {
    "morning" {
        & "$ProjectPath\scripts\morning.ps1"
    }
    "fix" {
        & "$ProjectPath\scripts\fix-errors.ps1"
    }
    "feature" {
        if (-not $Argument) {
            Write-Color "Error: Please provide a feature name" "Red"
            Write-Host "Usage: .\auto.ps1 feature 'feature name'"
            Write-Host ""
            Write-Host "Available features:"
            Write-Host "  - authentication"
            Write-Host "  - creator-profile"
            Write-Host "  - creator-search"
            Write-Host "  - deal-system"
            Write-Host "  - messaging"
            Write-Host "  - dashboard"
            exit 1
        }
        & "$ProjectPath\scripts\feature.ps1" -FeatureName $Argument
    }
    "audit" {
        & "$ProjectPath\scripts\audit.ps1"
    }
    "evening" {
        & "$ProjectPath\scripts\evening.ps1"
    }
    "blog" {
        if (-not $Argument) {
            Write-Color "Error: Please provide a blog title" "Red"
            Write-Host "Usage: .\auto.ps1 blog 'Your Blog Title'"
            exit 1
        }
        & "$ProjectPath\scripts\blog.ps1" -Title $Argument
    }
    "seo" {
        & "$ProjectPath\scripts\seo.ps1"
    }
    "weekly" {
        & "$ProjectPath\scripts\weekly.ps1"
    }
    "deploy" {
        & "$ProjectPath\scripts\deploy.ps1"
    }
    "full" {
        Show-Banner
        Write-Color "Running FULL automation cycle..." "Yellow"
        Write-Host ""
        Write-Color "Step 1/4: Morning Standup" "Cyan"
        & "$ProjectPath\scripts\morning.ps1"
        Write-Host ""
        Write-Color "Step 2/4: Fixing Errors" "Cyan"
        & "$ProjectPath\scripts\fix-errors.ps1"
        Write-Host ""
        Write-Color "Step 3/4: Project Audit" "Cyan"
        & "$ProjectPath\scripts\audit.ps1"
        Write-Host ""
        Write-Color "Step 4/4: Creating Summary" "Cyan"
        Write-Host ""
        Write-Color "✅ Full cycle complete!" "Green"
        Write-Host ""
        Write-Host "📋 Check these files:"
        Write-Host "   - DAILY_TASKS.md"
        Write-Host "   - AUDIT_REPORT.md"
        Write-Host ""
    }
    "start" {
        Show-Banner
        Write-Color "Starting Claude Code in interactive mode..." "Cyan"
        Write-Host ""
        claude
    }
    "status" {
        Show-Banner
        Write-Color "Project Status Check" "Cyan"
        Write-Host ""
        Write-Host "📁 Project: $ProjectPath"
        Write-Host ""
        Write-Host "📊 Git Status:"
        git status --short
        Write-Host ""
        Write-Host "📝 Recent Commits:"
        git log --oneline -5
        Write-Host ""
        Write-Host "🔍 TypeScript Check:"
        npx tsc --noEmit 2>&1 | Select-Object -Last 5
        Write-Host ""
    }
    "help" {
        Show-Help
    }
    default {
        Show-Help
    }
}
