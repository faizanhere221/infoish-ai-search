import Link from 'next/link'
import { Circle, ArrowRight } from 'lucide-react'
import type { ProfileCompleteness } from '@/lib/profile-completion'

interface ProfileCompletionCardProps {
  completeness: ProfileCompleteness
  // Optional intro line, e.g. why the share badge is locked.
  note?: string
}

// Checklist of what's missing from a creator's profile. Renders nothing once
// every item (required and recommended) is done.
export default function ProfileCompletionCard({ completeness, note }: ProfileCompletionCardProps) {
  const { percentage, missing, isFullyComplete } = completeness
  if (isFullyComplete) {return null}

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Your profile is {percentage}% complete</h3>
        <span className="text-sm font-semibold text-violet-600">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {note && <p className="text-sm text-gray-600 mb-4">{note}</p>}

      <ul className="space-y-3">
        {missing.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                  {item.required && (
                    <span className="ml-2 px-1.5 py-0.5 bg-violet-50 text-violet-700 text-[11px] font-semibold rounded">
                      Required
                    </span>
                  )}
                </span>
                <Link
                  href={item.link}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 flex-shrink-0"
                >
                  Fix it
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
