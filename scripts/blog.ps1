# ============================================
# INFOISHAI - Blog Post Writer Script (Windows)
# Run: .\blog.ps1 -Title "Your Blog Title"
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Title
)

$ProjectPath = "E:\AI influncer Search Tool\influencer-search"
Set-Location $ProjectPath

$Date = Get-Date -Format "dddd, MMMM dd, yyyy - hh:mm tt"
$DateSlug = Get-Date -Format "yyyy-MM-dd"

# Generate slug from title
$Slug = $Title.ToLower() -replace '[^a-z0-9\s]', '' -replace '\s+', '-'
$Filename = "content\blog\$DateSlug-$Slug.mdx"

# Create blog directory if needed
New-Item -ItemType Directory -Force -Path "content\blog" | Out-Null

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "  INFOISHAI BLOG WRITER" -ForegroundColor Yellow
Write-Host "  Title: $Title" -ForegroundColor Cyan
Write-Host "  $Date" -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting Claude AI to write blog post..." -ForegroundColor Green
Write-Host ""

$prompt = "Write an SEO-optimized blog post for Infoishai.com with title: $Title. Target length 1500-2000 words. Target audience is marketing managers at B2B tech companies and tech content creators. Include primary keyword in title, first paragraph, at least 2 H2 subheadings, and meta description. Structure with compelling hook in first 2 sentences, 4-6 clear H2 subheadings, short paragraphs of 2-3 sentences, bullet points where appropriate, statistics with sources, and call to action at end. Save to file: $Filename. Use MDX format with frontmatter including title, description (155 chars max), date ($DateSlug), author (Faizan Islam), authorRole (Founder and CEO Infoishai), and tags. End with a CTA section titled Ready to Find Your Perfect Tech Creator linking to infoishai.com/creators."

claude --print $prompt

Write-Host ""
Write-Host "  Blog post written!" -ForegroundColor Green
Write-Host "  File: $Filename"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "  1. Review and edit the post"
Write-Host "  2. Add a featured image"
Write-Host "  3. Commit and deploy"
Write-Host ""