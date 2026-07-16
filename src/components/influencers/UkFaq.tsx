'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in the UK?',
    answer:
      'Search the Infoishai creator directory and filter by United Kingdom. Browse verified British tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche (AI, SaaS, developer tools) and audience size to find the right creator for your campaign.',
  },
  {
    question: 'How much do UK tech influencers charge?',
    answer:
      'UK tech influencer rates vary by platform and audience size. YouTube: £800 to £4,000 per video for creators with 50K to 200K subscribers. LinkedIn: £400 to £1,500 per post. Twitter/X: £150 to £800 per thread. Newsletter mentions: £250 to £1,200 per issue.',
  },
  {
    question: 'Why should I work with UK-based tech influencers?',
    answer:
      'The UK is Europe’s largest tech market with over 150 unicorn startups. British tech influencers reach decision-makers across London, Cambridge, Manchester, Edinburgh, and other tech hubs. Their audiences include developers, CTOs, and startup founders across the UK and Europe.',
  },
  {
    question: 'Are UK influencer rates different from US rates?',
    answer:
      'UK creator rates run approximately 15-25% lower than equivalent US rates. This makes British tech influencers a cost-effective choice for brands targeting European and global English-speaking audiences. Quality and engagement levels are comparable.',
  },
  {
    question: 'Do UK tech influencers reach audiences outside the UK?',
    answer:
      'Yes. British tech creators produce English-language content consumed across Europe, North America, and globally. Many UK creators have audiences split between the UK (40-60%), other European countries (15-25%), and the US/Canada (15-25%). On Infoishai, you view audience location data on each creator’s profile.',
  },
]

export default function UkFaq() {
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
