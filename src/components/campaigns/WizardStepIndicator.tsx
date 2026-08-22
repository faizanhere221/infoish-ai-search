'use client'

import { Check } from 'lucide-react'

interface WizardStepIndicatorProps {
  steps: string[]
  currentStep: number // 1-indexed
}

export default function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
        </span>
        <span className="text-sm text-gray-400">{Math.round(((currentStep - 1) / steps.length) * 100)}% complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step dots (desktop) */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((label, i) => {
          const stepNum = i + 1
          const isComplete = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <div key={label} className="flex-1 flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  isComplete
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : isCurrent
                    ? 'border-violet-600 text-violet-600 bg-violet-50'
                    : 'border-gray-200 text-gray-400 bg-white'
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isCurrent ? 'text-violet-700 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
