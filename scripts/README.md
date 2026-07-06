# 🚀 Infoishai Windows Automation Scripts

Complete automation system for developing Infoishai with Claude AI on Windows.

## Quick Setup

### 1. Open PowerShell as Administrator

Press `Win + X` → Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

### 2. Navigate to your project
```powershell
cd "E:\AI influncer Search Tool\influencer-search"
```

### 3. Allow PowerShell scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Run setup
```powershell
.\scripts\setup.ps1
```

### 5. Restart PowerShell and use!
```powershell
info audit
```

---

## Commands

| Command | Description |
|---------|-------------|
| `info` | Show all available commands |
| `info morning` | Daily standup & task planning |
| `info fix` | Fix all TypeScript/lint/build errors |
| `info feature "name"` | Complete a specific feature |
| `info audit` | Full project audit |
| `info evening` | End of day wrap-up & commits |
| `info blog "Title"` | Write an SEO blog post |
| `info seo` | SEO optimization |
| `info weekly` | Weekly progress review |
| `info deploy` | Deploy to production |
| `info start` | Start Claude interactive mode |

---

## Daily Workflow

### Morning (15 min)
```powershell
info morning
```
- Reviews git commits
- Checks for errors
- Creates task list for the day

### Development (2-4 hours)
```powershell
info fix                        # Fix any errors first
info feature "messaging"        # Work on a feature
```

### Evening (10 min)
```powershell
info evening
```
- Commits all changes
- Updates changelog
- Plans tomorrow

---

## Automated Tasks (Optional)

The setup script can create Windows Scheduled Tasks:

| Task | Time | Description |
|------|------|-------------|
| Morning | 9:00 AM | Daily standup |
| Evening | 6:00 PM | Day wrap-up |
| Weekly | Sunday 10 AM | Weekly review |

---

## Files Created

| File | Purpose |
|------|---------|
| `AUDIT_REPORT.md` | Project issues & status |
| `DAILY_TASKS.md` | Today's task list |
| `CHANGELOG.md` | Development history |
| `reports\weekly-*.md` | Weekly reviews |
| `content\blog\*.mdx` | Blog posts |
| `SEO_REPORT.md` | SEO changes |

---

## Scripts Included

```
scripts\
├── auto.ps1        # Master script
├── morning.ps1     # Daily standup
├── fix-errors.ps1  # Error fixing
├── feature.ps1     # Feature development
├── audit.ps1       # Project audit
├── evening.ps1     # Day wrap-up
├── blog.ps1        # Blog writing
├── seo.ps1         # SEO optimization
├── weekly.ps1      # Weekly review
├── deploy.ps1      # Deployment
├── setup.ps1       # Initial setup
└── README.md       # This file
```

---

## Troubleshooting

### "Scripts disabled" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Claude Code not working
```powershell
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code
claude login
```

### Commands not found after setup
Restart PowerShell or run:
```powershell
. $PROFILE
```

---

## Requirements

- Windows 10/11
- Node.js 18+
- PowerShell 5.1+ (or PowerShell 7)
- Claude Code CLI
- Claude Pro subscription

---

Made with ❤️ for scaling Infoishai to $100K+
