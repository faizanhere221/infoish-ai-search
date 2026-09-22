import { Users, UserCheck, Share2, DollarSign } from 'lucide-react'
import { formatCents } from '@/lib/referral'

interface PartnerStatsProps {
  totalPartners: number
  activePartners: number
  totalReferrals: number
  totalPaidCents: number
}

export default function PartnerStats({ totalPartners, activePartners, totalReferrals, totalPaidCents }: PartnerStatsProps) {
  const cards = [
    { icon: Users, label: 'Total Partners', value: totalPartners.toString(), color: 'bg-violet-100 text-violet-600' },
    { icon: UserCheck, label: 'Active Partners', value: activePartners.toString(), color: 'bg-emerald-100 text-emerald-600' },
    { icon: Share2, label: 'Total Referrals', value: totalReferrals.toString(), color: 'bg-blue-100 text-blue-600' },
    { icon: DollarSign, label: 'Total Paid Out', value: formatCents(totalPaidCents), color: 'bg-amber-100 text-amber-600' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <span className="text-xs text-gray-500">{card.label}</span>
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
