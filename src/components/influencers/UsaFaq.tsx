'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in the USA?',
    answer:
      'Search the Infoishai creator directory and filter by United States. Browse verified tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche and audience size to find the right creator for your campaign.',
  },
  {
    question: 'How much do American tech influencers charge?',
    answer:
      'US tech influencer rates vary by platform and audience size. YouTube: $1,000 to $5,000 per video for creators with 50K to 200K subscribers. LinkedIn: $500 to $2,000 per post. Twitter/X: $200 to $1,000 per thread. Newsletter mentions: $300 to $1,500 per issue.',
  },
  {
    question: 'Why should I work with US-based tech influencers?',
    answer:
      'The US has the largest tech buyer market globally. American tech influencers reach decision-makers at companies across Silicon Valley, New York, Austin, Seattle, and other tech hubs. Their audiences include developers, CTOs, product managers, and startup founders with purchasing authority.',
  },
  {
    question: 'Do I need a budget to use Infoishai?',
    answer:
      'Searching and messaging creators on Infoishai is free. You pay creators directly based on agreed rates. No subscription fees, no platform commissions on search. Escrow payment protection is available for campaigns.',
  },
  {
    question: 'What types of tech influencers are available in the USA?',
    answer:
      'Infoishai lists American creators covering AI and machine learning, SaaS and productivity tools, developer platforms, cloud and DevOps, cybersecurity, fintech, no-code tools, and more. Creators are active on YouTube, Twitter/X, LinkedIn, newsletters, and podcasts.',
  },
]

export default function UsaFaq() {
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
