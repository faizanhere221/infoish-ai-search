'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in Germany?',
    answer:
      'Search the Infoishai creator directory and filter by Germany. Browse verified German tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche, language (German or English), and audience size.',
  },
  {
    question: 'How much do German tech influencers charge?',
    answer:
      'German rates vary by platform. YouTube: EUR 2,500 to EUR 6,000 per video for creators with 50K to 200K subscribers. LinkedIn: EUR 500 to EUR 2,000 per post. Twitter/X: EUR 200 to EUR 1,000 per thread. Rates are comparable to UK rates and slightly above the European average.',
  },
  {
    question: 'Should I work with German-language or English-language creators in Germany?',
    answer:
      'German-language creators reach the broader DACH business audience, especially Mittelstand decision-makers and enterprise buyers. English-language German creators reach international audiences and senior developers. For enterprise software and B2B tools, German-language content performs better with domestic buyers. For developer tools, English works well. Many German creators offer both language options.',
  },
  {
    question: 'Do German tech influencers reach audiences in Austria and Switzerland?',
    answer:
      "Yes. German-language content reaches the entire DACH region. A typical German tech creator's audience includes 8-12% Austrian viewers and 5-8% Swiss viewers. One German creator partnership covers three of Europe's wealthiest markets.",
  },
  {
    question: 'What is XING and should I use XING influencers?',
    answer:
      'XING is a German professional network similar to LinkedIn. While LinkedIn dominates among younger tech professionals, XING maintains a presence among traditional German businesses and the Mittelstand. For brands targeting established German enterprises, a XING influencer campaign adds reach beyond LinkedIn. For startups and modern tech companies, LinkedIn is sufficient.',
  },
  {
    question: "What are Germany's influencer disclosure rules?",
    answer:
      'Germany requires clear labelling of sponsored content under the Medienstaatsvertrag. Creators must mark paid partnerships with "Werbung" or "Anzeige." Reputable German creators handle this automatically. Confirm disclosure practices before launching your campaign.',
  },
  {
    question: 'What makes Industry 4.0 content unique to Germany?',
    answer:
      "Germany created the Industry 4.0 concept and leads its global adoption. Manufacturing automation, IoT, digital twins, and smart factory technology are deeply embedded in Germany's industrial economy. No other market has this depth of industrial tech influencer content. Brands selling industrial IoT, manufacturing software, or automation tools find their most qualified audience through German Industry 4.0 creators.",
  },
]

export default function GermanyFaq() {
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
