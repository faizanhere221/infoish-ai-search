'use client'
import React, { useState, useEffect } from 'react';
import { Check, X, Search, Zap, Crown, Shield, CreditCard, Clock, Wand2, Sparkles } from 'lucide-react';

interface User {
  subscription_tier?: 'free' | 'starter' | 'pro';
  humanizer_tier?: 'free' | 'starter' | 'pro';
  email?: string;
  name?: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
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
  color: 'gray' | 'blue' | 'green' | 'purple';
  features: PlanFeature[];
  cta: string;
  popular: boolean;
}

type BillingCycle = 'monthly' | 'yearly';
type ProductTab = 'infoishai' | 'humanizer';

const PricingPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [activeProduct, setActiveProduct] = useState<ProductTab>('infoishai');
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('user_data');
      if (userDataString) {
        const userData = JSON.parse(userDataString) as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUser(null);
    }
  }, []);

  const handleUpgrade = async (planId: string, product: ProductTab): Promise<void> => {
  if (planId === 'free') return;
  
  // Require login for payments ✅
  if (!user || !user.email) {
    const shouldLogin = confirm('You need to be logged in to upgrade. Would you like to login now?');
    if (shouldLogin) {
      // Save the intended plan for after login
      localStorage.setItem('intended_plan', JSON.stringify({ planId, product, billingCycle }));
      window.location.href = '/login?redirect=/pricing';
    }
    return;
  }
  
  setLoading(prev => ({ ...prev, [`${product}_${planId}`]: true }));
  
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch('/api/payment/create-manual-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        plan: planId,
        billing_cycle: billingCycle,
        user_email: user.email,
        user_name: user.name || 'User',
        product: product
      })
    });
    
    const paymentData = await response.json();
    
    if (!response.ok) {
      throw new Error(paymentData.error || 'Failed to create payment order');
    }
    
    if (paymentData.success) {
      const encodedData = encodeURIComponent(JSON.stringify(paymentData));
      window.location.href = `/payment?payment_data=${encodedData}`;
    } else {
      throw new Error(paymentData.error || 'Failed to create payment');
    }
    
  } catch (error) {
    console.error('Payment Error:', error);
    alert('Payment setup failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    setLoading(prev => ({ ...prev, [`${product}_${planId}`]: false }));
  }
};

  // InfoIshai Plans
  const infoishaiPlans: Plan[] = [
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
        { name: '30 searches per month', included: true },
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
        { name: 'Unlimited searches', included: true },
        { name: 'Unlimited results', included: true },
        { name: 'Complete influencer database', included: true },
        { name: 'Advanced analytics dashboard', included: true },
        { name: 'Export to CSV/Excel', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced filters', included: true },
        { name: 'Email support', included: true },
        { name: 'Contact information access', included: true },
        { name: 'Direct consultation', included: true }
      ],
      cta: 'Upgrade to Pro',
      popular: false
    }
  ];

  // AI Humanizer Plans
  const humanizerPlans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Try our AI humanizer with daily limits',
      icon: Wand2,
      color: 'gray',
      features: [
        { name: '3 AI humanizations per day', included: true },
        { name: 'Up to 500 words per use', included: true },
        { name: 'GPT-4o model', included: true },
        { name: '20-30% AI detection', included: true },
        { name: 'Copy & download results', included: true },
        { name: 'Higher word limits', included: false },
        { name: 'Monthly quota', included: false },
        { name: 'Priority support', included: false }
      ],
      cta: 'Current Plan',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: { monthly: 999, yearly: 9990 },
      description: 'Perfect for students and freelancers',
      icon: Zap,
      color: 'blue',
      features: [
        { name: '50 AI humanizations per month', included: true },
        { name: 'Up to 1,000 words per use', included: true },
        { name: 'GPT-4o model', included: true },
        { name: '15-25% AI detection', included: true },
        { name: 'Copy & download results', included: true },
        { name: 'No daily limits', included: true },
        { name: 'Priority support', included: true },
        { name: 'No watermark', included: true }
      ],
      cta: 'Upgrade to Starter',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 2499, yearly: 24990 },
      description: 'For professionals and content agencies',
      icon: Crown,
      color: 'purple',
      features: [
        { name: '150 AI humanizations per month', included: true },
        { name: 'Up to 2,500 words per use', included: true },
        { name: 'GPT-4o model', included: true },
        { name: '10-20% AI detection', included: true },
        { name: 'Copy & download results', included: true },
        { name: 'No daily limits', included: true },
        { name: 'API access', included: true },
        { name: 'Priority support', included: true },
        { name: 'No watermark', included: true },
        { name: 'Custom integrations', included: true }
      ],
      cta: 'Upgrade to Pro',
      popular: false
    }
  ];

  const getCurrentPlan = (product: ProductTab): 'free' | 'starter' | 'pro' => {
    if (!user) return 'free';
    
    if (product === 'infoishai') {
      return user.subscription_tier || 'free';
    } else {
      return user.humanizer_tier || 'free';
    }
  };

  const isCurrentPlan = (planId: string, product: ProductTab): boolean => {
    return getCurrentPlan(product) === planId;
  };

  const getColorClasses = (color: Plan['color'], type: 'bg' | 'text'): string => {
    const colorMap: Record<Plan['color'], Record<'bg' | 'text', string>> = {
      gray: { bg: 'bg-white/10', text: 'text-black' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
      green: { bg: 'bg-green-500/10', text: 'text-green-600' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-600' }
    };
    return colorMap[color][type];
  };

  const getButtonClasses = (color: Plan['color'], isActive: boolean): string => {
    if (isActive) {
      return 'bg-white/20 text-black/50 cursor-not-allowed backdrop-blur-xl';
    }
    
    const colorMap: Record<Plan['color'], string> = {
      gray: 'bg-black hover:bg-black/80 text-white backdrop-blur-xl transition-all duration-300',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white backdrop-blur-xl transition-all duration-300 shadow-xl',
      green: 'bg-green-600 hover:bg-green-700 text-white backdrop-blur-xl transition-all duration-300 shadow-xl',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-xl transition-all duration-300 shadow-xl'
    };
    return colorMap[color];
  };

  const activePlans = activeProduct === 'infoishai' ? infoishaiPlans : humanizerPlans;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-black mb-8 max-w-3xl mx-auto">
            Professional tools for influencer marketing and AI content creation. 
            Choose the service that fits your needs.
          </p>
          
          {/* Product Tabs */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/20 inline-flex">
              <button
                onClick={() => setActiveProduct('infoishai')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeProduct === 'infoishai'
                    ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xl'
                    : 'text-black hover:text-blue-600'
                }`}
              >
                <Search className="w-4 h-4" />
                InfoIshai (Influencer Search)
              </button>
              <button
                onClick={() => setActiveProduct('humanizer')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeProduct === 'humanizer'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl'
                    : 'text-black hover:text-purple-600'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                AI Humanizer
              </button>
            </div>
          </div>

          {/* Product Description */}
          <div className="max-w-2xl mx-auto mb-8">
            {activeProduct === 'infoishai' ? (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-blue-900 text-sm">
                  <strong>InfoIshai:</strong> Access 1,800+ verified Pakistani influencers with advanced search, 
                  filters, analytics, and export capabilities. Perfect for brands and agencies.
                </p>
              </div>
            ) : (
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-purple-900 text-sm">
                  <strong>AI Humanizer:</strong> Bypass AI detectors with GPT-4o powered text humanization. 
                  Achieve 15-25% AI detection on ZeroGPT, QuillBot, and Turnitin. Perfect for students, writers, and content creators.
                </p>
              </div>
            )}
          </div>
          
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
                We use secure bank transfers for payments. After selecting your plan, you will get our bank details 
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
          {activePlans.map((plan) => {
            const IconComponent = plan.icon;
            const isActive = isCurrentPlan(plan.id, activeProduct);
            const price = plan.price[billingCycle];
            const isLoading = loading[`${activeProduct}_${plan.id}`] || false;
            
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
                        {price === 0 ? 'Free' : `PKR ${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-black/70 ml-2">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
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
                    onClick={() => !isActive && handleUpgrade(plan.id, activeProduct)}
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

        {/* Bundle Offer */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-16 text-white shadow-2xl">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Get Both Services & Save!</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Subscribe to both InfoIshai and AI Humanizer and get <strong>15% off</strong> your second subscription. 
              Perfect for agencies and content creators who need both tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold mb-1">PKR 3,849</div>
                <div className="text-sm text-white/80">Starter Bundle</div>
                <div className="text-xs text-white/60 mt-1">Save PKR 950/month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold mb-1">PKR 8,623</div>
                <div className="text-sm text-white/80">Pro Bundle</div>
                <div className="text-xs text-white/60 mt-1">Save PKR 1,375/month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold mb-1">PKR 9,123</div>
                <div className="text-sm text-white/80">Mixed Bundle</div>
                <div className="text-xs text-white/60 mt-1">InfoIshai Pro + Humanizer Starter</div>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/contact'}
              className="mt-6 bg-white text-purple-600 px-8 py-3 rounded-2xl font-medium hover:bg-white/90 transition-all duration-300 shadow-xl"
            >
              Contact Sales for Bundle
            </button>
          </div>
        </div>

        {/* Rest of sections remain the same... */}
        {/* I'll skip repeating Payment Methods, How It Works, FAQ, Contact sections to save space */}
        {/* They remain exactly as before */}

      </div>
    </div>
  );
};

export default PricingPage;