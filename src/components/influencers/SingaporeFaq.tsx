'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in Singapore?',
    answer:
      'Search the Infoishai creator directory and filter by Singapore. Browse verified Singaporean tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche (fintech, AI, SaaS, developer tools), audience size, and engagement rate to find the right creator for your campaign.',
  },
  {
    question: 'How much do Singaporean tech influencers charge?',
    answer:
      'Singaporean tech influencer rates vary by platform and audience size. YouTube: SGD 1,200 to SGD 5,500 per video (50K-200K subscribers). LinkedIn: SGD 600 to SGD 2,500 per post. Twitter/X: SGD 250 to SGD 1,200 per thread. Newsletter mentions: SGD 400 to SGD 1,800 per issue.',
  },
  {
    question: 'Why are Singaporean influencer rates higher than other ASEAN markets?',
    answer:
      "Singapore has the highest GDP per capita in ASEAN. The audience's purchasing power is significantly higher than other Southeast Asian markets. A Singaporean tech professional audience of 10,000 represents more spending potential than 100,000 viewers in most neighbouring countries. The premium reflects audience quality.",
  },
  {
    question: 'Do Singaporean tech influencers reach audiences outside Singapore?',
    answer:
      "Yes. Singapore-based creators reach professionals across all of ASEAN. A typical Singaporean tech creator's audience includes 35-45% Singapore, 15-20% Malaysia, 10-15% Indonesia, and the remaining split across Philippines, Vietnam, Thailand, India, and Australia. One Singaporean partnership covers six or more ASEAN countries.",
  },
  {
    question: 'What makes Singapore different from other ASEAN tech markets?',
    answer:
      "Three factors. Singapore is the regional HQ for nearly every global tech company, giving creators access to enterprise buyers at MNCs. The government's Smart Nation initiative drives world-leading digital transformation. And Singapore's regulatory frameworks (MAS for fintech, IMDA for infocomm) set the standard for the entire region. A Singaporean endorsement carries institutional weight.",
  },
  {
    question: 'Should I combine Singaporean creators with creators from other ASEAN countries?',
    answer:
      'For maximum ASEAN impact, yes. A Singaporean creator provides regional trust and credibility. Local creators in Malaysia, Indonesia, Philippines, or Vietnam provide market-specific reach and language coverage. The combination delivers both authority and volume across Southeast Asia.',
  },
  {
    question: 'Is LinkedIn or YouTube more effective in Singapore?',
    answer:
      'LinkedIn is the strongest B2B channel in Singapore. The country has one of the highest LinkedIn penetration rates in Asia relative to population. For enterprise SaaS and fintech products, LinkedIn delivers the most qualified leads. YouTube works better for detailed product demonstrations, tutorials, and reaching a broader ASEAN audience beyond Singapore\'s borders.',
  },
]

export default function SingaporeFaq() {
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
