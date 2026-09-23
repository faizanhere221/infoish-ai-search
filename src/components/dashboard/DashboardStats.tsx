import { Eye, Users, type LucideIcon } from 'lucide-react'

interface DashboardStatsProps {
  profileViews: number
  totalFollowers: number
}

function formatNumber(num: number): string {
  if (num >= 1000000) {return (num / 1000000).toFixed(1) + 'M'}
  if (num >= 1000) {return (num / 1000).toFixed(1) + 'K'}
  return num.toString()
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: LucideIcon
  label: string
  value: string
  subtext: string
  color: 'violet' | 'blue'
}) {
  const colors = {
    violet: 'bg-violet-100 text-violet-600',
    blue: 'bg-blue-100 text-blue-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  )
}

export default function DashboardStats({ profileViews, totalFollowers }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <StatCard icon={Eye} label="Profile Views" value={formatNumber(profileViews)} subtext="All time" color="violet" />
      <StatCard icon={Users} label="Total Followers" value={formatNumber(totalFollowers)} subtext="Across all platforms" color="blue" />
    </div>
  )
}
