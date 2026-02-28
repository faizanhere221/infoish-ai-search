'use client'

import Link from 'next/link'
import {
  Sparkles,
  HelpCircle,
  MessageSquare,
  Mail,
  FileText,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

const HELP_TOPICS = [
  {
    title: 'Getting Started',
    description: 'Learn how to set up your account and get started',
    icon: Sparkles,
    href: '#',
  },
  {
    title: 'Managing Deals',
    description: 'How to create, manage, and complete deals',
    icon: FileText,
    href: '#',
  },
  {
    title: 'Messaging',
    description: 'Communication tips and messaging features',
    icon: MessageSquare,
    href: '#',
  },
  {
    title: 'Payments & Billing',
    description: 'Payment methods, invoices, and payouts',
    icon: HelpCircle,
    href: '#',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Help Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {HELP_TOPICS.map((topic) => {
            const Icon = topic.icon
            return (
              <Link
                key={topic.title}
                href={topic.href}
                className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            )
          })}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold">Need more help?</h2>
          <p className="text-violet-100 mt-2">
            Our support team is here to help you with any questions or issues.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a
              href="mailto:support@infoishai.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg font-medium hover:bg-violet-50"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30"
            >
              <MessageSquare className="w-5 h-5" />
              Live Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}