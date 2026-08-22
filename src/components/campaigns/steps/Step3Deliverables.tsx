'use client'

import { Plus } from 'lucide-react'
import DeliverableForm from '../DeliverableForm'
import type { CampaignFormData, DeliverableInput, WizardErrors } from '../CampaignWizard'

interface Step3DeliverablesProps {
  data: CampaignFormData
  errors: WizardErrors
  onChange: <K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) => void
}

function emptyDeliverable(): DeliverableInput {
  return {
    id: crypto.randomUUID(),
    platform: '',
    deliverable_type: '',
    quantity: '1',
    description: '',
  }
}

export default function Step3Deliverables({ data, errors, onChange }: Step3DeliverablesProps) {
  function addDeliverable() {
    onChange('deliverables', [...data.deliverables, emptyDeliverable()])
  }

  function updateDeliverable(id: string, field: keyof DeliverableInput, value: string) {
    onChange(
      'deliverables',
      data.deliverables.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  function removeDeliverable(id: string) {
    onChange('deliverables', data.deliverables.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      {errors.deliverables && (
        <p className="text-sm text-red-600">{errors.deliverables}</p>
      )}

      <div className="space-y-3">
        {data.deliverables.map((deliverable, i) => (
          <DeliverableForm
            key={deliverable.id}
            deliverable={deliverable}
            index={i}
            onChange={updateDeliverable}
            onRemove={removeDeliverable}
            canRemove={data.deliverables.length > 1}
            error={errors[`deliverable_${deliverable.id}`]}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addDeliverable}
        className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
      >
        <Plus className="w-4 h-4" />
        Add Deliverable
      </button>
    </div>
  )
}
