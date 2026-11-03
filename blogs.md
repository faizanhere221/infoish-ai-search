# blogs.md — Blog Writing Instructions for Infoishai

When you receive a blog title and guidance, follow every step below to produce a complete, publish-ready blog post for the Infoishai website.

## What Is Infoishai?

Infoishai (infoishai.com) is a free B2B marketplace connecting tech brands with verified tech content creators (YouTube, Twitter/X, LinkedIn, GitHub, newsletters, podcasts) across 9 countries: USA, UK, Canada, India, Pakistan, Australia, Germany, Netherlands, Singapore. 100+ verified creators. Brands search, message, send deals, or post campaigns. Creators apply and manage collaborations.

Every blog post should reinforce Infoishai's authority in this niche. Link to relevant Infoishai pages where it fits naturally (marketplace, campaigns, tools, other blog posts).

---

## Step 1: Keyword and SEO Research

Before writing a single word, do keyword research for the given topic.

1. **Primary keyword**: Identify one primary keyword phrase (3-6 words) the post targets. Put it in the title, H1, meta description, first paragraph, and URL slug.
2. **Secondary keywords**: Find 5-10 related keyword phrases. Spread them through H2 headings and body copy.
3. **Long-tail keywords**: Find 5-10 question-based queries (how, what, why, best, top) people search for in this topic. Use these as H2/H3 headings or FAQ entries.
4. **Search intent**: Determine if the searcher wants information, a comparison, a how-to, or a list. Match the post structure to the intent.
5. **Competitor check**: Look at the top 3-5 ranking pages for the primary keyword. Note what they cover, what they miss, and how long they are. Your post should be longer, more specific, and more actionable.

### AEO (Answer Engine Optimization)

Structure content so AI assistants and featured snippets pick it up:

- Write a direct, concise answer (2-3 sentences) right after each H2 heading before expanding on it.
- Use "What is...", "How to...", "Why..." question formats as headings.
- Include a TL;DR or key takeaway at the top of the post.
- Add an FAQ section at the bottom with 5-8 question/answer pairs using short, direct answers.

### GEO (Generative Engine Optimization)

Make content citable by AI overviews and generative search:

- Include specific numbers, statistics, and data points (with sources or context).
- Use lists and structured formats AI engines prefer to quote.
- Write authoritative, factual statements rather than opinion-heavy copy.
- Reference Infoishai's creator count (100+), country count (9), and platform types as concrete data points.

---

## Step 2: Blog Post File Structure

### File Location

Create the blog post file at:
```
src/app/blog/{slug}/page.tsx
```

The `{slug}` should be:
- Lowercase, hyphenated
- Include the primary keyword
- Include the current year if the content is time-sensitive
- Keep it under 60 characters

Example: `how-to-find-tech-influencers-b2b-2026`

### Required Exports

Every blog post page must export these:

```typescript
export const revalidate = 86400  // ISR: 24-hour revalidation
```

```typescript
export const metadata: Metadata = {
  title: 'Your Blog Title Here | Infoishai',
  description: 'Meta description. 150-160 characters. Include primary keyword. Write as a complete sentence.',
  keywords: [
    'primary keyword',
    'secondary keyword 1',
    'secondary keyword 2',
    // 8-12 total keywords
  ],
  openGraph: {
    title: 'Your Blog Title Here',
    description: 'Same as meta description or slightly varied.',
    type: 'article',
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Blog Title Here',
    description: 'Same as meta description or slightly varied.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/blog/{slug}'
  }
}
```

### JSON-LD Structured Data

Every post needs a BlogPosting schema object:

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Your Blog Title Here',
  description: 'Same as meta description.',
  image: 'https://infoishai.com/og-image.jpg',
  datePublished: 'YYYY-MM-DD',    // Today's date
  dateModified: 'YYYY-MM-DD',     // Same as datePublished for new posts
  author: {
    '@type': 'Person',
    name: 'Infoishai Team'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Infoishai',
    logo: {
      '@type': 'ImageObject',
      url: 'https://infoishai.com/logo.png'
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://infoishai.com/blog/{slug}'
  }
}
```

---

## Step 3: Page Component Structure

The blog post is a **server component** (no `'use client'`). Follow this structure:

```typescript
import Header from '@/components/header'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Clock, CheckCircle } from 'lucide-react'
import { Metadata } from 'next'

// ... revalidate, metadata, jsonLd (see above) ...

export default function YourBlogPostPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              {/* Category badge */}
              Category Name
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Your Blog Title Here
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {/* Subtitle / hook paragraph */}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Month DD, YYYY</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>XX min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Sections go here */}
        </div>

        {/* CTA Section */}
        {/* FAQ Section */}
        {/* Related Posts */}
      </article>
    </div>
  )
}
```

### Section Styling Patterns

Use these Tailwind patterns consistently:

**Regular section:**
```tsx
<section className="mb-12">
  <h2 className="text-3xl font-bold text-gray-900 mb-6">Section Title</h2>
  <p className="text-gray-700 leading-relaxed mb-6">Paragraph text.</p>
</section>
```

**Card/box section:**
```tsx
<div className="bg-white rounded-lg p-8 shadow-sm border mb-6">
  {/* Content inside a card */}
</div>
```

**Checklist items:**
```tsx
<li className="flex items-start gap-3">
  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
  <span className="text-gray-800"><strong>Bold label:</strong> Description text</span>
</li>
```

**Numbered sub-items inside a card:**
```tsx
<div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Sub Heading</h3>
  <p className="text-gray-700 mb-3">Description.</p>
  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
    <li>Point one</li>
    <li>Point two</li>
  </ul>
