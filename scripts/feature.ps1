# ============================================
# INFOISHAI - Feature Development Script (Windows)
# Run: .\feature.ps1 -FeatureName "messaging"
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI FEATURE DEVELOPMENT" -ForegroundColor Yellow
Write-Host "  Feature: $FeatureName" -ForegroundColor Cyan
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting Claude AI to complete: $FeatureName" -ForegroundColor Green
Write-Host ""

$prompt = "Complete the $FeatureName feature for Infoishai. Phase 1 Analysis: Search the codebase for existing $FeatureName related files, list what exists, identify what is missing or broken, create a checklist of tasks needed. Phase 2 Implementation: Create or update necessary files, follow existing code patterns, use TypeScript with correct types, add proper error handling, include loading states, make it mobile responsive. Phase 3 Integration: Connect to Supabase database if needed, create or update API routes, add authentication checks, test end-to-end. Phase 4 Polish: Add validation messages, handle edge cases, add success/error toasts, ensure consistent styling. Phase 5 Testing: Test happy path, test error scenarios, test mobile viewport, check browser console. Phase 6 Commit: Create descriptive commit message with format feat($FeatureName): description. Start now and show progress step by step."

claude --print $prompt

Write-Host ""
Write-Host "  Feature development session complete!" -ForegroundColor Green
Write-Host "  Don't forget to test the feature thoroughly"
Write-Host ""