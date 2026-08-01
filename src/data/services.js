// AAKAR & CO. Services Data
// All pricing in INR (₹), conversion to USD at 1 USD = 86 INR

export const COMPANY_INFO = {
  name: 'AAKAR & CO.',
  tagline: 'Where Ideas Take Structure',
  location: 'Asansol, West Bengal, India',
  serves: 'India & Globally',
  contact: 'contact@aakarco.com',
  phone: '+91 96790 90801',
  whatsapp: '+91 96790 90801',
  socials: {
    facebook: '#',
    instagram: 'https://instagram.com/aakarco.official',
    linkedin: '#',
    twitter: 'https://twitter.com/aaakarandco',
  },
  website: 'https://aakarco.com',
};

export const SERVICES = [
  {
    id: 1,
    name: 'Website Development',
    shortDesc: 'Fast, SEO-optimized websites and landing pages built with modern tech — from portfolio sites to full e-commerce platforms.',
    icon: '🌐',
    plans: [
      {
        name: 'Starter Website',
        priceInr: 34999,
        priceUsd: 2497,
        highlighted: false,
        description: 'Perfect for small businesses and portfolios',
        features: ['5 Pages', 'Responsive Design', 'Contact Form', 'Basic SEO', 'SSL Included'],
      },
      {
        name: 'Business Website',
        priceInr: 44999,
        priceUsd: 5997,
        highlighted: true,
        description: 'Feature-rich website with analytics and CRM',
        features: ['8–10 Pages', 'WhatsApp Chat + Lead Capture', 'CMS Integration', 'On-page SEO', 'Google Analytics Setup'],
      },
      {
        name: 'E-Commerce Website',
        priceInr: 54999,
        priceUsd: 12997,
        highlighted: false,
        description: 'Full online store with payment integration',
        features: ['Product Catalog + Payment Gateway', 'Admin Dashboard', 'Order Tracking', 'SEO Optimization', 'Custom Features (Optional)'],
      },
    ],
    addOns: [
      { name: 'Blog/News Section', priceInr: 1499 },
      { name: 'Chatbot Integration', priceInr: 2499 },
      { name: 'CRM Integration', priceInr: 3999 },
      { name: 'Extra Pages (per 2)', priceInr: 999 },
      { name: 'Priority Support', priceInr: 1499, type: 'monthly' },
    ],
  },
  {
    id: 2,
    name: 'AI Automation Tools & Setup',
    shortDesc: 'Smart automation workflows to scale your business',
    icon: '🤖',
    plans: [
      {
        name: 'Smart Starter',
        priceInr: 18999,
        priceUsd: 597,
        priceUsdPeriod: '/month',
        highlighted: false,
        description: 'Basic automation workflows for small teams',
        features: ['Automation Audit', 'Basic AI Chatbot', 'WhatsApp API Setup', '1 Platform Configured', '14 Days Support'],
      },
      {
        name: 'Growth Automator',
        priceInr: 39999,
        priceUsd: 1497,
        priceUsdPeriod: '/month',
        monthlyInr: 8000,
        highlighted: false,
        description: 'Advanced automation with monthly support',
        features: ['Full Process Audit', 'AI Chatbot (Trained)', 'Multi-step Workflows', '2 Platforms Configured', '30 Days Support'],
      },
      {
        name: 'AI Command Center',
        priceInr: 74999,
        priceUsd: 2997,
        priceUsdPeriod: '/month',
        monthlyInr: 14999,
        highlighted: true,
        description: 'Enterprise-level AI automation platform',
        features: ['Architecture Design', 'AI Sales Agent', 'AI Support Bot', 'Real-time Analytics', 'Dedicated Manager'],
      },
    ],
    addOns: [
      { name: 'Additional Workflows', priceInr: '3,000–6,000' },
      { name: 'Monthly Monitoring', priceInr: 4000, type: 'monthly' },
      { name: 'WhatsApp Broadcast', priceInr: '3,500+' },
      { name: 'AI Content Generation', priceInr: '6,000+' },
      { name: 'Custom Dashboard', priceInr: '7,000+' },
    ],
  },
  {
    id: 3,
    name: 'App Development',
    shortDesc: 'Robust, scalable, feature-rich mobile apps — Android and iOS, from idea to launch.',
    icon: '📱',
    plans: [
      {
        name: 'Basic App',
        priceInr: 29999,
        priceUsd: 7997,
        highlighted: false,
        description: 'Simple app with core features',
        features: ['Android APK, 5 Screens', 'Flutter/Native, WhatsApp Integration', 'Basic UI/UX', '10–14 Day Delivery'],
      },
      {
        name: 'Business App',
        priceInr: 59999,
        priceUsd: 18997,
        highlighted: true,
        description: 'Advanced app with backend and integrations',
        features: ['Android + iOS Hybrid, Firebase', 'User Authentication, API Integration', 'Push Notifications', '20–30 Day Delivery'],
      },
      {
        name: 'E-Commerce App',
        priceInr: 89999,
        priceUsd: 39997,
        highlighted: false,
        description: 'Full-featured marketplace or shopping app',
        features: ['Android + iOS, Payment Gateway', 'Razorpay/Stripe, Inventory System', 'Admin Panel', '30–45 Day Delivery'],
      },
    ],
    addOns: [
      { name: 'App Store Publishing', priceInr: '3,000–10,000' },
      { name: 'App Maintenance', priceInr: 5000, type: 'monthly' },
      { name: 'Advanced UI Design', priceInr: '10,000+' },
      { name: 'Custom Backend Development', priceInr: '15,000+' },
      { name: 'API Integration', priceInr: '5,000+' },
    ],
  },
  {
    id: 4,
    name: 'Branding & Growth Optimization',
    shortDesc: 'From logo to full brand ecosystem — built for clarity, consistency, and scale.',
    icon: '✨',
    plans: [
      {
        name: 'Brand Identity Kit',
        priceInr: 6999,
        priceUsd: 2997,
        highlighted: false,
        description: 'Logo, colors, and brand guidelines',
        features: ['Logo Concepts, Color Palette', 'Typography Guide, Social Templates', 'Brand Messaging Framework', '5–7 Day Delivery'],
      },
      {
        name: 'Advanced Identity & Strategy',
        priceInr: 12999,
        priceUsd: 7497,
        highlighted: false,
        description: 'Complete branding with market strategy',
        features: ['1:1 Strategy Call', 'Competitor Analysis, UVP Definition', 'Growth Roadmap, Funnel Audit', 'Ongoing Email Support'],
      },
      {
        name: 'Full Brand Development',
        priceInr: 21999,
        priceUsd: 14997,
        highlighted: true,
        description: 'Comprehensive branding with all assets',
        features: ['Complete Identity System', 'Funnel Planning & Optimization', 'Multi-Platform Strategy', '10–15 Day Delivery'],
      },
    ],
    addOns: [
      { name: 'Logo Animation', priceInr: '3,000–8,000' },
      { name: 'Brand Video Production', priceInr: '5,000+' },
      { name: 'Social Media Setup', priceInr: '5,000+' },
      { name: 'Packaging Design', priceInr: '8,000+' },
      { name: 'Website Design', priceInr: '15,000+' },
    ],
  },
  {
    id: 5,
    name: 'Digital Marketing — SEO + Ads',
    shortDesc: 'Drive traffic, leads, and conversions — combines SEO, paid ads, and analytics to maximize online visibility and business growth.',
    icon: '📊',
    plans: [
      {
        name: 'Starter Plan',
        priceInr: 11499,
        priceUsd: 1497,
        type: 'monthly',
        highlighted: false,
        description: 'Basic SEO and limited ad campaigns',
        features: ['Keyword Research (10–20)', 'On-page SEO Optimization', 'Technical Audit', 'Monthly Rank Tracking'],
      },
      {
        name: 'Growth Plan',
        priceInr: 16499,
        priceUsd: 2997,
        type: 'monthly',
        highlighted: true,
        description: 'Advanced SEO with multi-channel ads',
        features: ['Google Ads + Meta Ads', 'Bid Optimization', 'CRO Recommendations', 'Weekly Performance Reports'],
      },
      {
        name: 'Business Pro',
        priceInr: 24999,
        priceUsd: 5497,
        type: 'monthly',
        highlighted: false,
        description: 'Premium marketing with dedicated account manager',
        features: ['SEO + Google + Meta Ads', 'Full-Funnel Marketing', 'Pixel Setup & Retargeting', 'Dedicated Account Manager'],
      },
    ],
    addOns: [
      { name: 'Advanced SEO', priceInr: '10,000+', type: 'monthly' },
      { name: 'Conversion Tracking Setup', priceInr: 5000 },
      { name: 'Ad Budget Management', priceInr: 'Custom' },
      { name: 'Landing Page Design', priceInr: '8,000–15,000' },
      { name: 'Marketing Automation', priceInr: '8,000+', type: 'monthly' },
    ],
  },
  {
    id: 6,
    name: 'Influencer Marketing',
    shortDesc: 'Collaborate with trusted creators — connect with the right influencers, plan effective campaigns, and track ROI.',
    icon: '👥',
    plans: [
      {
        name: 'Starter Collab',
        priceInr: 14999,
        priceUsd: 997,
        highlighted: false,
        description: 'Micro-influencer collaboration',
        features: ['2–3 Micro-Influencers (5K–50K)', 'Instagram Reels + Stories', 'Hashtag & CTA Strategy', 'Basic Tracking'],
      },
      {
        name: 'Growth Collab',
        priceInr: 29999,
        priceUsd: 2497,
        highlighted: false,
        description: 'Multiple influencers with content creation',
        features: ['5–6 Influencers (10K–150K)', 'Multi-Platform Posting', 'Engagement Tracking', '1 Strategy Call Included'],
      },
      {
        name: 'Brand Scale Pack',
        priceInr: 44999,
        priceUsd: 5997,
        highlighted: true,
        description: 'Comprehensive influencer campaign',
        features: ['Micro + Mid-Tier Mix', 'Advanced Influencer Vetting', 'UTM Tracking & Monitoring', 'Dedicated Account Manager'],
      },
    ],
    addOns: [
      { name: 'Giveaway Setup', priceInr: '3,000–8,000' },
      { name: 'Paid Boosting', priceInr: '5,000+' },
      { name: 'Affiliate Tracking Setup', priceInr: '5,000+' },
      { name: 'Campaign Landing Page', priceInr: '8,000+' },
      { name: 'Video Shoot & Production', priceInr: '10,000+' },
    ],
  },
  {
    id: 7,
    name: 'Sales Optimization',
    shortDesc: 'Turn traffic into revenue — refine customer journey, improve conversion rates, and maximize ROI via CRO strategies and data-driven funnel optimization.',
    icon: '💰',
    plans: [
      {
        name: 'Lead Booster',
        priceInr: 11999,
        priceUsd: 797,
        highlighted: false,
        description: 'Lead generation and qualification',
        features: ['Landing Page Audit', 'Trust Signals & CTA Optimization', 'Form Simplification', 'A/B Testing & Analytics'],
      },
      {
        name: 'Conversion Master',
        priceInr: 19999,
        priceUsd: 1497,
        highlighted: true,
        description: 'Complete conversion funnel optimization',
        features: ['End-to-end Funnel Audit', 'Customer Journey Mapping', 'Drop-off Analysis', 'Strategy Consultation'],
      },
      {
        name: 'Revenue Accelerator',
        priceInr: 17999,
        priceUsd: 2997,
        highlighted: false,
        description: 'Advanced revenue optimization strategies',
        features: ['CRM Setup & Integration', 'Automated Workflows', 'Lead Tracking & Nurturing', 'Email/SMS Automation'],
      },
    ],
    addOns: [
      { name: 'Advanced Funnel Building', priceInr: '25,000+' },
      { name: 'Paid Ads Funnel', priceInr: '10,000+' },
      { name: 'WhatsApp Automation', priceInr: '6,000+' },
      { name: 'Advanced Email Sequences', priceInr: '5,000+' },
      { name: 'Monthly CRO Monitoring', priceInr: 3999, type: 'monthly' },
    ],
  },
  {
    id: 8,
    name: 'Social Media Management',
    shortDesc: 'Manage and optimize social media presence — content planning, post scheduling, and engagement across platforms.',
    icon: '📱',
    plans: [
      {
        name: 'Basic Plan',
        priceInr: 7999,
        priceUsd: 997,
        type: 'monthly',
        highlighted: false,
        description: 'Content posting and basic engagement',
        features: ['3 Posts/Week', 'Instagram + Facebook', 'Caption + Hashtags', 'Monthly Report'],
      },
      {
        name: 'Standard Plan',
        priceInr: 14999,
        priceUsd: 1997,
        type: 'monthly',
        highlighted: true,
        description: 'Content creation with growth strategy',
        features: ['5 Posts/Week', '3 Platforms (Insta, FB, LinkedIn)', 'Story + Post Design', 'Performance Tracking'],
      },
      {
        name: 'Premium Plan',
        priceInr: 22999,
        priceUsd: 3497,
        type: 'monthly',
        highlighted: false,
        description: 'Full management with video content',
        features: ['Daily Content', 'Strategy + Scheduling', 'Reels + Story Creative', 'Audience Growth Report'],
      },
    ],
    addOns: [
      { name: 'Influencer Outreach', priceInr: 2999 },
      { name: 'Paid Ads Boost', priceInr: 1999 },
      { name: 'Content Calendar', priceInr: 999, type: 'monthly' },
      { name: 'Engagement Reports', priceInr: 499, type: 'monthly' },
      { name: 'Profile Revamp', priceInr: 1499, type: 'one-time' },
    ],
  },
];