</div>
```

---

## Step 4: Content Requirements

### Post Length

- Minimum 2,000 words of body content
- Target 2,500-4,000 words for pillar/guide posts
- Every section should have real, actionable detail, not fluff

### Content Structure

1. **Hook intro** (2-3 paragraphs): State the problem. Why the reader should care. What they will learn.
2. **TL;DR / Key Takeaway** (optional but recommended): 3-5 bullet points summarizing the post.
3. **Body sections** (5-10 H2 sections): Each section answers one sub-question or covers one sub-topic. Include at least one of: a list, a comparison, a template, a data point, or an example.
4. **CTA section**: Link to Infoishai's marketplace, campaign posting, or signup. Keep it natural. Example: "Browse 100+ verified tech creators on Infoishai" with a link to `/creators`.
5. **FAQ section**: 5-8 questions using `<h3>` tags. Short, direct answers (2-4 sentences each). Use questions people search for.
6. **Related posts**: Link to 2-3 existing Infoishai blog posts.

### Internal Linking

Link to these pages where relevant:
- `/creators` — Creator marketplace
- `/campaigns` — Campaign listings
- `/signup` — Sign up
- `/blog/{other-slug}` — Other blog posts
- `/influencers/{country}` — Country landing pages (usa, uk, canada, india, pakistan, australia, germany, netherlands, singapore)
- `/tools/instagram-hashtag-generator` — Hashtag generator tool

Use `<Link>` component from `next/link`, not `<a>` tags, for internal links. External links use `<a>` with `target="_blank" rel="noopener noreferrer"`.

---

## Step 5: Writing Rules

### Voice and Tone

- Write for marketing managers, startup founders, and tech content creators.
- Be direct and specific. No vague advice.
- Use "you/your" to address the reader.
- Active voice. Short sentences.
- Include specific numbers, rates, and benchmarks where relevant.
- Cite sources or give context for statistics.

### BANNED WORDS (never use these)

can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft/crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking, cutting-edge, remarkable, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving.

### Formatting Rules

- No em dashes. Use commas or periods instead.
- No emojis in the blog content.
- Use proper heading hierarchy: one H1 (the title), then H2 for sections, H3 for sub-sections.
- Bold key terms and names on first use in a section.
- Use sentence case for headings (capitalize first word and proper nouns only, unless the existing blog posts use title case, in which case match them).

---

## Step 6: Update the Blog Index

After creating the blog post file, update `src/app/blog/page.tsx`:

Add a new entry to the TOP of the `blogPosts` array:

```typescript
{
  id: '{next_number}',          // Increment from the current highest id
  title: 'Your Blog Title Here',
  excerpt: 'One or two sentences. Same as or similar to the meta description. Under 200 characters.',
  date: 'YYYY-MM-DD',           // Today's date (ISO format)
  author: 'Infoishai Team',
  category: 'Strategy',         // One of: Strategy, Guide, Industry, Tools, Pakistan, India
  readTime: 'XX min read',      // Estimate: ~200 words per minute of reading
  slug: 'your-slug-here',       // Must match the folder name exactly
  featured: true,               // Set to true for the newest posts
  views: '0',
  isNew: true
},
```

**Categories used in existing posts:**
- `Strategy` — Marketing tactics, pricing, campaigns, earnings
- `Guide` — Step-by-step how-to posts
- `Industry` — Market trends, comparisons, industry analysis
- `Tools` — Posts about Infoishai's tools (hashtag generator, profile analyzer)
- `Pakistan` — Pakistan-specific content
- `India` — India-specific content

Pick the category with the best fit. If the post is country-specific, use the country name.

---

## Step 7: Verify

After writing the blog post:

1. Run `npx tsc --noEmit` to check for TypeScript errors (or `npm run build` if no dev server is running).
2. Run `npm run lint` to check for lint issues.
3. Confirm the slug in the folder name matches the slug in the `blogPosts` array entry.
4. Confirm the canonical URL in metadata matches the actual path.
5. Confirm the JSON-LD `@id` matches the canonical URL.
6. Confirm dates are consistent across metadata, JSON-LD, and the blogPosts array entry.
7. Confirm no banned words appear in the content.

---

## Quick Reference: Blog Post Checklist

- [ ] Keyword research done (primary + secondary + long-tail + questions)
- [ ] File created at `src/app/blog/{slug}/page.tsx`
- [ ] `revalidate = 86400` exported
- [ ] `metadata` exported with title, description, keywords, openGraph, twitter, canonical
- [ ] JSON-LD BlogPosting schema included
- [ ] Server component (no `'use client'`)
- [ ] `<Header />` component imported and rendered
- [ ] Single `<h1>` tag with the blog title
- [ ] Back to Blog link at the top
- [ ] Author, date, read time in the header
- [ ] Category badge(s) in the header
- [ ] 2,000+ words of body content
- [ ] 5-10 H2 sections with real, actionable content
- [ ] Internal links to Infoishai pages (marketplace, campaigns, other blogs)
- [ ] CTA section linking to Infoishai
- [ ] FAQ section with 5-8 questions
- [ ] No banned words
- [ ] No em dashes
- [ ] Blog index updated (`src/app/blog/page.tsx`, new entry at top of array)
- [ ] TypeScript check passes
- [ ] Lint passes

---

## Example: Giving Claude Code a Blog Assignment

Here is how to prompt Claude Code:

```
Write a blog post with title: "How to Measure Tech Influencer Campaign ROI in 2026"

Guidance:
- Target audience: B2B marketing managers at SaaS companies
- Cover: tracking methods, KPIs (CPM, CPC, engagement rate, pipeline attribution), tools, benchmarks
- Include a comparison table of tracking approaches
- Link to our campaign posting feature and creator marketplace
- FAQ section about ROI measurement
```

Claude Code will then follow the instructions in this file to produce the complete blog post and update the blog index.
