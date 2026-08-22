'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type {
  CampaignObjective,
  CampaignCategory,
  Platform,
  DeliverableType,
  BudgetType,
} from '@/types/campaigns'
import WizardStepIndicator from './WizardStepIndicator'
import Step1Basics from './steps/Step1Basics'
import Step2Requirements from './steps/Step2Requirements'
import Step3Deliverables from './steps/Step3Deliverables'
import Step4Budget from './steps/Step4Budget'
import Step5Review from './steps/Step5Review'

export interface DeliverableInput {
  id: string
  platform: Platform | ''
  deliverable_type: DeliverableType | ''
  quantity: string
  description: string
}

export interface CampaignFormData {
  title: string
  description: string
  objective: CampaignObjective | ''
  category: CampaignCategory | ''
  platforms: Platform[]
  min_followers: string
  target_countries: string[]
  deliverables: DeliverableInput[]
  budget_type: BudgetType
  budget_fixed: string
  budget_min: string
  budget_max: string
  currency: string
  application_deadline: string
  campaign_start_date: string
  campaign_end_date: string
}

export type WizardErrors = Record<string, string>

export interface CampaignSubmitPayload {
  title: string
  description: string
  objective: CampaignObjective | null
  category: CampaignCategory | null
  budget_min: number | null
  budget_max: number | null
  budget_type: BudgetType
  currency: string
  platforms: Platform[]
  min_followers: number
  target_countries: string[]
  application_deadline: string | null
  campaign_start_date: string | null
  campaign_end_date: string | null
  visibility: 'public'
  deliverables: {
    platform: Platform
    deliverable_type: DeliverableType
    quantity: number
    description: string | null
  }[]
}

interface SubmitResult {
  success: boolean
  error?: string
}

interface CampaignWizardProps {
  onSaveDraft: (payload: CampaignSubmitPayload) => Promise<SubmitResult>
  onPublish: (payload: CampaignSubmitPayload) => Promise<SubmitResult>
  initialData?: CampaignFormData
  saveDraftLabel?: string
}

const STEP_LABELS = ['Basics', 'Requirements', 'Deliverables', 'Budget & Timeline', 'Review']

function initialFormData(): CampaignFormData {
  return {
    title: '',
    description: '',
    objective: '',
    category: '',
    platforms: [],
    min_followers: '',
    target_countries: [],
    deliverables: [
      { id: crypto.randomUUID(), platform: '', deliverable_type: '', quantity: '1', description: '' },
    ],
    budget_type: 'range',
    budget_fixed: '',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    application_deadline: '',
    campaign_start_date: '',
    campaign_end_date: '',
  }
}

function validateStep1(data: CampaignFormData): WizardErrors {
  const errors: WizardErrors = {}
  if (data.title.trim().length < 10) errors.title = 'Title must be at least 10 characters'
  if (data.description.trim().length < 10) errors.description = 'Description must be at least 10 characters'
  if (!data.objective) errors.objective = 'Objective is required'
  if (!data.category) errors.category = 'Category is required'
  return errors
}

function validateStep2(data: CampaignFormData): WizardErrors {
  const errors: WizardErrors = {}
  if (data.platforms.length === 0) errors.platforms = 'Select at least one platform'
  return errors
}

function validateStep3(data: CampaignFormData): WizardErrors {
  const errors: WizardErrors = {}
  if (data.deliverables.length === 0) {
    errors.deliverables = 'Add at least one deliverable'
    return errors
  }
  let hasIncomplete = false
  for (const d of data.deliverables) {
    if (!d.platform || !d.deliverable_type) {
      errors[`deliverable_${d.id}`] = 'Platform and type are required'
      hasIncomplete = true
    }
  }
  if (hasIncomplete) errors.deliverables = 'Fill in platform and type for every deliverable'
  return errors
}

