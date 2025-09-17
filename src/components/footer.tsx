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
    <footer className="bg-black text-white">
      {/* Newsletter Signup Section - Moved to top */}
      <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-bold text-white text-2xl mb-3">Stay Updated</h3>
            <p className="text-white/70 mb-8">
              Get the latest insights on Pakistani influencer marketing trends, new features, and success stories.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
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
                <div className={`text-sm p-4 rounded-xl max-w-md mx-auto ${
                  subscriptionStatus.includes('Successfully') 
                    ? 'text-green-400 bg-green-500/20 border border-green-500/30' 
                    : subscriptionStatus.includes('already subscribed')
                    ? 'text-blue-400 bg-blue-500/20 border border-blue-500/30'
                    : 'text-red-400 bg-red-500/20 border border-red-500/30'
                }`}>
                  {subscriptionStatus}
                </div>
              )}
            </form>
            
            {/* Newsletter Stats */}
            <div className="mt-6 text-sm text-white/50">
              Join hundreds of marketers getting weekly insights. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="font-bold text-xl text-white">
                Infoish
              </span>
            </div>
            <p className="text-white/70 mb-6 leading-relaxed">
              Pakistan's leading AI-powered platform to discover and connect with top influencers and content creators. Find the perfect match for your brand in seconds.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-500" />
                <span className="text-sm text-white/80">Multan, Pakistan</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <a href="mailto:infoishfounder@gmail.com" className="text-sm text-white/80 hover:text-green-400 transition-colors">
                  infoishfounder@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500" />
                <a href="tel:+923228837325" className="text-sm text-white/80 hover:text-green-400 transition-colors">
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
                <Link href="/search" className="text-white/70 hover:text-green-400 transition-colors">
                  AI Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/70 hover:text-green-400 transition-colors">
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
                <Link href="/blog" className="text-white/70 hover:text-green-400 transition-colors">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href="/featured" className="text-white/70 hover:text-green-400 transition-colors">
                  Featured Influencers
                </Link>
              </li>
              <li>
                <Link href="/blog/complete-guide-influencer-marketing-pakistan-2025" className="text-white/70 hover:text-green-400 transition-colors">
                  Marketing Guide
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-white/70 hover:text-green-400 transition-colors">
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
                <Link href="/about" className="text-white/70 hover:text-green-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-green-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-green-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-green-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-white/70 text-sm">
                © {currentYear} Infoish. All rights reserved.
              </p>
              <p className="text-white/50 text-xs mt-1">
                Made with ❤️ in Pakistan for brands and creators
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-white/70 hidden sm:block">Follow us:</span>
              <div className="flex gap-4">
                <a 
                  href="https://linkedin.com/company/pakistani-influencer-search" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-white/10"
                  aria-label="Follow us on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/infoishai" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-green-500 transition-colors p-2 rounded-lg hover:bg-white/10"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://youtube.com/@kakayrao" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-white/10"
                  aria-label="Subscribe to our YouTube channel"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="text-center lg:text-right">
              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>1,800+ Influencers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
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