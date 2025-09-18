'use client'
import React, { useState, useEffect } from 'react';
import { Check, X, Search, Zap, Crown, Shield, CreditCard, Clock } from 'lucide-react';

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
        { name: '10 searches per month', included: true },
        { name: '5 results per search', included: true },
        { name: 'Basic influencer data', included: true },
        { name: 'Platform filters', included: true },
        { name: 'Save favorites', included: true },
        { name: 'Advanced filters', included: false },
        { name: 'Export functionality', included: false },
        { name: 'Unlimited results', included: false },
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
        { name: '30 searches Per Month', included: true },
        { name: 'Unlimited results per search', included: true },
        { name: 'Complete influencer profiles', included: true },
        { name: 'All platform filters', included: true },
        { name: 'Save unlimited favorites', included: true },
        { name: 'Advanced filters', included: true },
        { name: 'Export to CSV/Excel', included: true },
        { name: 'Email support', included: true },
        { name: 'Contact information access', included: true }
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
        { name: 'Unlimited Searches', included: true },
        { name: 'Unlimited Results', included: true },
        { name: 'Complete influencer database', included: true },
        { name: 'Advanced analytics dashboard', included: true },
        { name: 'Export to CSV/Excel', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced Filters', included: true },
        { name: 'Email Support', included: true },
        { name: 'Contact Information Access', included: true },
        { name: 'Direct Consultation', included: true }
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
      gray: { bg: 'bg-white/10', text: 'text-black' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
      green: { bg: 'bg-green-500/10', text: 'text-green-600' }
    };
    return colorMap[color][type];
  };

  const getButtonClasses = (color: Plan['color'], isActive: boolean) => {
    if (isActive) {
      return 'bg-white/20 text-black/50 cursor-not-allowed backdrop-blur-xl';
    }
    
    const colorMap = {
      gray: 'bg-black hover:bg-black/80 text-white backdrop-blur-xl transition-all duration-300',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white backdrop-blur-xl transition-all duration-300 shadow-xl',
      green: 'bg-green-600 hover:bg-green-700 text-white backdrop-blur-xl transition-all duration-300 shadow-xl'
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-black mb-8 max-w-3xl mx-auto">
            Access 1,800+ verified Pakistani influencers. From individual creators to enterprise agencies, 
            we have the perfect plan for your needs.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/20">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-green-600 text-white shadow-xl'
                    : 'text-black hover:text-green-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                  billingCycle === 'yearly'
                    ? 'bg-green-600 text-white shadow-xl'
                    : 'text-black hover:text-green-600'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Method Notice */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-12 max-w-4xl mx-auto shadow-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 mt-1" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-black mb-2">Secure Bank Transfer Payment</h3>
              <p className="text-black/80 mb-3">
                We use secure bank transfers for payments. After selecting your plan, you'll get our bank details 
                and can transfer via any Pakistani bank, mobile banking app, or ATM.
              </p>
              <div className="flex items-center space-x-6 text-sm text-black/70">
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
                className={`relative bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20 ${
                  plan.popular ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-green-600 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8 pt-12">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${getColorClasses(plan.color, 'bg')} backdrop-blur-xl border border-white/20`}>
                      <IconComponent className={`w-8 h-8 ${getColorClasses(plan.color, 'text')}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                    <p className="text-black/70 mt-2">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-black">
                        PKR {price.toLocaleString()}
                      </span>
                      <span className="text-black/70 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        Save PKR {((plan.price.monthly * 12) - plan.price.yearly).toLocaleString()} per year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-black/30 mr-3 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included ? 'text-black' : 'text-black/40'
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
                    className={`w-full py-3 px-6 rounded-2xl font-medium ${getButtonClasses(plan.color, isActive)}`}
                  >
                    {isLoading ? 'Creating Order...' : 
                     isActive ? 'Current Plan' : plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods Accepted */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-16 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-4">Payment Methods Accepted</h2>
            <p className="text-black/70 max-w-2xl mx-auto">
              Transfer money easily using any of these Pakistani payment methods
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/20">
                <span className="text-green-600 text-xl">🏦</span>
              </div>
              <h3 className="font-semibold text-black mb-1">Internet Banking</h3>
              <p className="text-sm text-black/70">HBL, UBL, MCB, ABL and all major banks</p>
            </div>
            
            <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/20">
                <span className="text-blue-600 text-xl">📱</span>
              </div>
              <h3 className="font-semibold text-black mb-1">Mobile Banking</h3>
              <p className="text-sm text-black/70">HBL Mobile, UBL Digital, MCB Smart</p>
            </div>
            
            <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/20">
                <span className="text-green-600 text-xl">🏧</span>
              </div>
              <h3 className="font-semibold text-black mb-1">ATM Transfer</h3>
              <p className="text-sm text-black/70">Any ATM with fund transfer facility</p>
            </div>
            
            <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/20">
                <span className="text-blue-600 text-xl">🏢</span>
              </div>
              <h3 className="font-semibold text-black mb-1">Branch Transfer</h3>
              <p className="text-sm text-black/70">Visit any bank branch for transfer</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-16 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-4">How It Works</h2>
            <p className="text-black/70">Simple 3-step process to upgrade your account</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-black mb-2">Select Plan</h3>
              <p className="text-black/70 text-sm">
                Choose your preferred plan and billing cycle. You'll get our bank account details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-black mb-2">Transfer Money</h3>
              <p className="text-black/70 text-sm">
                Transfer the amount using your preferred method and upload payment proof.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-black mb-2">Get Activated</h3>
              <p className="text-black/70 text-sm">
                We verify your payment and activate your subscription within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-8">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">How long does payment verification take?</h3>
              <p className="text-black/80">
                We verify payments within 24 hours during business days. Your subscription will be activated 
                automatically once payment is confirmed.
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">What payment methods do you accept?</h3>
              <p className="text-black/80">
                We accept bank transfers from all major Pakistani banks via internet banking, mobile banking, 
                ATM transfers, or branch visits.
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">Is my payment information secure?</h3>
              <p className="text-black/80">
                Yes! We use bank-to-bank transfers which are completely secure. We never store or see your 
                banking credentials - all transactions are handled by your bank.
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">Can I get a refund?</h3>
              <p className="text-black/80">
                We offer a 7-day money-back guarantee for new subscribers. Contact support for 
                refund requests within this period.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">What's included in each plan?</h3>
              <p className="text-black/80">
                Free includes basic search with limited results. Starter provides unlimited searches and exports. 
                Pro adds advanced analytics, campaign tracking, and dedicated support.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 text-left shadow-xl border border-white/20 hover:bg-white/30 transition-all duration-300">
              <h3 className="font-semibold text-black mb-2">Can I change plans later?</h3>
              <p className="text-black/80">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-center text-white shadow-2xl backdrop-blur-xl">
          <h2 className="text-3xl font-bold mb-4">Need Help with Payment?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Having trouble with bank transfer or need assistance? Our support team is here to help 
            you complete your payment and get started.
          </p>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="bg-white text-black px-8 py-3 rounded-2xl font-medium hover:bg-white/90 transition-all duration-300 shadow-xl"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;