export const convertToUSD = (inr) => {
  if (typeof inr === 'string') return inr; // Return custom prices as-is
  return Math.round(inr / 86);
};

export const formatPrice = (price, currency = 'INR') => {
  if (typeof price === 'string') return price;
  const symbol = currency === 'USD' ? '$' : '₹';
  const amount = currency === 'USD' ? convertToUSD(price) : price;
  return `${symbol}${amount.toLocaleString()}`;
};

export const formatRawUsdPrice = (priceUsd) => {
  if (typeof priceUsd === 'string') return priceUsd;
  return `$${priceUsd.toLocaleString()}`;
};

export const getPlanPrice = (plan, currency = 'INR') => {
  if (currency === 'USD' && plan.priceUsd != null) {
    const formatted = formatRawUsdPrice(plan.priceUsd);
    return plan.priceUsdPeriod ? `${formatted}${plan.priceUsdPeriod}` : formatted;
  }
  return formatPrice(plan.priceInr, currency);
};

export const getPlanMonthlyPrice = (plan, currency = 'INR') => {
  if (plan.monthlyInr == null) return null;
  if (currency === 'USD') {
    if (plan.monthlyUsd != null) return formatRawUsdPrice(plan.monthlyUsd);
    if (plan.priceUsd != null) return null;
  }
  return formatPrice(plan.monthlyInr, currency);
};
