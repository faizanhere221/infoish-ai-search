'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Sparkles,
  HelpCircle,
  MessageSquare,
  Mail,
  FileText,
  ChevronDown,
  ArrowLeft,
  User,
  Handshake,
} from 'lucide-react'

const FAQS: { category: string; icon: React.ElementType; items: { q: string; a: string }[] }[] = [
  {
    category: 'Getting Started',
    icon: Sparkles,
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up" on the homepage and choose whether you\'re a Creator or a Brand. Creators complete a 3-step profile setup (account → profile → content niches). Brands fill in their company details. Both are approved instantly.',
      },
      {
        q: 'Is Infoishai free to use?',
        a: 'Yes — the platform is completely free. Brands can browse and contact creators at no charge. Creators list their services for free.',
      },
      {
        q: 'How do I find influencers?',
        a: 'Go to the Creators page and use the search and filter tools to find influencers by niche, platform, country, and follower range. Click a profile to view their full details and services.',
      },
    ],
  },
  {
    category: 'Creator Profiles',
    icon: User,
    items: [
      {
        q: 'How do I update my profile after signing up?',
        a: 'Go to Settings from your dashboard. You can update your bio, add platform links, adjust your niches, and set your rate card at any time.',
      },
      {
        q: 'How do I add my social media follower counts?',
        a: 'In Settings → Platforms, add each platform (Instagram, TikTok, YouTube, etc.) along with your profile URL and follower count. This information is shown to brands browsing your profile.',
      },
      {
        q: 'Can brands contact me directly?',
        a: 'Yes. Brands can send you a deal proposal directly from your profile page. You\'ll receive a notification and can accept or decline from your Deals dashboard.',
      },
    ],
  },
  {
    category: 'Managing Deals',
    icon: Handshake,
    items: [
      {
        q: 'How does the deals flow work?',
        a: 'A brand sends a deal proposal to a creator. The creator accepts or declines. Once accepted, the creator completes the deliverables and submits. The brand reviews and can approve (completing the deal) or request a revision (up to the agreed number of revisions).',
      },
      {
        q: 'How many revisions can I request?',
        a: 'Each deal has a maximum revision count set when the deal is created (default: 2). Once that limit is reached, the brand must approve the delivered work.',
      },
      {
        q: 'What happens after a deal is completed?',
        a: 'Both parties can leave a review for each other. Reviews are visible on creator profiles and help build trust on the platform.',
      },
      {
        q: 'Can I cancel a deal?',
        a: 'Deals can be declined before they are accepted. Once a deal is in progress, contact the other party via the deal\'s message thread and reach out to support if needed.',
      },
    ],
  },
  {
    category: 'Messaging',
    icon: MessageSquare,
    items: [
      {
        q: 'How do I message a creator or brand?',
        a: 'From any deal page, click "Send Message" in the sidebar to open your conversation. You can also go to Messages from the dashboard navigation.',
      },
      {
        q: 'Are messages private?',
        a: 'Yes. Messages are only visible to the two parties in the conversation. System messages (deal accepted, revision requested, etc.) are automatically added to keep both parties informed.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-medium text-gray-900">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {FAQS.map(({ category, icon: Icon, items }) => (
          <div key={category} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{category}</h2>
            </div>
            <div>
              {items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Still need help?</h2>
          </div>
          <p className="text-violet-100 mb-4">
            Our support team typically responds within 24 hours.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@infoishai.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg font-medium hover:bg-violet-50"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30"
            >
              <MessageSquare className="w-5 h-5" />
              Message Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