function validateStep4(data: CampaignFormData): WizardErrors {
  const errors: WizardErrors = {}
  if (data.budget_type === 'fixed') {
    if (!data.budget_fixed || Number(data.budget_fixed) <= 0) errors.budget = 'Enter a budget amount'
  } else if (data.budget_type === 'range') {
    if (!data.budget_min || !data.budget_max) {
      errors.budget = 'Enter both a minimum and maximum budget'
    } else if (Number(data.budget_min) > Number(data.budget_max)) {
      errors.budget = 'Minimum budget cannot exceed maximum budget'
    }
  }
  if (!data.application_deadline) errors.application_deadline = 'Application deadline is required'
  if (
    data.campaign_start_date &&
    data.campaign_end_date &&
    data.campaign_end_date < data.campaign_start_date
  ) {
    errors.campaign_end_date = 'End date must be after the start date'
  }
  return errors
}

const VALIDATORS: Record<number, (data: CampaignFormData) => WizardErrors> = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
  4: validateStep4,
  5: () => ({}),
}

function buildPayload(data: CampaignFormData): CampaignSubmitPayload {
  let budget_min: number | null = null
  let budget_max: number | null = null
  if (data.budget_type === 'fixed' && data.budget_fixed) {
    budget_min = parseInt(data.budget_fixed, 10)
    budget_max = parseInt(data.budget_fixed, 10)
  } else if (data.budget_type === 'range') {
    budget_min = data.budget_min ? parseInt(data.budget_min, 10) : null
    budget_max = data.budget_max ? parseInt(data.budget_max, 10) : null
  }

  return {
    title: data.title.trim(),
    description: data.description.trim(),
    objective: data.objective || null,
    category: data.category || null,
    budget_min,
    budget_max,
    budget_type: data.budget_type,
    currency: data.currency,
    platforms: data.platforms,
    min_followers: data.min_followers ? parseInt(data.min_followers, 10) : 0,
    target_countries: data.target_countries,
    application_deadline: data.application_deadline || null,
    campaign_start_date: data.campaign_start_date || null,
    campaign_end_date: data.campaign_end_date || null,
    visibility: 'public',
    deliverables: data.deliverables
      .filter((d) => d.platform && d.deliverable_type)
      .map((d) => ({
        platform: d.platform as Platform,
        deliverable_type: d.deliverable_type as DeliverableType,
        quantity: d.quantity ? parseInt(d.quantity, 10) : 1,
        description: d.description.trim() || null,
      })),
  }
}

export default function CampaignWizard({
  onSaveDraft,
  onPublish,
  initialData,
  saveDraftLabel = 'Save as Draft',
}: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CampaignFormData>(() => initialData ?? initialFormData())
  const [errors, setErrors] = useState<WizardErrors>({})
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    const stepErrors = VALIDATORS[currentStep](formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length))
  }

  function handleBack() {
    setErrors({})
    setSubmitError(null)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  async function handleSaveDraft() {
    setSubmitError(null)
    setIsSavingDraft(true)
    const result = await onSaveDraft(buildPayload(formData))
    if (!result.success) setSubmitError(result.error || 'Failed to save draft')
    setIsSavingDraft(false)
  }

  async function handlePublish() {
    setSubmitError(null)
    setIsPublishing(true)
    const result = await onPublish(buildPayload(formData))
    if (!result.success) setSubmitError(result.error || 'Failed to publish campaign')
    setIsPublishing(false)
  }

  const isBusy = isSavingDraft || isPublishing

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <WizardStepIndicator steps={STEP_LABELS} currentStep={currentStep} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {currentStep === 1 && <Step1Basics data={formData} errors={errors} onChange={updateField} />}
        {currentStep === 2 && <Step2Requirements data={formData} errors={errors} onChange={updateField} />}
        {currentStep === 3 && <Step3Deliverables data={formData} errors={errors} onChange={updateField} />}
        {currentStep === 4 && <Step4Budget data={formData} errors={errors} onChange={updateField} />}
        {currentStep === 5 && <Step5Review data={formData} />}
      </div>

      {submitError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isBusy}
          className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < STEP_LABELS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
          >
            Next
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {isSavingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveDraftLabel}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isBusy}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
