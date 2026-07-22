'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in the Netherlands?',
    answer:
      'Search the Infoishai creator directory and filter by Netherlands. Browse verified Dutch tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche, language (Dutch or English), and audience size.',
  },
  {
    question: 'How much do Dutch tech influencers charge?',
    answer:
      'Dutch rates vary by platform. YouTube: EUR 2,000 to EUR 5,000 per video for creators with 50K to 200K subscribers. LinkedIn: EUR 400 to EUR 1,800 per post. Twitter/X: EUR 150 to EUR 800 per thread. Rates are slightly below German rates and comparable to UK rates.',
  },
  {
    question: 'Should I use Dutch-language or English-language creators?',
    answer:
      'The Netherlands has the highest English proficiency among non-native speakers globally. Dutch tech creators produce polished English content consumed across Europe. For domestic-only campaigns targeting Dutch consumers, Dutch-language content performs better. For B2B and international reach, English-language content from Dutch creators gives you European-wide exposure from a single partnership.',
  },
  {
    question: 'Do Dutch tech influencers reach audiences outside the Netherlands?',
    answer:
      "Yes. English-language Dutch creators reach audiences across Europe, the UK, and the US. Dutch-language creators also reach Flemish Belgium (6.5 million Dutch speakers). A typical Dutch tech creator's audience includes 55-65% Netherlands, 8-12% Belgium, and 20-30% other European and global markets.",
  },
  {
    question: 'What makes the Netherlands unique for tech influencer marketing?',
    answer:
      "Three factors set the Netherlands apart. The country has Europe's highest English proficiency, so Dutch creators produce native-quality English content. Amsterdam hosts European HQs for Netflix, Uber, Tesla, and hundreds of tech companies. And Eindhoven's Brainport ecosystem offers deep tech and hardware creator content not found in any other market.",
  },
  {
    question: 'Is the Netherlands a good starting point for European expansion?',
    answer:
      'Yes. Dutch business culture closely mirrors Anglo-Saxon norms. English is the working language in most Dutch tech companies. The Netherlands ranks as one of the easiest European markets for international brands to enter. Starting with Dutch creators builds European credibility before expanding into larger markets like Germany and France.',
  },
  {
    question: 'What is the Brainport ecosystem?',
    answer:
      "Brainport Eindhoven is Europe's leading technology and innovation hub per capita. Home to ASML, Philips, NXP, and the High Tech Campus Eindhoven (235 companies, 12,000 researchers). Creators from this ecosystem cover semiconductor technology, IoT, hardware engineering, and deep tech topics not found at this depth in any other market globally.",
  },
]

export default function NetherlandsFaq() {
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
