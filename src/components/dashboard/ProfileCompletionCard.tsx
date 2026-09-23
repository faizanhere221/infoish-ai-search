import Link from 'next/link'
import { Check, Circle } from 'lucide-react'
import type { ProfileCompletionResult } from '@/lib/profile-completion'

interface ProfileCompletionCardProps {
  completion: ProfileCompletionResult
}

export default function ProfileCompletionCard({ completion }: ProfileCompletionCardProps) {
  const { percentage, items } = completion

  if (percentage === 100) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-emerald-900">Your profile is complete!</p>
          <p className="text-sm text-emerald-700">Brands can now find and evaluate you with confidence.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
        <span className="text-sm font-semibold text-violet-600">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            {item.isComplete ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-medium ${item.isComplete ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {item.label}
                </span>
                {!item.isComplete && (
                  <Link href={item.link} className="text-xs font-medium text-violet-600 hover:text-violet-700 flex-shrink-0">
                    Complete
                  </Link>
                )}
              </div>
              {!item.isComplete && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
