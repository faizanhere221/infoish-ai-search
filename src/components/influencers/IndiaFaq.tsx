'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I find tech influencers in India?',
    answer:
      'Search the Infoishai creator directory and filter by India. Browse verified Indian tech influencers across YouTube, Instagram, Twitter/X, and LinkedIn. Filter by niche, language, and audience size.',
  },
  {
    question: 'How much do Indian tech influencers charge?',
    answer:
      'Indian rates vary by platform. YouTube: ₹20,000 to ₹1,50,000 per video for creators with 50K to 500K subscribers. Instagram: ₹8,000 to ₹60,000 per reel. LinkedIn: ₹10,000 to ₹50,000 per post. Indian rates are 70-80% lower than US equivalents.',
  },
  {
    question: 'Should I work with English or Hindi tech influencers in India?',
    answer:
      'English creators reach India’s senior tech professionals and a global audience. Hindi creators reach a broader Indian audience with higher subscriber counts. For developer tools and SaaS, English works best. For consumer apps and mass-market products, Hindi delivers more reach. Many brands run campaigns in both languages.',
  },
  {
    question: 'Do Indian tech influencers have audiences outside India?',
    answer:
      "Yes. English-language Indian tech creators reach the global Indian diaspora across the US, UK, Canada, Middle East, and Southeast Asia. A typical Indian tech YouTuber's audience splits roughly 60-70% India, 10-15% USA, and 15-25% other countries.",
  },
  {
    question: 'What makes Indian tech influencers different from Western creators?',
    answer:
      'Indian tech creators have access to the world’s largest developer population. Their audiences skew younger (18-30 age group) and are highly engaged with educational and tutorial content. Indian creators produce high-quality content at significantly lower rates, making India the most cost-effective market for tech influencer marketing globally.',
  },
  {
    question: 'Are Indian tech influencers effective for B2B products?',
    answer:
      'Yes. LinkedIn and YouTube are the primary B2B channels in India. Indian LinkedIn creators reach senior professionals at both Indian companies and multinational corporations with India offices (Google, Microsoft, Amazon, Meta, Salesforce). For enterprise tools and B2B SaaS, target English-language creators with a professional audience.',
  },
]

export default function IndiaFaq() {
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
