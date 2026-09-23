'use client'

import { useState } from 'react'
import { Check, Copy, Share2, Twitter, Linkedin, Mail, ChevronDown } from 'lucide-react'

interface CopyReferralLinkProps {
  code: string
}

const BASE_URL = 'https://infoishai.com'

export default function CopyReferralLink({ code }: CopyReferralLinkProps) {
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const link = `${BASE_URL}/signup/creator?ref=${code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setShowToast(true)
      setTimeout(() => setCopied(false), 2000)
      setTimeout(() => setShowToast(false), 2500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const encodedLink = encodeURIComponent(link)
  const twitterText = encodeURIComponent(`Join @infoishai - the tech influencer marketplace! ${link}`)
  const linkedInTitle = encodeURIComponent('Join Infoishai - the tech influencer marketplace')
  const linkedInSummary = encodeURIComponent('Infoishai connects B2B brands with verified tech creators. Check it out:')
  const emailSubject = encodeURIComponent('Join me on Infoishai')
  const emailBody = encodeURIComponent(
    `Hey!\n\nI wanted to share Infoishai with you — the tech influencer marketplace connecting B2B brands with verified tech creators.\n\nJoin here: ${link}\n`
  )

  const shareOptions = [
    { label: 'Twitter / X', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${twitterText}` },
    // LinkedIn's share endpoint officially only reads `url` (it scrapes OG
    // tags for the rest); title/summary are passed best-effort and may be
    // ignored depending on how LinkedIn is currently rendering shares.
    { label: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedLink}&title=${linkedInTitle}&summary=${linkedInSummary}` },
    { label: 'Email', icon: Mail, href: `mailto:?subject=${emailSubject}&body=${emailBody}` },
  ]

  return (
    <div className="relative flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 min-w-0">
        <input
          type="text"
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="w-full bg-transparent text-sm text-gray-700 outline-none truncate"
        />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShareOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
            <ChevronDown className={`w-4 h-4 transition-transform ${shareOpen ? 'rotate-180' : ''}`} />
          </button>

          {shareOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                {shareOptions.map((opt) => (
                  <a
                    key={opt.label}
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <opt.icon className="w-4 h-4 text-gray-400" />
                    {opt.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute -bottom-11 left-0 sm:left-auto sm:right-0 flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg z-30">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Referral link copied!
        </div>
      )}
    </div>
  )
}
