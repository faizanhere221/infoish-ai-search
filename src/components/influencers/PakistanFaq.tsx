'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in Pakistan?',
    answer:
      'Search the Infoishai creator directory and filter by Pakistan. Browse verified Pakistani tech influencers across YouTube, Instagram, TikTok, Twitter/X, and LinkedIn. Filter by niche, language, and audience size.',
  },
  {
    question: 'How much do Pakistani tech influencers charge?',
    answer:
      'Pakistani rates are the most affordable in any English-speaking market. YouTube: PKR 25,000 to PKR 1,50,000 per video for creators with 50K to 500K subscribers. Instagram: PKR 10,000 to PKR 60,000 per reel. LinkedIn: PKR 10,000 to PKR 40,000 per post. Rates run 80-90% lower than US equivalents.',
  },
  {
    question: 'Should I work with English or Urdu tech influencers in Pakistan?',
    answer:
      'English creators reach Pakistani professionals, the global diaspora, and international audiences. Urdu creators reach the broader domestic market with larger subscriber counts. For developer tools and SaaS, English works best. For consumer apps and mass-market products, Urdu delivers more reach. Many brands run campaigns in both languages.',
  },
  {
    question: 'Do Pakistani tech influencers have audiences outside Pakistan?',
    answer:
      "Yes. English-language Pakistani tech creators reach the Pakistani diaspora across the Middle East (UAE, Saudi Arabia, Qatar), UK, US, Canada, and Europe. A typical Pakistani tech YouTuber's audience splits roughly 60-70% Pakistan, 10-15% Middle East, 5-10% UK/US, and 10-15% other countries including India and Bangladesh.",
  },
  {
    question: 'Why are Pakistani influencer rates so low compared to other markets?',
    answer:
      'The Pakistani creator market is less saturated than Western and Indian markets. The lower cost of living in Pakistan means creators charge less while maintaining quality content production. For international brands, Pakistani influencer campaigns deliver the highest volume of content and reach per dollar spent.',
  },
  {
    question: 'Are Pakistani tech influencers effective for B2B products?',
    answer:
      'Yes, for specific segments. LinkedIn and YouTube are the primary B2B channels in Pakistan. Pakistani LinkedIn creators reach professionals at local IT companies, multinational corporations with Pakistan offices, and the growing startup ecosystem. For products targeting developers, freelancers, and tech teams, Pakistani B2B influencer campaigns are highly cost-effective.',
  },
  {
    question: 'Are micro-influencers effective in Pakistan?',
    answer:
      'Micro-influencers in Pakistan deliver 3x higher engagement rates than accounts with large followings. A micro-influencer with 10K to 50K engaged followers often drives more conversions than a creator with 500K passive subscribers.',
  },
]

export default function PakistanFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div key={faq.question} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left min-h-[48px]"
            >
              <span className="font-semibold text-gray-900">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
