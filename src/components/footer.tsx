'use client'
import Link from 'next/link'
import { MapPin, Mail, Phone, Twitter, Linkedin, Instagram, Youtube, MessageCircle } from 'lucide-react'
import { useState } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setSubscriptionStatus('Please enter your email')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setSubscriptionStatus('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setSubscriptionStatus('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'footer'
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubscriptionStatus('Successfully subscribed! Thank you for joining our newsletter.')
        setEmail('')
      } else {
        setSubscriptionStatus(result.message || 'You are already subscribed!')
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setSubscriptionStatus(''), 5000)
      
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setSubscriptionStatus('Something went wrong. Please try again.')
      
      // Clear error after 5 seconds
      setTimeout(() => setSubscriptionStatus(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🇵🇰</span>
              </div>
              <span className="font-bold text-xl text-white">
                Pakistani Influencer Search
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Pakistan's leading AI-powered platform to discover and connect with top influencers and content creators. Find the perfect match for your brand in seconds.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-sm">Multan, Pakistan</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-green-500" />
                <a href="mailto:infoishfounder@gmail.com" className="text-sm hover:text-green-400 transition-colors">
                  infoishfounder@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-500" />
                <a href="tel:+923228837325" className="text-sm hover:text-green-400 transition-colors">
                  +92 322 8837325
                </a>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-6">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/search" className="text-gray-400 hover:text-green-400 transition-colors">
                  AI Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-green-400 transition-colors">
                  Pricing
                </Link>
              </li>
             
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-6">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-green-400 transition-colors">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href="/featured" className="text-gray-400 hover:text-green-400 transition-colors">
                  Featured Influencers
                </Link>
              </li>
              <li>
                <Link href="/blog/complete-guide-influencer-marketing-pakistan-2025" className="text-gray-400 hover:text-green-400 transition-colors">
                  Marketing Guide
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-green-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-green-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-green-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-green-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup - Updated with API Integration */}
        <div className="border-t border-gray-800 mt-12 pt-12">
          <div className="max-w-2xl">
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Get the latest insights on Pakistani influencer marketing trends, new features, and success stories.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {subscriptionStatus && (
                <div className={`text-sm p-3 rounded-lg ${
                  subscriptionStatus.includes('Successfully') 
                    ? 'text-green-400 bg-green-900/20 border border-green-700' 
                    : subscriptionStatus.includes('already subscribed')
                    ? 'text-blue-400 bg-blue-900/20 border border-blue-700'
                    : 'text-red-400 bg-red-900/20 border border-red-700'
                }`}>
                  {subscriptionStatus}
                </div>
              )}
            </form>
            
            {/* Newsletter Stats */}
            <div className="mt-4 text-xs text-gray-500">
              Join hundreds of marketers getting weekly insights. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} Pakistani Influencer Search. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Made with ❤️ in Pakistan for brands and creators
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400 hidden sm:block">Follow us:</span>
              <div className="flex gap-4">
                <a 
                  href="https://linkedin.com/company/pakistani-influencer-search" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Follow us on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/infoishai" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://youtube.com/@kakayrao" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Subscribe to our YouTube channel"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="text-center lg:text-right">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>1,800+ Influencers</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Active Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}