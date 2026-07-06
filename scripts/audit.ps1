# ============================================
# INFOISHAI - Full Project Audit Script (Windows)
# Run: .\audit.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI FULL PROJECT AUDIT" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

# Create directories if needed
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "reports" | Out-Null

# Project statistics
Write-Host "  Project Statistics:" -ForegroundColor Cyan
Write-Host "  ----------------------------------------"
$tsFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" } | Measure-Object
Write-Host "  Total TS/TSX Files: $($tsFiles.Count)"
Write-Host ""

Write-Host "  Starting Claude AI for full audit..." -ForegroundColor Green
Write-Host ""

$prompt = "Perform a COMPREHENSIVE audit of the Infoishai project. This is a B2B tech influencer marketplace built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. Check: 1) Project structure follows Next.js 14 app router conventions. 2) Run npx tsc --noEmit and list ALL TypeScript errors. 3) Run npm run lint and list all warnings. 4) Check feature completeness for Authentication, Creator Profiles, Creator Search, Deal System, Messaging, and Dashboards. Rate each as Complete, Partial, or Missing. 5) Check Supabase connection and RLS policies. 6) List all API routes and check if they have authentication and error handling. 7) Check mobile responsiveness, loading states, and error states. 8) Security audit for exposed secrets, password hashing, SQL injection prevention. Create AUDIT_REPORT.md with Executive Summary showing total issues by severity (Critical, High, Medium, Low), then list all issues with file locations, then show Feature Status table, then Recommended Fix Order, and Estimated Time to MVP."

claude --print $prompt

Write-Host ""
Write-Host "  Audit complete!" -ForegroundColor Green
Write-Host "  Check AUDIT_REPORT.md for full results"
Write-Host ""