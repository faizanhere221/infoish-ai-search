# ============================================
# INFOISHAI - SEO Optimization Script (Windows)
# Run: .\seo.ps1
# ============================================

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI SEO OPTIMIZATION" -ForegroundColor Yellow
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting Claude AI for SEO optimization..." -ForegroundColor Green
Write-Host ""

$prompt = "Optimize Infoishai for search engines with a complete SEO audit and implementation. 1) Meta Tags Audit: Check all pages have title (50-60 chars), description (150-160 chars), keywords, og:title, og:description, og:image, og:url, twitter:card, twitter:title, twitter:description, twitter:image. Check pages: homepage, login, register, creators search, creator profile, dashboard, deals, messages, about. Create or update app/layout.tsx with default metadata. 2) Create Sitemap: Create public/sitemap.xml including all static pages, dynamic creator profiles, and blog posts. Also create app/sitemap.ts for dynamic generation. 3) Create Robots.txt: Create public/robots.txt allowing public pages and creator profiles, disallowing /api/*, /dashboard/*, /settings/*. Include sitemap reference. 4) Structured Data: Add Organization schema to homepage, Person schema to creator profiles, WebSite schema with search action. 5) Technical SEO: Check all images have alt tags, ensure images use next/image, add loading=lazy, check Core Web Vitals, ensure clean URLs, add canonical URLs, add breadcrumbs. 6) Create SEO Component: Create components/SEO.tsx as reusable component for page-level SEO. Create SEO_REPORT.md listing all files created or modified."

claude --print $prompt

Write-Host ""
Write-Host "  SEO optimization complete!" -ForegroundColor Green
Write-Host "  Check SEO_REPORT.md for details"
Write-Host ""