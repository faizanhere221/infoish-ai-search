'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in Australia?',
    answer:
      'Search the Infoishai creator directory and filter by Australia. Browse verified Australian tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche and audience size to find the right creator for your campaign.',
  },
  {
    question: 'How much do Australian tech influencers charge?',
    answer:
      'Australian rates vary by platform. YouTube: AUD $2,000 to $5,000 per video for creators with 50K to 200K subscribers. LinkedIn: AUD $500 to $2,000 per post. Twitter/X: AUD $200 to $1,000 per thread. Newsletter mentions: AUD $300 to $1,500 per issue.',
  },
  {
    question: 'Why are Australian tech influencers valuable for APAC campaigns?',
    answer:
      'Australian creators bridge Western and Asian markets. Their audiences span Australia, New Zealand, Singapore, and Southeast Asia. English-language content from Australian creators performs across the entire APAC region without needing separate localisation for each market.',
  },
  {
    question: 'Do Australian tech influencers reach audiences outside Australia?',
    answer:
      "Yes. A typical Australian tech creator's audience splits roughly 50-65% Australia/NZ, 10-15% Southeast Asia, 10-15% USA/Canada, and 10-15% UK and other markets. For brands targeting the broader APAC region, Australian creators provide built-in regional reach.",
  },
  {
    question: 'What makes the Australian tech market unique?',
    answer:
      'Australia has one of the highest per-capita SaaS adoption rates globally. The country is home to major tech companies like Atlassian and Canva, a strong fintech sector, and unique niches like mining tech and agritech not found in other Western markets. Australian tech buyers have high purchasing power and are early adopters of new tools.',
  },
  {
    question: 'Does Infoishai have New Zealand tech influencers?',
    answer:
      'Yes. Australian and New Zealand creators are part of the same APAC creator ecosystem on Infoishai. Many creators based in Australia and New Zealand reach audiences across both countries. Search the creator directory and filter by audience location to reach Kiwi buyers.',
  },
]

export default function AustraliaFaq() {
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
