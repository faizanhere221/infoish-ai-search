import { LucideIcon, TrendingUp } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subValue?: string
  icon: LucideIcon
  trend?: {
    value: number
    label?: string
  }
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
}

export default function StatsCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  color = 'blue' 
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 ${trend.value < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className="text-sm text-gray-500 mt-1">{subValue}</p>
      )}
    </div>
  )
}