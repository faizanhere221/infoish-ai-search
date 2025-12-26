// src/lib/analytics.ts
// Google Analytics 4 Event Tracking for Infoishai

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = 'G-Y97NRDZSBB';

/**
 * Core tracking function - sends events to GA4
 */
export const track = (event: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, {
      ...params,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 [Analytics] Event: ${event}`, params);
  }
};

// ============================================================================
// AUTHENTICATION EVENTS
// ============================================================================

/**
 * Track successful signup/login
 */
export const trackSignupComplete = (method: 'google' | 'email' = 'google') => {
  track('signup_complete', {
    method,
    event_category: 'authentication',
    event_label: `Signup via ${method}`,
  });
};

/**
 * Track login
 */
export const trackLogin = (method: 'google' | 'email' = 'google') => {
  track('login', {
    method,
    event_category: 'authentication',
    event_label: `Login via ${method}`,
  });
};

/**
 * Track logout
 */
export const trackLogout = () => {
  track('logout', {
    event_category: 'authentication',
  });
};

// ============================================================================
// CONVERSION EVENTS (Mark as Key Events in GA4)
// ============================================================================

/**
 * Track trial started - CONVERSION EVENT
 */
export const trackTrialStarted = (plan: 'free' | 'starter' | 'pro' = 'free') => {
  track('trial_started', {
    plan,
    event_category: 'conversion',
    event_label: `Trial started - ${plan}`,
  });
};

/**
 * Track contact form submission - CONVERSION EVENT
 */
export const trackContactFormSubmit = (subject: string) => {
  track('contact_form_submit', {
    subject,
    event_category: 'conversion',
    event_label: `Contact form - ${subject}`,
  });
};

/**
 * Track pricing page view - CONVERSION EVENT
 */
export const trackViewPricing = (source?: string) => {
  track('view_pricing', {
    source: source || 'direct',
    event_category: 'conversion',
    event_label: 'Viewed pricing page',
  });
};

/**
 * Track plan selection/upgrade click - CONVERSION EVENT
 */
export const trackPlanSelected = (
  plan: 'starter' | 'pro',
  product: 'infoishai' | 'humanizer',
  billingCycle: 'monthly' | 'yearly',
  price: number
) => {
  track('plan_selected', {
    plan,
    product,
    billing_cycle: billingCycle,
    price,
    currency: 'PKR',
    event_category: 'conversion',
    event_label: `Selected ${plan} - ${product}`,
  });
};

/**
 * Track payment initiated - CONVERSION EVENT
 */
export const trackPaymentInitiated = (
  plan: string,
  product: string,
  amount: number
) => {
  track('payment_initiated', {
    plan,
    product,
    amount,
    currency: 'PKR',
    event_category: 'conversion',
    event_label: `Payment initiated - ${plan}`,
  });
};

/**
 * Track successful purchase - CONVERSION EVENT
 */
export const trackPurchase = (
  plan: string,
  product: string,
  amount: number,
  transactionId?: string
) => {
  track('purchase', {
    plan,
    product,
    value: amount,
    currency: 'PKR',
    transaction_id: transactionId,
    event_category: 'conversion',
    event_label: `Purchase - ${plan} ${product}`,
  });
};

// ============================================================================
// TOOL USAGE EVENTS
// ============================================================================

/**
 * Track AI Humanizer usage
 */
export const trackHumanizerUsage = (
  tier: 'free' | 'starter' | 'pro',
  wordCount: number,
  success: boolean
) => {
  track('humanizer_used', {
    tier,
    word_count: wordCount,
    success,
    event_category: 'tool_usage',
    event_label: `AI Humanizer - ${tier}`,
  });
};

/**
 * Track Hashtag Generator usage
 */
export const trackHashtagGeneratorUsage = (
  strategy: 'balanced' | 'popular' | 'niche',
  tagCount: number
) => {
  track('hashtag_generator_used', {
    strategy,
    tag_count: tagCount,
    event_category: 'tool_usage',
    event_label: `Hashtag Generator - ${strategy}`,
  });
};

/**
 * Track Profile Analyzer usage
 */
export const trackProfileAnalyzerUsage = (
  platform: 'instagram' | 'youtube' | 'tiktok',
  username: string
) => {
  track('profile_analyzer_used', {
    platform,
    username_analyzed: username.substring(0, 3) + '***', // Privacy: partial username
    event_category: 'tool_usage',
    event_label: `Profile Analyzer - ${platform}`,
  });
};

// ============================================================================
// SEARCH EVENTS
// ============================================================================

/**
 * Track influencer search
 */
export const trackSearch = (
  query: string,
  resultsCount: number,
  filters?: Record<string, any>
) => {
  track('search', {
    search_term: query,
    results_count: resultsCount,
    filters_applied: filters ? Object.keys(filters).length : 0,
    event_category: 'search',
    event_label: `Search: ${query.substring(0, 50)}`,
  });
};

/**
 * Track search with no results
 */
export const trackSearchNoResults = (query: string) => {
  track('search_no_results', {
    search_term: query,
    event_category: 'search',
    event_label: `No results: ${query}`,
  });
};

/**
 * Track influencer profile view
 */
export const trackInfluencerView = (
  influencerId: string,
  influencerName: string,
  platform: string
) => {
  track('influencer_view', {
    influencer_id: influencerId,
    influencer_name: influencerName,
    platform,
    event_category: 'engagement',
    event_label: `Viewed: ${influencerName}`,
  });
};

/**
 * Track influencer saved
 */
export const trackInfluencerSaved = (
  influencerId: string,
  influencerName: string
) => {
  track('influencer_saved', {
    influencer_id: influencerId,
    influencer_name: influencerName,
    event_category: 'engagement',
    event_label: `Saved: ${influencerName}`,
  });
};

/**
 * Track export action
 */
export const trackExport = (
  exportType: 'search_results' | 'saved_list',
  count: number,
  format: 'csv' | 'excel' = 'csv'
) => {
  track('export', {
    export_type: exportType,
    count,
    format,
    event_category: 'engagement',
    event_label: `Export ${exportType} - ${count} items`,
  });
};

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (
  ctaName: string,
  location: string,
  destination?: string
) => {
  track('cta_click', {
    cta_name: ctaName,
    location,
    destination,
    event_category: 'engagement',
    event_label: `CTA: ${ctaName} at ${location}`,
  });
};

/**
 * Track blog article read
 */
export const trackBlogRead = (articleSlug: string, articleTitle: string) => {
  track('blog_read', {
    article_slug: articleSlug,
    article_title: articleTitle,
    event_category: 'content',
    event_label: `Read: ${articleTitle}`,
  });
};

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track errors
 */
export const trackError = (
  errorType: string,
  errorMessage: string,
  location?: string
) => {
  track('error', {
    error_type: errorType,
    error_message: errorMessage,
    location,
    event_category: 'error',
    event_label: `Error: ${errorType}`,
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Track page view (for SPA navigation)
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    });
    console.log(`📊 [Analytics] Page View: ${pagePath}`);
  }
};

/**
 * Set user properties (for logged-in users)
 */
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
      ...properties,
    });
    console.log(`📊 [Analytics] User Properties Set:`, properties);
  }
};

/**
 * Identify user after login
 */
export const identifyUser = (
  userId: string,
  email: string,
  subscriptionTier: string
) => {
  setUserProperties(userId, {
    user_id: userId,
    subscription_tier: subscriptionTier,
  });
  
  track('user_identified', {
    subscription_tier: subscriptionTier,
    event_category: 'user',
  });
};