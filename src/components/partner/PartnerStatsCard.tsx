import type { LucideIcon } from 'lucide-react'

interface PartnerStatsCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtext?: string
  color?: 'violet' | 'blue' | 'emerald' | 'amber'
}

const COLOR_CLASSES: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
}

/** Matches the StatCard pattern used on /dashboard/creator and /dashboard/brand. */
export default function PartnerStatsCard({ icon: Icon, label, value, subtext, color = 'violet' }: PartnerStatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_CLASSES[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
    </div>
  )
}
