// src/app/contact/page.tsx

'use client'

import { useState } from 'react'
import Header from '@/components/header'
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle, Briefcase } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
        setIsSubmitting(false)
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false)
          setFormData({
            name: '',
            email: '',
            company: '',
            subject: 'general',
            message: ''
          })
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to submit form')
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      alert('Failed to submit form: ' + error.message)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isSearchPage={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Get in{' '}
            <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-black/70 max-w-3xl mx-auto">
            Have questions about our platform? Need help finding the right influencers? 
            Want to discuss enterprise solutions? We're here to help!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-black/10">
            <h2 className="text-2xl font-bold text-black mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Message Sent!</h3>
                <p className="text-black/70">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-black mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Your company name (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-black mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Questions</option>
                    <option value="enterprise">Enterprise Solutions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="feedback">Feedback & Suggestions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-black mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-black/10">
              <h3 className="text-xl font-bold text-black mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Email Us</h4>
                    <p className="text-black/80 mb-1">infoishfounder@gmail.com</p>
                    <p className="text-sm text-black/60">We typically respond within a day</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">WhatsApp</h4>
                    <p className="text-black/80 mb-1">+92-322-837325</p>
                    <p className="text-sm text-black/60">Quick support & questions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Types */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-black/10">
              <h3 className="text-xl font-bold text-black mb-6">How Can We Help?</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/20">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-semibold text-black">General Support</div>
                    <div className="text-sm text-black/70">Platform questions, account help</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-500/10 backdrop-blur-lg rounded-xl border border-green-500/20">
                  <Briefcase className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold text-black">Business Inquiries</div>
                    <div className="text-sm text-black/70">Enterprise plans, partnerships</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/20">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-semibold text-black">Technical Issues</div>
                    <div className="text-sm text-black/70">Bug reports, feature requests</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Frequently Asked Questions</h2>
            <p className="text-black/70">Quick answers to common questions</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-black/10">
              <h3 className="font-bold text-black mb-3">How quickly do you respond to inquiries?</h3>
              <p className="text-black/70">We typically respond to all inquiries within 4 hours during business hours, and within 24 hours on weekends.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-black/10">
              <h3 className="font-bold text-black mb-3">Do you offer phone support?</h3>
              <p className="text-black/70">Yes! Premium subscribers get priority phone support. Free users can reach us via email, WhatsApp, or our contact form.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-black/10">
              <h3 className="font-bold text-black mb-3">Can you help me choose the right influencers?</h3>
              <p className="text-black/70">Absolutely! Our team can provide personalized recommendations based on your brand, budget, and campaign goals.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-black/10">
              <h3 className="font-bold text-black mb-3">Do you offer custom enterprise solutions?</h3>
              <p className="text-black/70">Yes, we offer custom pricing and features for large businesses, agencies, and enterprises. Contact us to discuss your needs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}