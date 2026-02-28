'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  Users, 
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

type UserType = 'creator' | 'brand' | null

export default function SignupPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<UserType>(null)

  const handleContinue = () => {
    if (selectedType === 'creator') {
      router.push('/signup/creator')
    } else if (selectedType === 'brand') {
      router.push('/signup/brand')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Infoishai</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Join Infoishai</h1>
            <p className="text-gray-500 mt-2">How would you like to use the platform?</p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Creator Option */}
            <button
              onClick={() => setSelectedType('creator')}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'creator'
                  ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedType === 'creator' && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-violet-500 fill-violet-500" />
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selectedType === 'creator' ? 'bg-violet-500' : 'bg-violet-100'
              }`}>
                <Users className={`w-7 h-7 ${
                  selectedType === 'creator' ? 'text-white' : 'text-violet-600'
                }`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I'm a Creator
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Monetize your content by collaborating with tech brands
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Get discovered by brands
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Secure payment protection
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Showcase your portfolio
                </li>
              </ul>
            </button>

            {/* Brand Option */}
            <button
              onClick={() => setSelectedType('brand')}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'brand'
                  ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedType === 'brand' && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500" />
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selectedType === 'brand' ? 'bg-blue-500' : 'bg-blue-100'
              }`}>
                <Building2 className={`w-7 h-7 ${
                  selectedType === 'brand' ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I'm a Brand
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Find and hire tech creators for your marketing campaigns
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Access verified creators
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Escrow payment protection
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Manage all campaigns
                </li>
              </ul>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}