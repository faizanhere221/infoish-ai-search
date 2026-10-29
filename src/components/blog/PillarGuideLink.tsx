import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

// "Related guides" link back to the pillar post. Every topic post the pillar
// links to renders this, so the hub and its spokes link both ways.
export default function PillarGuideLink() {
  return (
    <div className="mt-12 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        Related guides
      </h3>
      <p className="text-gray-700 mb-4">
        New to tech influencer marketing? The complete guide covers every step, from finding and vetting creators to contracts, payment, measurement, and disclosure rules.
      </p>
      <Link
        href="/blog/tech-influencers-complete-guide"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        Tech Influencers: The Complete Guide (2026)
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
