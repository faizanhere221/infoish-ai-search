import { Gift } from 'lucide-react'

interface ReferralBannerProps {
  partnerName: string
}

/** Small, subtle banner shown on the signup form when the visitor arrived via a referral link. */
export default function ReferralBanner({ partnerName }: ReferralBannerProps) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
        <Gift className="w-4 h-4 text-violet-600" />
      </div>
      <p className="text-sm text-violet-800">
        You were invited by <span className="font-semibold">{partnerName}</span>
      </p>
    </div>
  )
}
