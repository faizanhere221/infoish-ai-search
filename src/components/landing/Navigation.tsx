'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Sparkles } from 'lucide-react'

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-gray-200/20 border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Infoishai</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link href="/creators" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Find Creators</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">How It Works</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</Link>
            <Link href="#for-creators" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">For Creators</Link>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors">Log in</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all">
              Get Started Free
            </Link>
          </div>

          <button 
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-xl">
          <div className="space-y-1">
            <Link href="/creators" className="block py-3 px-4 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Find Creators</Link>
            <Link href="#how-it-works" className="block py-3 px-4 text-gray-700 font-medium rounded-xl hover:bg-gray-50">How It Works</Link>
            <Link href="#pricing" className="block py-3 px-4 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Pricing</Link>
            <Link href="#for-creators" className="block py-3 px-4 text-gray-700 font-medium rounded-xl hover:bg-gray-50">For Creators</Link>
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link href="/login" className="block w-full py-3 text-center text-gray-700 font-medium rounded-xl hover:bg-gray-50">Log in</Link>
              <Link href="/signup" className="block w-full py-3 text-center bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold">Get Started Free</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}