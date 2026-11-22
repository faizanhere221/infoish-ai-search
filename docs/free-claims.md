# "Free" and "no fees" claims

Every place outside `/privacy` and `/terms` that says Infoishai is free, has no fees, or pays the creator the full amount. Listed on 2026-11-23, after the Terms added fees on managed deals (10% from the brand, 10% of the creator fee). **Not edited yet.**

Self-serve use is still free, so most of these stay true for the self-serve platform. Reword first where a creator or brand reads them while a deal is involved: the deal form, the deal page, the founder emails, and "no platform fees on your earnings" in creator posts.

Regenerate with:

```bash
grep -rniE "no (platform )?fees?|100% free|free forever|always free|no hidden fees|free for brands|free for creators|free to (use|join)|full (agreed )?(deal )?amount|is free|free marketplace|free plan|for free|at no (cost|charge)" src public/llms.txt docs/REFERRAL_SYSTEM.md --include=*.tsx --include=*.ts --include=*.txt --include=*.md | grep -v "src/app/privacy/|src/app/terms/"
```

## Site-wide metadata and llms.txt (13)

| Where | Text |
| --- | --- |
| [src/app/(auth)/signup/brand/layout.tsx:5](../src/app/%28auth%29/signup/brand/layout.tsx#L5) | description: 'Sign up as a brand on Infoishai to find and hire verified tech influencers across YouTube, Twitter, and LinkedIn. Free for brands and creators, with no platform fe... |
| [src/app/(auth)/signup/brand/layout.tsx:12](../src/app/%28auth%29/signup/brand/layout.tsx#L12) | description: 'Find and hire verified tech influencers for your brand. No platform fees.', |
| [src/app/(auth)/signup/brand/layout.tsx:20](../src/app/%28auth%29/signup/brand/layout.tsx#L20) | description: 'Find and hire verified tech influencers for your brand. No platform fees.', |
| [src/app/(auth)/signup/creator/layout.tsx:5](../src/app/%28auth%29/signup/creator/layout.tsx#L5) | description: 'Sign up as a tech creator on Infoishai. Get discovered by AI, SaaS, and developer-tool brands and showcase your portfolio. Payments are made directly between brand... |
| [src/app/(auth)/signup/layout.tsx:5](../src/app/%28auth%29/signup/layout.tsx#L5) | description: 'Join Infoishai as a brand or a tech creator. Free for brands and creators, with no platform fees.', |
| [src/app/layout.tsx:34](../src/app/layout.tsx#L34) | description: 'The marketplace where AI, SaaS, and tech brands find verified content creators for authentic sponsorships. Free for brands and creators.', |
| [src/app/layout.tsx:71](../src/app/layout.tsx#L71) | description: 'Connect with verified tech creators for authentic sponsorships. Free for brands and creators.', |
| [src/app/page.tsx:28](../src/app/page.tsx#L28) | description: 'Search verified tech influencers by niche, platform, and budget. AI, SaaS, developer creators on YouTube, Twitter, LinkedIn. Free to join. No platform fees.', |
| [src/app/page.tsx:66](../src/app/page.tsx#L66) | description: 'Search verified tech influencers by niche, platform, and budget. AI, SaaS, developer creators on YouTube, Twitter, LinkedIn. Free to join. No platform fees.', |
| [src/app/page.tsx:108](../src/app/page.tsx#L108) | description: 'Infoishai is free for brands and creators. There are no platform fees.', |
| [src/app/page.tsx:132](../src/app/page.tsx#L132) | text: 'Infoishai is free for brands and creators. There are no platform fees.', |
| [public/llms.txt:26](../public/llms.txt#L26) | Free search and messaging. Infoishai is free for brands and creators. There are no platform fees. Filter creators by niche, platform, country, and engagement rate. |
| [public/llms.txt:29](../public/llms.txt#L29) | Free profile creation. Get discovered by brands. Set your own rates. Infoishai is free for brands and creators. There are no platform fees. |

## Homepage sections (5)

| Where | Text |
| --- | --- |
| [src/components/landing/index.tsx:316](../src/components/landing/index.tsx#L316) | description: 'Browse and message creators at no cost. There are no platform fees.', |
| [src/components/landing/index.tsx:345](../src/components/landing/index.tsx#L345) | Search and message creators for free. Infoishai is free for brands and creators. There are no platform fees. Run campaigns across 9 countries from a single dashboard. |
| [src/components/landing/index.tsx:419](../src/components/landing/index.tsx#L419) | timelines through the platform. No exclusivity requirements. Infoishai is free for brands and creators. There are no platform fees. |
| [src/components/landing/index.tsx:918](../src/components/landing/index.tsx#L918) | answer: 'Infoishai is free for brands and creators. There are no platform fees.', |
| [src/components/landing/index.tsx:1023](../src/components/landing/index.tsx#L1023) | Free for brands and creators. No credit card required. |

## About, Help, Pricing (5)

| Where | Text |
| --- | --- |
| [src/app/about/page.tsx:228](../src/app/about/page.tsx#L228) | 'Free to join for both brands and creators', |
| [src/app/about/page.tsx:445](../src/app/about/page.tsx#L445) | Free for brands and creators. No credit card required. |
| [src/app/help/page.tsx:27](../src/app/help/page.tsx#L27) | q: 'Is Infoishai free to use?', |
| [src/app/help/page.tsx:28](../src/app/help/page.tsx#L28) | a: 'Yes. Infoishai is free for brands and creators. There are no platform fees. Brands browse and contact creators at no charge, and creators list their services for free.', |
| [src/app/pricing/page.tsx:228](../src/app/pricing/page.tsx#L228) | The self-serve platform is free. |

## In the app (deals, dashboard, partner) (7)

| Where | Text |
| --- | --- |
| [src/app/dashboard/deals/[id]/page.tsx:522](../src/app/dashboard/deals/[id]/page.tsx#L522) | {/* No platform fee: the creator receives the full deal amount. |
| [src/app/dashboard/deals/[id]/page.tsx:532](../src/app/dashboard/deals/[id]/page.tsx#L532) | Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/dashboard/partner/page.tsx:245](../src/app/dashboard/partner/page.tsx#L245) | <p className="text-sm text-amber-800">The partner program is paused while Infoishai is free. Your referrals are still tracked.</p> |
| [src/components/dashboard/DealCard.tsx:34](../src/components/dashboard/DealCard.tsx#L34) | // No platform fee, so both sides see the full deal amount. Older deals |
| [src/components/deals/CreateDealForm.tsx:324](../src/components/deals/CreateDealForm.tsx#L324) | Infoishai is free for brands and creators. There are no platform fees. |
| [src/components/partner/CommissionTable.tsx:64](../src/components/partner/CommissionTable.tsx#L64) | : 'No commissions. The partner program is paused while Infoishai is free. Your referrals are still tracked.'} |
| [src/components/partner/ReferralTable.tsx:60](../src/components/partner/ReferralTable.tsx#L60) | : 'No referrals yet. The partner program is paused while Infoishai is free. Your referrals are still tracked.'} |

## Emails (4)

| Where | Text |
| --- | --- |
| [src/lib/founder-emails/brand.ts:82](../src/lib/founder-emails/brand.ts#L82) | `<strong>1. Do it yourself, free.</strong> Browse creators at <a href="${creatorsUrl}" style="${linkStyle}">infoishai.com/creators</a>, message the ones you like, or <a href="${... |
| [src/lib/founder-emails/brand.ts:96](../src/lib/founder-emails/brand.ts#L96) | `1. Do it yourself, free. Browse creators at ${creatorsUrl}, message the ones you like, or post a campaign (${campaignUrl}) and let creators apply. Infoishai is free for brands ... |
| [src/lib/founder-emails/creator.ts:158](../src/lib/founder-emails/creator.ts#L158) | paragraph('Infoishai is free for creators, with no platform fees.') + |
| [src/lib/founder-emails/creator.ts:171](../src/lib/founder-emails/creator.ts#L171) | 'Infoishai is free for creators, with no platform fees.\n\n' + |

## Country pages (30)

| Where | Text |
| --- | --- |
| [src/app/influencers/australia/page.tsx:28](../src/app/influencers/australia/page.tsx#L28) | 'Browse verified Australian tech influencers. Filter by niche, platform, budget. Rates in AUD. Free messaging. No platform fees.', |
| [src/app/influencers/australia/page.tsx:44](../src/app/influencers/australia/page.tsx#L44) | 'Browse verified Australian tech influencers. Filter by niche, platform, budget. Rates in AUD. Free messaging. No platform fees.', |
| [src/app/influencers/australia/page.tsx:54](../src/app/influencers/australia/page.tsx#L54) | 'Browse verified Australian tech influencers. Filter by niche, platform, budget. Rates in AUD. Free messaging. No platform fees.', |
| [src/app/influencers/australia/page.tsx:601](../src/app/influencers/australia/page.tsx#L601) | creators. Search by niche, platform, and audience size. Free for brands and creators. |
| [src/app/influencers/canada/page.tsx:27](../src/app/influencers/canada/page.tsx#L27) | 'Browse verified Canadian tech influencers. Filter by niche, platform, budget. Compare rates in CAD. Free messaging. No platform fees.', |
| [src/app/influencers/canada/page.tsx:42](../src/app/influencers/canada/page.tsx#L42) | 'Browse verified Canadian tech influencers. Filter by niche, platform, budget. Compare rates in CAD. Free messaging. No platform fees.', |
| [src/app/influencers/canada/page.tsx:52](../src/app/influencers/canada/page.tsx#L52) | 'Browse verified Canadian tech influencers. Filter by niche, platform, budget. Compare rates in CAD. Free messaging. No platform fees.', |
| [src/app/influencers/canada/page.tsx:554](../src/app/influencers/canada/page.tsx#L554) | tech creators. Search by niche, platform, and audience size. Free for brands and creators. |
| [src/app/influencers/germany/page.tsx:671](../src/app/influencers/germany/page.tsx#L671) | size. Free for brands and creators. |
| [src/app/influencers/india/page.tsx:27](../src/app/influencers/india/page.tsx#L27) | 'Browse verified Indian tech influencers. Filter by niche, platform, budget. Compare rates in INR. Free messaging. No platform fees.', |
| [src/app/influencers/india/page.tsx:43](../src/app/influencers/india/page.tsx#L43) | 'Browse verified Indian tech influencers. Filter by niche, platform, budget. Compare rates in INR. Free messaging. No platform fees.', |
| [src/app/influencers/india/page.tsx:53](../src/app/influencers/india/page.tsx#L53) | 'Browse verified Indian tech influencers. Filter by niche, platform, budget. Compare rates in INR. Free messaging. No platform fees.', |
| [src/app/influencers/india/page.tsx:633](../src/app/influencers/india/page.tsx#L633) | Search by niche, platform, language, and audience size. Free for brands and creators. |
| [src/app/influencers/netherlands/page.tsx:660](../src/app/influencers/netherlands/page.tsx#L660) | size. Free for brands and creators. |
| [src/app/influencers/pakistan/page.tsx:29](../src/app/influencers/pakistan/page.tsx#L29) | 'Browse verified Pakistani tech influencers. Filter by niche, platform, budget. Rates in PKR. Free messaging. No platform fees.', |
| [src/app/influencers/pakistan/page.tsx:46](../src/app/influencers/pakistan/page.tsx#L46) | 'Browse verified Pakistani tech influencers. Filter by niche, platform, budget. Rates in PKR. Free messaging. No platform fees.', |
| [src/app/influencers/pakistan/page.tsx:56](../src/app/influencers/pakistan/page.tsx#L56) | 'Browse verified Pakistani tech influencers. Filter by niche, platform, budget. Rates in PKR. Free messaging. No platform fees.', |
| [src/app/influencers/pakistan/page.tsx:628](../src/app/influencers/pakistan/page.tsx#L628) | This freelancer economy creates a unique opportunity for brands. Pakistani freelancers |
| [src/app/influencers/pakistan/page.tsx:705](../src/app/influencers/pakistan/page.tsx#L705) | niche, platform, language, and audience size. Free for brands and creators. |
| [src/app/influencers/singapore/page.tsx:665](../src/app/influencers/singapore/page.tsx#L665) | size. Free for brands and creators. |
| [src/app/influencers/uk/page.tsx:27](../src/app/influencers/uk/page.tsx#L27) | 'Browse verified UK tech influencers. Filter by niche, platform, budget. Compare rates in GBP. Message creators free. No platform fees.', |
| [src/app/influencers/uk/page.tsx:42](../src/app/influencers/uk/page.tsx#L42) | 'Browse verified UK tech influencers. Filter by niche, platform, budget. Compare rates in GBP. Message creators free. No platform fees.', |
| [src/app/influencers/uk/page.tsx:52](../src/app/influencers/uk/page.tsx#L52) | 'Browse verified UK tech influencers. Filter by niche, platform, budget. Compare rates in GBP. Message creators free. No platform fees.', |
| [src/app/influencers/uk/page.tsx:553](../src/app/influencers/uk/page.tsx#L553) | creators. Search by niche, platform, and audience size. Free for brands and creators. |
| [src/app/influencers/usa/page.tsx:27](../src/app/influencers/usa/page.tsx#L27) | 'Browse verified tech influencers in the USA. Filter by niche, platform, budget. Compare rates. Message creators free. No platform fees.', |
| [src/app/influencers/usa/page.tsx:42](../src/app/influencers/usa/page.tsx#L42) | 'Browse verified tech influencers in the USA. Filter by niche, platform, budget. Compare rates. Message creators free. No platform fees.', |
| [src/app/influencers/usa/page.tsx:52](../src/app/influencers/usa/page.tsx#L52) | 'Browse verified tech influencers in the USA. Filter by niche, platform, budget. Compare rates. Message creators free. No platform fees.', |
| [src/app/influencers/usa/page.tsx:314](../src/app/influencers/usa/page.tsx#L314) | American tech influencers reach the world&apos;s largest SaaS market ($195 billion) across YouTube, LinkedIn, Twitter, and TikTok. A mid-tier US tech creator charges $500-$3,000... |
| [src/app/influencers/usa/page.tsx:546](../src/app/influencers/usa/page.tsx#L546) | by niche, platform, and audience size. Free for brands and creators. |
| [src/components/influencers/UsaFaq.tsx:25](../src/components/influencers/UsaFaq.tsx#L25) | 'Searching and messaging creators on Infoishai is free. You pay creators directly based on agreed rates. Infoishai is free for brands and creators. There are no platform fees. I... |

## Free tools (tool pricing, not deal fees) (24)

| Where | Text |
| --- | --- |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:13](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L13) | description: 'Generate trending Instagram hashtags for Reels, Posts & Stories. AI-powered, 100% free forever. No signup required: boost your reach instantly.', |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:33](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L33) | description: 'AI-powered hashtag generator for Instagram Reels, Posts & Stories. 100% free, no signup. Boost your reach instantly.', |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:43](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L43) | description: 'AI-powered hashtags for Reels, Posts & Stories. 100% free forever.', |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:55](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L55) | headline: 'Free Instagram Hashtag Generator 2026 (100% Free Forever)', |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:56](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L56) | description: 'Generate AI-powered Instagram hashtags for Posts, Reels & Stories. Free forever, no signup required.', |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:95](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L95) | text: 'Yes, 100% free forever. No signup required. No limitations. No hidden charges.' |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:161](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L161) | Stop guessing which hashtags work. Our AI suggests a hashtag mix for your Reels, Posts, and Stories. 100% free, forever, no signup required. |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:209](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L209) | This is why we have developed a <strong>100% free Instagram Hashtag Generator for 2026</strong>. It aids in generating pertinent, AI-driven hashtags for <strong>Instagram Posts,... |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:228](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L228) | <p className="text-green-800 font-medium text-sm">Free Forever</p> |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:594](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L594) | <strong>Yes. 100% free forever.</strong> No registration. No limitations. No hidden charges. |
| [src/app/blog/free-instagram-hashtag-generator-2025/page.tsx:629](../src/app/blog/free-instagram-hashtag-generator-2025/page.tsx#L629) | No registration • Instant results • Free forever |
| [src/app/blog/micro-influencers-pakistan-guide/page.tsx:480](../src/app/blog/micro-influencers-pakistan-guide/page.tsx#L480) | Search location-based hashtags like <strong>#LahoreFoodie</strong>, <strong>#PakistaniBeautyBlogger</strong>, <strong>#KarachiFashion</strong>, or <strong>#IslamabadEats</strong... |
| [src/app/blog/micro-influencers-pakistan-guide/page.tsx:638](../src/app/blog/micro-influencers-pakistan-guide/page.tsx#L638) | <p className="text-blue-200 text-sm mt-4">No credit card required • Free forever plan available</p> |
| [src/app/blog/page.tsx:627](../src/app/blog/page.tsx#L627) | excerpt: "Generate AI-powered Instagram hashtags for Posts, Reels & Stories. Free forever, no signup required. Updated for Instagram's 2026 limit of 5 hashtags per post.", |
| [src/app/blog/page.tsx:640](../src/app/blog/page.tsx#L640) | excerpt: 'Analyze any Instagram profile for free. Check engagement rates, detect fake followers, and verify influencers before you pay. Complete guide for Pakistani brands.', |
| [src/app/blog/page.tsx:746](../src/app/blog/page.tsx#L746) | <p className="text-purple-100 text-sm">Updated for the 5-hashtag limit. 100% free, no signup.</p> |
| [src/app/blog/page.tsx:978](../src/app/blog/page.tsx#L978) | <p className="text-pink-100 text-sm mb-4">Browse tech creators by platform and country, then message them for free.</p> |
| [src/app/tools/instagram-profile-analyzer/layout.tsx:5](../src/app/tools/instagram-profile-analyzer/layout.tsx#L5) | description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, best posts, and follower tier classification in seconds.', |
| [src/app/tools/instagram-profile-analyzer/layout.tsx:13](../src/app/tools/instagram-profile-analyzer/layout.tsx#L13) | description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.', |
| [src/app/tools/instagram-profile-analyzer/layout.tsx:22](../src/app/tools/instagram-profile-analyzer/layout.tsx#L22) | description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.', |
| [src/app/tools/page.tsx:18](../src/app/tools/page.tsx#L18) | stats: ['AI-Powered', 'Free Forever', '5 per Post'], |
| [src/app/tools/page.tsx:59](../src/app/tools/page.tsx#L59) | <div className="text-xs text-gray-600">Free to Use</div> |
| [src/app/tools/page.tsx:179](../src/app/tools/page.tsx#L179) | <h3 className="text-lg font-bold text-gray-900 mb-2">Always Free</h3> |
| [src/app/tools/page.tsx:181](../src/app/tools/page.tsx#L181) | No credit card. No hidden fees. No sign-up needed. |

## Blog posts (122)

| Where | Text |
| --- | --- |
| [src/app/blog/b2b-influencer-marketing-roi/page.tsx:587](../src/app/blog/b2b-influencer-marketing-roi/page.tsx#L587) | cost side of the ROI sheet is ready when you need it. Infoishai is free for brands and creators. |
| [src/app/blog/b2b-influencer-marketing-roi/page.tsx:588](../src/app/blog/b2b-influencer-marketing-roi/page.tsx#L588) | There are no platform fees. Payments are made directly between brand and creator, and Infoishai keeps |
| [src/app/blog/b2b-influencer-marketing-roi/page.tsx:623](../src/app/blog/b2b-influencer-marketing-roi/page.tsx#L623) | No platform fees for brands or creators. |
| [src/app/blog/b2b-saas-influencers-india/page.tsx:554](../src/app/blog/b2b-saas-influencers-india/page.tsx#L554) | Infoishai is free for brands and creators, with no platform fees. You pay creators directly, and Infoishai keeps the record. Want a team to run the work? Our{' '} |
| [src/app/blog/b2b-saas-influencers-india/page.tsx:579](../src/app/blog/b2b-saas-influencers-india/page.tsx#L579) | Know the segment you need? See verified tech creators in India and message them directly. Infoishai is free for brands and creators. |
| [src/app/blog/b2b-vs-b2c-influencer-marketing-tech-2026/page.tsx:473](../src/app/blog/b2b-vs-b2c-influencer-marketing-tech-2026/page.tsx#L473) | <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" /><span>Is free or under $20/month</span></li> |
| [src/app/blog/b2b-vs-b2c-influencer-marketing-tech-2026/page.tsx:546](../src/app/blog/b2b-vs-b2c-influencer-marketing-tech-2026/page.tsx#L546) | Whether you&apos;re running a B2B or B2C campaign, Infoishai connects you with verified tech creators, filterable by niche, platform, and budget. There are no platform fees. |
| [src/app/blog/b2c-influencer-marketing-strategies-tech-brands-2026/page.tsx:600](../src/app/blog/b2c-influencer-marketing-strategies-tech-brands-2026/page.tsx#L600) | Infoishai connects you with verified tech creators, filterable by niche, platform, and budget. There are no platform fees. |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:122](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L122) | price: 'Free for brands and creators, no platform fees. Managed service by custom quote.', |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:129](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L129) | price: 'Free plan with monthly credits. Paid plans in euros, Enterprise from €499 per month.', |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:390](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L390) | what={<>A free marketplace for tech creators only. Brands browse creators, filter by niche, platform and country, message them directly, send deal proposals or post campaigns cr... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:394](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L394) | <>Free for brands and creators, with no platform fees and no contract.</>, |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:412](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L412) | <>A free plan lets you test search before you pay.</>, |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:419](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L419) | pricing={<>A free plan with 15 credits per month. Paid Core and Pro plans are listed in euros with monthly, quarterly and yearly billing. Enterprise starts from €499 per month (... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:527](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L527) | <p className="text-gray-700">Start free. Browse a tech-only marketplace, test Favikon&apos;s free plan for LinkedIn research, and keep tracking in your own analytics. Our{' '}<L... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:577](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L577) | Yes. Infoishai is a free marketplace for tech creators only, with no platform fees for brands or creators. Favikon also offers a free plan with a small monthly credit allowance ... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:600](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L600) | <p className="text-gray-700 leading-relaxed">No. A first pilot with three to five creators runs fine on a free marketplace, a spreadsheet and tracked links. Add a paid tool once... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:608](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L608) | <p className="text-gray-700 leading-relaxed">No. Infoishai is free for brands and creators, with no platform fees. Payments go directly between brand and creator, and Infoishai ... |
| [src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx:633](../src/app/blog/best-influencer-platforms-saas-tech-brands/page.tsx#L633) | Browse verified tech creators on YouTube, LinkedIn, X, TikTok and Instagram, and message them directly. No platform fees for brands or creators. |
| [src/app/blog/best-tech-influencers-to-follow-2026/page.tsx:686](../src/app/blog/best-tech-influencers-to-follow-2026/page.tsx#L686) | Infoishai is a free marketplace where brands find and message tech creators directly. The creators on this list are not listed through this article. To work with tech creators w... |
| [src/app/blog/best-tech-influencers-to-follow-2026/page.tsx:690](../src/app/blog/best-tech-influencers-to-follow-2026/page.tsx#L690) | <Link href="/creators" className="text-blue-600 hover:text-blue-700 font-medium">the Infoishai creator marketplace</Link>, message them for free, or{' '} |
| [src/app/blog/best-tech-influencers-to-follow-2026/page.tsx:692](../src/app/blog/best-tech-influencers-to-follow-2026/page.tsx#L692) | and let creators apply to you. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/best-tech-influencers-to-follow-2026/page.tsx:714](../src/app/blog/best-tech-influencers-to-follow-2026/page.tsx#L714) | Browse tech creators on Infoishai by niche, platform, and country, and message them directly. There are no platform fees. |
| [src/app/blog/cybersecurity-influencer-marketing/page.tsx:606](../src/app/blog/cybersecurity-influencer-marketing/page.tsx#L606) | free for brands and creators. There are no platform fees. Payments are made directly between brand and |
| [src/app/blog/cybersecurity-influencer-marketing/page.tsx:641](../src/app/blog/cybersecurity-influencer-marketing/page.tsx#L641) | Find verified tech creators who cover security, and message them directly. No platform fees for brands or |
| [src/app/blog/devops-cloud-influencer-marketing/page.tsx:531](../src/app/blog/devops-cloud-influencer-marketing/page.tsx#L531) | Infoishai is free for brands and creators. There are no platform fees. Payments are made directly |
| [src/app/blog/devops-cloud-influencer-marketing/page.tsx:563](../src/app/blog/devops-cloud-influencer-marketing/page.tsx#L563) | Find verified tech creators who teach engineers, and message them directly. No platform fees for brands or |
| [src/app/blog/devrel-vs-influencer-marketing/page.tsx:566](../src/app/blog/devrel-vs-influencer-marketing/page.tsx#L566) | free for brands and creators. There are no platform fees. Payments are made directly between brand and |
| [src/app/blog/devrel-vs-influencer-marketing/page.tsx:600](../src/app/blog/devrel-vs-influencer-marketing/page.tsx#L600) | Browse verified tech creators who teach developers, and message them directly. No platform fees for |
| [src/app/blog/find-right-pakistani-influencers-brand/page.tsx:382](../src/app/blog/find-right-pakistani-influencers-brand/page.tsx#L382) | <p className="text-gray-800 font-medium">Message creators directly, for free, once you find a match.</p> |
| [src/app/blog/find-right-pakistani-influencers-brand/page.tsx:434](../src/app/blog/find-right-pakistani-influencers-brand/page.tsx#L434) | <p className="text-sm text-green-700 mt-4">Infoishai is free for brands and creators. There are no platform fees.</p> |
| [src/app/blog/fintech-influencer-marketing-compliance/page.tsx:558](../src/app/blog/fintech-influencer-marketing-compliance/page.tsx#L558) | Infoishai is free for brands and creators. There are no platform fees. Payments are made directly |
| [src/app/blog/first-tech-influencer-campaign-startup-guide-2026/page.tsx:631](../src/app/blog/first-tech-influencer-campaign-startup-guide-2026/page.tsx#L631) | Infoishai connects startups with verified tech creators across 9 countries, filterable by niche, platform, and budget. There are no platform fees. |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:13](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L13) | description: 'Analyze any Instagram profile for free. Check engagement rates, detect fake followers, and verify influencers before you pay. Complete guide for Pakistani brands.', |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:56](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L56) | description: 'Learn how to analyze Instagram profiles for free, detect fake influencers, and evaluate engagement rates for Pakistani brands.', |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:117](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L117) | Before you pay an influencer, make sure they're real. This guide shows you how to check engagement rates, spot fake followers, and read any Instagram profile for free. Built for... |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:155](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L155) | This guide will instruct on how to examine any <strong>Instagram profile at no cost</strong>, recognize fake influencers, and select creators who generate authentic engagement a... |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:409](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L409) | <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Analyze an Instagram Profile for Free</h2> |
| [src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx:662](../src/app/blog/free-instagram-profile-analyzer-complete-guide/page.tsx#L662) | <p className="text-sm text-purple-700 mt-4">Free for brands and creators. No platform fees.</p> |
| [src/app/blog/how-to-find-tech-influencers-b2b-2026/page.tsx:610](../src/app/blog/how-to-find-tech-influencers-b2b-2026/page.tsx#L610) | Looking for the fastest way to find verified tech creators? Infoishai is a tech influencer marketplace with verified tech creators, filters for niche, platform, and budget, dire... |
| [src/app/blog/how-to-find-tech-influencers-india-2026/page.tsx:570](../src/app/blog/how-to-find-tech-influencers-india-2026/page.tsx#L570) | Infoishai connects you with verified Indian tech creators, filterable by niche, platform, language, and city. There are no platform fees. |
| [src/app/blog/how-to-find-tech-youtubers-product-reviews-2026/page.tsx:605](../src/app/blog/how-to-find-tech-youtubers-product-reviews-2026/page.tsx#L605) | Infoishai connects you with verified tech YouTubers across 9 countries, filterable by niche, subscriber count, and engagement rate. There are no platform fees. |
| [src/app/blog/indian-tech-influencer-rates-by-city-2026/page.tsx:608](../src/app/blog/indian-tech-influencer-rates-by-city-2026/page.tsx#L608) | <Link href="/influencers/india" className="text-blue-600 hover:text-blue-700 font-medium">Indian tech influencers in Bangalore, Mumbai, and Delhi-NCR</Link>, message creators fo... |
| [src/app/blog/indian-tech-influencer-rates-by-city-2026/page.tsx:636](../src/app/blog/indian-tech-influencer-rates-by-city-2026/page.tsx#L636) | Browse verified Indian tech creators with rates in INR, filterable by city, niche, and platform. There are no platform fees. |
| [src/app/blog/influencer-disclosure-rules-b2b/page.tsx:513](../src/app/blog/influencer-disclosure-rules-b2b/page.tsx#L513) | Infoishai is a free marketplace for tech brands and creators, with no platform fees. Post a brief with our{' '} |
| [src/app/blog/influencer-disclosure-rules-b2b/page.tsx:543](../src/app/blog/influencer-disclosure-rules-b2b/page.tsx#L543) | Post a campaign, add your disclosure terms, and keep every deliverable in one place. Infoishai is free for brands and creators. |
| [src/app/blog/influencer-marketing-for-ai-startups/page.tsx:525](../src/app/blog/influencer-marketing-for-ai-startups/page.tsx#L525) | Infoishai is a free marketplace for tech creators only. You{' '} |
| [src/app/blog/influencer-marketing-for-ai-startups/page.tsx:529](../src/app/blog/influencer-marketing-for-ai-startups/page.tsx#L529) | There are no platform fees for brands or creators. Payments are made directly between brand and creator. Infoishai keeps the record. |
| [src/app/blog/influencer-marketing-for-ai-startups/page.tsx:557](../src/app/blog/influencer-marketing-for-ai-startups/page.tsx#L557) | Browse verified tech creators who build and teach with AI tools, and message them directly. The marketplace is free for brands and creators. |
| [src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx:243](../src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx#L243) | This guide compares the four <strong>delivery models</strong> for influencer marketing: a marketplace, an agency or managed service, a freelancer, and an in-house team. It cover... |
| [src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx:315](../src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx#L315) | One more cost hides in every model: your own time. A free marketplace with no owner on your side produces nothing. Count the hours of review, approvals and follow-up before comp... |
| [src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx:459](../src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx#L459) | <><strong>Free for brands and creators.</strong> There are no platform fees.</>, |
| [src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx:475](../src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx#L475) | <Link href="/creators" className={linkClass}>Browse verified tech creators</Link> on the free marketplace. |
| [src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx:499](../src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx#L499) | Tell us your product, buyer and launch plan, and we will send a creator shortlist and a custom quote. Want to run it yourself? The marketplace is free. |
| [src/app/blog/influencer-pricing-models-compared/page.tsx:531](../src/app/blog/influencer-pricing-models-compared/page.tsx#L531) | Infoishai is free for brands and creators. There are no platform fees. Payments are made directly |
| [src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx:457](../src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx#L457) | <strong>Freedom to criticise.</strong> Say in writing the creator is free to name a limit or a |
| [src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx:655](../src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx#L655) | holds the offer, contract, deliverables and payment records. Infoishai is free for brands and creators. |
| [src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx:656](../src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx#L656) | There are no platform fees. Payments are made directly between brand and creator, and Infoishai keeps |
| [src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx:692](../src/app/blog/linkedin-influencer-marketing-b2b-tech/page.tsx#L692) | No platform fees for brands or creators. |
| [src/app/blog/linkedin-tech-creator-rates/page.tsx:447](../src/app/blog/linkedin-tech-creator-rates/page.tsx#L447) | <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace, message them, and send offers. There are no platform fees. Payments ar... |
| [src/app/blog/linkedin-tech-creator-rates/page.tsx:475](../src/app/blog/linkedin-tech-creator-rates/page.tsx#L475) | Tell us your goal and budget, and get a custom quote for a managed LinkedIn campaign. Prefer to run it yourself? The marketplace is free. |
| [src/app/blog/micro-vs-macro-tech-influencers/page.tsx:567](../src/app/blog/micro-vs-macro-tech-influencers/page.tsx#L567) | creators apply to. Infoishai is free for brands and creators. There are no platform fees. Payments are |
| [src/app/blog/micro-vs-macro-tech-influencers/page.tsx:602](../src/app/blog/micro-vs-macro-tech-influencers/page.tsx#L602) | Find nano, micro and larger tech creators in one place, and message them directly. No platform fees for |
| [src/app/blog/pitch-tech-brands-creator-email-template/page.tsx:453](../src/app/blog/pitch-tech-brands-creator-email-template/page.tsx#L453) | Outbound pitching works best alongside inbound. Infoishai is a free marketplace for tech creators on YouTube, LinkedIn, X, TikTok and Instagram. Your profile shows your platform... |
| [src/app/blog/pitch-tech-brands-creator-email-template/page.tsx:457](../src/app/blog/pitch-tech-brands-creator-email-template/page.tsx#L457) | There are no platform fees for creators or brands. Payments are made directly between brand and creator, and Infoishai keeps the record. To get started,{' '} |
| [src/app/blog/pitch-tech-brands-creator-email-template/page.tsx:458](../src/app/blog/pitch-tech-brands-creator-email-template/page.tsx#L458) | <Link href="/signup/creator" className={linkClass}>join as a creator</Link>. It is free. |
| [src/app/blog/pitch-tech-brands-creator-email-template/page.tsx:483](../src/app/blog/pitch-tech-brands-creator-email-template/page.tsx#L483) | Build a profile tech brands browse, get messages and deal proposals, and apply to campaigns. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:282](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L282) | <><strong>The first conversion is free.</strong> A trial or a demo is the goal of the content, and payment comes later inside the product or through sales.</>, |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:289](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L289) | Two terms come up through the rest of this guide. <strong>Product-led growth</strong> (PLG) means the product drives sign-ups itself through a free plan or self-serve trial. <st... |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:379](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L379) | <strong>Product-led example (illustrative, fictional):</strong> a database tool with a free plan books a dedicated tutorial on a developer YouTube channel. The video ends with a... |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:550](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L550) | <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace and message them directly, or post a brief through our{' '} |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:551](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L551) | <Link href="/campaigns" className={linkClass}>campaign management tools</Link> and let creators apply. Once a creator joins, you track the offer, contract, deliverables and paym... |
| [src/app/blog/saas-influencer-marketing-playbook/page.tsx:579](../src/app/blog/saas-influencer-marketing-playbook/page.tsx#L579) | Tell us your product, buyer and goal, and we will send a creator shortlist and a custom quote. Prefer to run it yourself? The marketplace is free. |
| [src/app/blog/tech-creator-brief-template/page.tsx:559](../src/app/blog/tech-creator-brief-template/page.tsx#L559) | Infoishai is a free marketplace for tech creators on YouTube, LinkedIn, X, TikTok and Instagram. With our{' '} |
| [src/app/blog/tech-creator-brief-template/page.tsx:563](../src/app/blog/tech-creator-brief-template/page.tsx#L563) | There are no platform fees for brands or creators. Payments are made directly between brand and creator. Infoishai keeps the record. Questions about setup? Visit the{' '} |
| [src/app/blog/tech-creator-brief-template/page.tsx:588](../src/app/blog/tech-creator-brief-template/page.tsx#L588) | Post a campaign, review creator drafts and track every deliverable in one place. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/tech-creator-sponsorship-rates-2026/page.tsx:528](../src/app/blog/tech-creator-sponsorship-rates-2026/page.tsx#L528) | Create your free creator profile, display your rates and audience metrics, and let verified brands message you directly. There are no platform fees on your earnings. |
| [src/app/blog/tech-creators-guide-how-to-get-brand-deals-2026/page.tsx:597](../src/app/blog/tech-creators-guide-how-to-get-brand-deals-2026/page.tsx#L597) | Create your free creator profile, list your niche, platforms, and rates, and get discovered by tech brands actively looking for creators like you. There are no platform fees. |
| [src/app/blog/tech-creators-guide-how-to-get-brand-deals-2026/page.tsx:614](../src/app/blog/tech-creators-guide-how-to-get-brand-deals-2026/page.tsx#L614) | <p className="text-sm text-blue-700 mt-4">Free to join • No credit card required • Get discovered by tech brands</p> |
| [src/app/blog/tech-influencer-campaign-budget/page.tsx:430](../src/app/blog/tech-influencer-campaign-budget/page.tsx#L430) | Infoishai is a free marketplace for tech creators. You{' '} |
| [src/app/blog/tech-influencer-campaign-budget/page.tsx:431](../src/app/blog/tech-influencer-campaign-budget/page.tsx#L431) | <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on YouTube, LinkedIn, X, TikTok and Instagram, message them directly and send offers. There are... |
| [src/app/blog/tech-influencer-campaign-budget/page.tsx:459](../src/app/blog/tech-influencer-campaign-budget/page.tsx#L459) | Tell us your goal and budget, and our team will send a custom quote for a managed campaign. Prefer to run it yourself? Infoishai is free for brands and creators. |
| [src/app/blog/tech-influencer-rates-2026/page.tsx:530](../src/app/blog/tech-influencer-rates-2026/page.tsx#L530) | Infoishai connects you with verified tech creators across 9 countries, filterable by platform, niche, and rate range. There are no platform fees. |
| [src/app/blog/tech-influencers-complete-guide/page.tsx:126](../src/app/blog/tech-influencers-complete-guide/page.tsx#L126) | question: 'Is Infoishai free for brands?', |
| [src/app/blog/tech-influencers-complete-guide/page.tsx:128](../src/app/blog/tech-influencers-complete-guide/page.tsx#L128) | 'Yes. Infoishai is free for brands and creators. There are no platform fees. Brands browse and message creators, send offers, or post campaigns for creators to apply to. Payment... |
| [src/app/blog/tech-influencers-complete-guide/page.tsx:641](../src/app/blog/tech-influencers-complete-guide/page.tsx#L641) | Infoishai is a free marketplace for tech brands and tech creators. Brands search creators by niche, platform, and country, message them directly, send offers, or post campaigns ... |
| [src/app/blog/tech-influencers-complete-guide/page.tsx:647](../src/app/blog/tech-influencers-complete-guide/page.tsx#L647) | and let creators apply to you. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/tech-influencers-complete-guide/page.tsx:669](../src/app/blog/tech-influencers-complete-guide/page.tsx#L669) | Browse tech creators on Infoishai by niche, platform, and country, and message them directly. There are no platform fees. |
| [src/app/blog/tech-newsletter-podcast-sponsorships/page.tsx:568](../src/app/blog/tech-newsletter-podcast-sponsorships/page.tsx#L568) | covers search and outreach. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/tech-newsletter-podcast-sponsorships/page.tsx:604](../src/app/blog/tech-newsletter-podcast-sponsorships/page.tsx#L604) | No platform fees for brands or creators. |
| [src/app/blog/tech-youtuber-campaign-playbook/page.tsx:480](../src/app/blog/tech-youtuber-campaign-playbook/page.tsx#L480) | Infoishai is a free marketplace for tech creators only. You{' '} |
| [src/app/blog/tech-youtuber-campaign-playbook/page.tsx:485](../src/app/blog/tech-youtuber-campaign-playbook/page.tsx#L485) | There are no platform fees for brands or creators. Payments are made directly between brand and creator. Infoishai keeps the record. |
| [src/app/blog/tech-youtuber-campaign-playbook/page.tsx:513](../src/app/blog/tech-youtuber-campaign-playbook/page.tsx#L513) | Post your brief, let verified tech YouTubers apply, and track every deliverable in one place. Infoishai is free for brands and creators. |
| [src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx:405](../src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx#L405) | self-serve tier, a free plan or a visual result. For a six-month enterprise sale, use TikTok to build |
| [src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx:591](../src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx#L591) | Infoishai is free for brands and creators. There are no platform fees. Payments are made directly |
| [src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx:622](../src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx#L622) | Find verified tech creators on TikTok, Instagram and YouTube, and message them directly. No platform fees |
| [src/app/blog/top-10-benefits-tech-influencer-marketing-2026/page.tsx:320](../src/app/blog/top-10-benefits-tech-influencer-marketing-2026/page.tsx#L320) | Ready to grow your brand with tech influencer marketing? Infoishai is a tech influencer marketplace with verified tech creators, filters for niche, platform, and budget, direct ... |
| [src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx:758](../src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx#L758) | Infoishai is a free marketplace where brands find and message tech creators directly. The channels on this list are not listed through this article. To work with Indian tech cre... |
| [src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx:762](../src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx#L762) | <Link href="/influencers/india" className="text-blue-600 hover:text-blue-700 font-medium">Indian tech creators on Infoishai</Link>, message them for free, or{' '} |
| [src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx:764](../src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx#L764) | and let creators apply to you. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx:791](../src/app/blog/top-indian-tech-youtubers-brand-partnerships-2026/page.tsx#L791) | Browse Indian tech creators on Infoishai by niche, platform, and language, and message them directly. There are no platform fees. |
| [src/app/blog/top-tech-influencers-singapore-2026/page.tsx:213](../src/app/blog/top-tech-influencers-singapore-2026/page.tsx#L213) | answer: 'Search Infoishai for Singapore tech creators by niche and platform, then message them for free. Or post a campaign and let Singapore creators apply to you. Check audien... |
| [src/app/blog/top-tech-influencers-singapore-2026/page.tsx:217](../src/app/blog/top-tech-influencers-singapore-2026/page.tsx#L217) | answer: 'Payments are made directly between brand and creator, by bank transfer, PayNow, Wise, or another method you agree on. Infoishai keeps the record of the offer, contract,... |
| [src/app/blog/top-tech-influencers-singapore-2026/page.tsx:674](../src/app/blog/top-tech-influencers-singapore-2026/page.tsx#L674) | Sign up free as a brand, filter Singapore tech creators by niche and platform, and message them directly, or post a campaign and let creators apply. Infoishai tracks each collab... |
| [src/app/blog/top-tech-influencers-singapore-2026/page.tsx:727](../src/app/blog/top-tech-influencers-singapore-2026/page.tsx#L727) | Browse verified Singapore tech creators by niche, platform, and rate. Message them for free. There are no platform fees. |
| [src/app/blog/track-b2b-influencer-campaigns-utm/page.tsx:491](../src/app/blog/track-b2b-influencer-campaigns-utm/page.tsx#L491) | Infoishai does not create UTM links or connect to your CRM. Your analytics stack keeps this job. What Infoishai gives you is a free place to run the work around it, with no plat... |
| [src/app/blog/track-b2b-influencer-campaigns-utm/page.tsx:524](../src/app/blog/track-b2b-influencer-campaigns-utm/page.tsx#L524) | Post your brief, add your tagged links and codes, and keep every deliverable in one place. Infoishai is free for brands and creators. |
| [src/app/blog/types-of-b2b-tech-influencers/page.tsx:494](../src/app/blog/types-of-b2b-tech-influencers/page.tsx#L494) | Infoishai is free for brands and creators, with no platform fees. You pay creators directly, and Infoishai keeps the record. Want a team to run the work? Our{' '} |
| [src/app/blog/types-of-b2b-tech-influencers/page.tsx:519](../src/app/blog/types-of-b2b-tech-influencers/page.tsx#L519) | Know the type you need? Search verified tech creators and message them directly. Infoishai is free for brands and creators. |
| [src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx:230](../src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx#L230) | answer: 'Payments are made directly between brand and creator, by bank transfer, Wise, PayPal, or another method you agree on. Infoishai keeps the record of the offer, contract,... |
| [src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx:675](../src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx#L675) | <p className="text-gray-700"><strong>Reach out.</strong> Message creators for free, or{' '} |
| [src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx:714](../src/app/blog/uk-tech-influencers-b2b-brands-2026/page.tsx#L714) | Browse verified UK tech creators by niche, platform, and rate. Message them for free. There are no platform fees. |
| [src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx:665](../src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx#L665) | Infoishai is a free marketplace where brands find and message tech creators directly. The creators on this list are not listed through this article. To work with US tech creator... |
| [src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx:669](../src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx#L669) | <Link href="/influencers/usa" className="text-blue-600 hover:text-blue-700 font-medium">US tech creators on Infoishai</Link>, message them for free, or{' '} |
| [src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx:671](../src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx#L671) | and let creators apply to you. Infoishai is free for brands and creators. There are no platform fees. |
| [src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx:693](../src/app/blog/us-tech-influencers-b2b-reviews-2026/page.tsx#L693) | Browse US tech creators on Infoishai by niche and platform, and message them directly. There are no platform fees. |
| [src/app/blog/vet-tech-influencers-scorecard/page.tsx:479](../src/app/blog/vet-tech-influencers-scorecard/page.tsx#L479) | Infoishai is a free marketplace for tech brands and tech creators, with no platform fees. You run the review, and the marketplace holds the steps in one place. |
| [src/app/blog/vet-tech-influencers-scorecard/page.tsx:516](../src/app/blog/vet-tech-influencers-scorecard/page.tsx#L516) | Browse verified tech creators on Infoishai for free, and message the ones worth scoring. |
| [src/app/blog/ways-tech-creators-earn-money-2026/page.tsx:439](../src/app/blog/ways-tech-creators-earn-money-2026/page.tsx#L439) | Create your free creator profile, display your rates and audience metrics, and let verified brands message you directly. There are no platform fees on your earnings. |
| [src/app/blog/x-developer-influencers-dev-tools/page.tsx:559](../src/app/blog/x-developer-influencers-dev-tools/page.tsx#L559) | payment records. Infoishai is free for brands and creators. There are no platform fees. Payments are |
| [src/app/blog/youtube-sponsorship-cost-b2b-saas/page.tsx:496](../src/app/blog/youtube-sponsorship-cost-b2b-saas/page.tsx#L496) | <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace, message them, and send offers. There are no platform fees. Payments ar... |
| [src/app/blog/youtube-sponsorship-cost-b2b-saas/page.tsx:525](../src/app/blog/youtube-sponsorship-cost-b2b-saas/page.tsx#L525) | Request a creator shortlist and a custom quote for a managed YouTube campaign. Prefer to run it yourself? The marketplace is free. |

## Code comments and internal docs (not user-facing) (13)

| Where | Text |
| --- | --- |
| [src/app/api/deals/route.ts:170](../src/app/api/deals/route.ts#L170) | // No platform fee (PLATFORM_FEE_PERCENTAGE is 0), so the creator payout |
| [src/app/campaigns/layout.tsx:8](../src/app/campaigns/layout.tsx#L8) | 'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.', |
| [src/app/campaigns/layout.tsx:24](../src/app/campaigns/layout.tsx#L24) | 'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.', |
| [src/app/campaigns/layout.tsx:34](../src/app/campaigns/layout.tsx#L34) | 'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.', |
| [src/config/product.ts:155](../src/config/product.ts#L155) | // Referral partner program. Infoishai is free for brands and creators, so |
| [src/config/product.ts:156](../src/config/product.ts#L156) | // there is no platform fee to share: while this is false, completed deals |
| [src/lib/referral-commissions.ts:31](../src/lib/referral-commissions.ts#L31) | // THIS, not of the full deal amount — a partner's "20% commission rate" |
| [src/lib/referral-commissions.ts:99](../src/lib/referral-commissions.ts#L99) | // Program paused (Infoishai is free, so there is no fee to share): |
| [src/lib/referral-commissions.ts:136](../src/lib/referral-commissions.ts#L136) | // the full deal amount (a partner's rate applies to Infoishai's cut). |
| [src/utils/constants.ts:192](../src/utils/constants.ts#L192) | // Platform fee on legacy deals. Infoishai is free for brands and creators, |
| [src/utils/constants.ts:193](../src/utils/constants.ts#L193) | // so this is 0: the creator receives the full deal amount. Historical deals |
| [docs/REFERRAL_SYSTEM.md:73](../docs/REFERRAL_SYSTEM.md#L73) | > **Paused (2026-10-27):** Infoishai is free for brands and creators and |
| [docs/REFERRAL_SYSTEM.md:74](../docs/REFERRAL_SYSTEM.md#L74) | > deals carry no platform fee. `REFERRAL_COMMISSIONS_ENABLED = false` in |
