'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in Canada?',
    answer:
      'Search the Infoishai creator directory and filter by Canada. Browse verified Canadian tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche and audience size to find the right creator for your campaign.',
  },
  {
    question: 'How much do Canadian tech influencers charge?',
    answer:
      'Canadian rates vary by platform. YouTube: CAD $800 to $4,500 per video for creators with 50K to 200K subscribers. LinkedIn: CAD $400 to $1,800 per post. Twitter/X: CAD $150 to $900 per thread. Newsletter mentions: CAD $300 to $1,500 per issue.',
  },
  {
    question: 'Why are Canadian creator rates lower than US rates?',
    answer:
      'The Canadian creator market is less saturated than the US market. Lower competition means brands get comparable audience quality and engagement at 20-30% lower rates. Canadian creators produce English-language content consumed across all of North America.',
  },
  {
    question: 'Do Canadian tech influencers reach US audiences?',
    answer:
      "Yes. Most Canadian tech creators have a significant US audience. English-language content from Canadian creators ranks globally on YouTube and Google. A typical Canadian tech YouTuber's audience splits roughly 40-50% Canada, 25-35% USA, and 15-25% other countries.",
  },
  {
    question: 'Are there French-speaking tech influencers on Infoishai?',
    answer:
      'Yes. Montreal and Quebec-based creators produce content in French, English, or both languages. Bilingual creators help brands reach both Canadian and French-speaking European markets from a single partnership.',
  },
]

export default function CanadaFaq() {
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
