'use client'
import React, { useState, useEffect } from 'react';
import { Check, X, Key, Search, Zap, Crown, Shield, Users, CreditCard, Clock } from 'lucide-react';

interface User {
  subscription_tier?: 'free' | 'starter' | 'pro';
  email?: string;
  name?: string;
  [key: string]: any;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanPrice {
  monthly: number;
  yearly: number;
}

interface Plan {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: PlanPrice;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'gray' | 'blue' | 'green';
  features: PlanFeature[];
  cta: string;
  popular: boolean;
}

type BillingCycle = 'monthly' | 'yearly';

const PricingPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    setUser(userData);
  }, []);

  const handleUpgrade = async (planId: string): Promise<void> => {
    if (planId === 'free') return;
    
    setLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Create manual payment order
      const response = await fetch('/api/payment/create-manual-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan: planId,
          billing_cycle: billingCycle,
          user_email: user?.email || '',
          user_name: user?.name || ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }
      
      const paymentData = await response.json();
      
      if (paymentData.success) {
        // Redirect to manual payment page with payment details
        const encodedData = encodeURIComponent(JSON.stringify(paymentData));
        window.location.href = `/payment?payment_data=${encodedData}`;
      } else {
        throw new Error(paymentData.error || 'Failed to create payment');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Payment setup failed: ' + errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out our platform',
      icon: Search,
      color: 'gray',
      features: [
        { name: '5 searches per month', included: true },
        { name: '5 results per search', included: true },
        { name: 'Basic influencer data', included: true },
        { name: 'Platform filters', included: true },
        { name: 'Save favorites', included: true },
        { name: 'Advanced filters', included: false },
        { name: 'Export functionality', included: false },
        { name: 'Unlimited results', included: false },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false }
      ],
      cta: 'Current Plan',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: { monthly: 2999, yearly: 29990 },
      description: 'Ideal for small agencies and growing brands',
      icon: Zap,
      color: 'blue',
      features: [
        { name: '50 searches per month', included: true },
        { name: 'Unlimited results per search', included: true },
        { name: 'Complete influencer profiles', included: true },
        { name: 'All platform filters', included: true },
        { name: 'Save unlimited favorites', included: true },
        { name: 'Advanced filters', included: true },
        { name: 'Export to CSV/Excel', included: true },
        { name: 'Email support', included: true },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false }
      ],
      cta: 'Upgrade to Starter',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 6999, yearly: 69990 },
      description: 'Complete solution for agencies and enterprises',
      icon: Crown,
      color: 'green',
      features: [
        { name: 'Unlimited searches', included: true },
        { name: 'Unlimited results', included: true },
        { name: 'Complete influencer database', included: true },
        { name: 'All filters and sorting', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Export in all formats', included: true },
        { name: 'API access', included: true },
        { name: '50,000 API requests/month', included: true },
        { name: 'Rate limit: 100 req/min', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom integrations', included: true }
      ],
      cta: 'Upgrade to Pro',
      popular: false
    }
  ];

  const getCurrentPlan = (): 'free' | 'starter' | 'pro' => {
    if (!user || !user.subscription_tier) return 'free';
    return user.subscription_tier;
  };

  const isCurrentPlan = (planId: string): boolean => {
    return getCurrentPlan() === planId;
  };

  const getColorClasses = (color: Plan['color'], type: 'bg' | 'text') => {
    const colorMap = {
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' }
    };
    return colorMap[color][type];
  };

  const getButtonClasses = (color: Plan['color'], isActive: boolean) => {
    if (isActive) {
      return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    }
    
    const colorMap = {
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white'
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Access 1,800+ verified Pakistani influencers. From individual creators to enterprise agencies, 
            we have the perfect plan for your needs.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingCycle === 'yearly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Method Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12 max-w-4xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 mt-1" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Secure Bank Transfer Payment</h3>
              <p className="text-blue-800 mb-3">
                We use secure bank transfers for payments. After selecting your plan, you'll get our bank details 
                and can transfer via any Pakistani bank, mobile banking app, or ATM.
              </p>
              <div className="flex items-center space-x-6 text-sm text-blue-700">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Activation within 24 hours</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>100% Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isActive = isCurrentPlan(plan.id);
            const price = plan.price[billingCycle];
            const isLoading = loading[plan.id] || false;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8 pt-12">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${getColorClasses(plan.color, 'bg')}`}>
                      <IconComponent className={`w-8 h-8 ${getColorClasses(plan.color, 'text')}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        PKR {price.toLocaleString()}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Save PKR {((plan.price.monthly * 12) - plan.price.yearly).toLocaleString()} per year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isActive && handleUpgrade(plan.id)}
                    disabled={isActive || isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${getButtonClasses(plan.color, isActive)}`}
                  >
                    {isLoading ? 'Creating Order...' : 
                     isActive ? 'Current Plan' : plan.cta}
                  </button>
                  
                  {plan.id === 'pro' && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Includes API access for developers
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods Accepted */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Methods Accepted</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transfer money easily using any of these Pakistani payment methods
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 text-xl">🏦</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Internet Banking</h3>
              <p className="text-sm text-gray-600">HBL, UBL, MCB, ABL and all major banks</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mobile Banking</h3>
              <p className="text-sm text-gray-600">HBL Mobile, UBL Digital, MCB Smart</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 text-xl">🏧</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">ATM Transfer</h3>
              <p className="text-sm text-gray-600">Any ATM with fund transfer facility</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-orange-600 text-xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Branch Transfer</h3>
              <p className="text-sm text-gray-600">Visit any bank branch for transfer</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Simple 3-step process to upgrade your account</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Select Plan</h3>
              <p className="text-gray-600 text-sm">
                Choose your preferred plan and billing cycle. You'll get our bank account details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transfer Money</h3>
              <p className="text-gray-600 text-sm">
                Transfer the amount using your preferred method and upload payment proof.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Activated</h3>
              <p className="text-gray-600 text-sm">
                We verify your payment and activate your subscription within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* API Information Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-8">
            <Key className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">API for Developers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Integrate our influencer database directly into your applications with our RESTful API.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1,800+ Influencers</h3>
              <p className="text-gray-600 text-sm">
                Access complete database of verified Pakistani content creators
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">100 Req/Min</h3>
              <p className="text-gray-600 text-sm">
                High-performance API with generous rate limits
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600 text-sm">
                Enterprise-grade security with 99.9% uptime SLA
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => window.location.href = '/docs'}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              View API Documentation
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 text-left shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">How long does payment verification take?</h3>
              <p className="text-gray-600">
                We verify payments within 24 hours during business days. Your subscription will be activated 
                automatically once payment is confirmed.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-left shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept bank transfers from all major Pakistani banks via internet banking, mobile banking, 
                ATM transfers, or branch visits.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-left shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is my payment information secure?</h3>
              <p className="text-gray-600">
                Yes! We use bank-to-bank transfers which are completely secure. We never store or see your 
                banking credentials - all transactions are handled by your bank.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-left shadow-sm">
              <h3 className="font-semibent text-gray-900 mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee for new subscribers. Contact support for 
                refund requests within this period.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Help with Payment?</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Having trouble with bank transfer or need assistance? Our support team is here to help 
            you complete your payment and get started.
          </p>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;