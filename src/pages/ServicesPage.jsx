import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { SERVICES as LOCAL_SERVICES } from '../data/services';

// Helper functions outside component
const getServiceCategory = (serviceName) => {
  const categories = {
    'Website Development': 'Web Development',
    'AI Automation Tools & Setup': 'AI & Automation',
    'App Development': 'Mobile Development',
    'Branding & Growth Optimization': 'Branding',
    'Digital Marketing — SEO + Ads': 'Digital Marketing',
    'Influencer Marketing': 'Marketing',
    'Sales Optimization': 'Business Optimization',
    'Social Media Management': 'Social Media'
  };
  return categories[serviceName] || 'General';
};

const generateDetailedDescription = (service) => {
  const descriptions = {
    'Website Development': `Professional website development services tailored to your business needs. Our expert team creates responsive, high-performance websites that drive conversions and establish your online presence. We specialize in custom solutions ranging from simple landing pages to complex e-commerce platforms. Each website is built with modern technologies, optimized for search engines, and designed to provide exceptional user experiences across all devices. Our development process includes thorough testing, security implementation, and ongoing support to ensure your website performs at its best.`,
    'AI Automation Tools & Setup': `Transform your business operations with cutting-edge AI automation solutions. We design and implement intelligent workflows that streamline processes, reduce manual work, and increase efficiency. From basic automation for small teams to enterprise-level AI command centers, our solutions scale with your business. Our expertise includes chatbot integration, automated content generation, custom dashboards, and advanced monitoring systems. We help you leverage the power of artificial intelligence to stay competitive in today's fast-paced digital landscape.`,
    'App Development': `Custom mobile application development for iOS and Android platforms. Our experienced developers create user-friendly, feature-rich apps that meet your specific business requirements. Whether you need a simple utility app or a complex e-commerce platform, we deliver high-quality solutions with robust backend integration. Our development process includes careful planning, intuitive UI/UX design, thorough testing, and seamless deployment to app stores. We also provide ongoing maintenance and support to keep your app running smoothly.`,
    'Branding & Growth Optimization': `Build a powerful brand identity that resonates with your target audience. Our comprehensive branding services include logo design, color palette development, brand guidelines, and strategic positioning. We go beyond visual elements to create a cohesive brand story that differentiates you from competitors. Our approach combines market research, creative design, and strategic thinking to develop brands that leave lasting impressions. From basic identity kits to full brand development, we have solutions for businesses at every stage.`,
    'Digital Marketing — SEO + Ads': `Accelerate your online growth with our comprehensive digital marketing services. We specialize in search engine optimization (SEO) and paid advertising campaigns that drive targeted traffic to your website. Our data-driven approach includes keyword research, on-page optimization, content strategy, and performance tracking across multiple advertising platforms. We help you achieve measurable results through strategic campaigns that reach your ideal customers at the right time and place.`,
    'Influencer Marketing': `Amplify your brand reach through strategic influencer partnerships. We connect you with relevant influencers who align with your brand values and target audience. Our services include campaign planning, influencer selection, content coordination, and performance tracking. From micro-influencer collaborations to comprehensive brand campaigns, we create authentic partnerships that drive engagement and conversions. Our approach focuses on building long-term relationships that deliver sustained value for your brand.`,
    'Sales Optimization': `Maximize your revenue potential with our sales optimization services. We analyze your entire sales funnel to identify opportunities for improvement and implement strategies that increase conversion rates. Our expertise includes lead generation, funnel optimization, email marketing automation, and conversion rate optimization. We help you turn more prospects into customers through data-driven insights and proven methodologies. Our solutions are customized to your specific business goals and market conditions.`,
    'Social Media Management': `Enhance your social media presence with our comprehensive management services. We create engaging content, manage posting schedules, and foster community engagement across all major platforms. Our team develops tailored strategies that align with your brand voice and business objectives. From basic posting to full-scale management with video content creation, we have solutions for businesses of all sizes. We also provide detailed analytics and reporting to track performance and optimize strategies.`
  };
  return descriptions[service.name] || service.shortDesc || 'Professional services tailored to your business needs.';
};

const mapLocalServicesToBrochureFormat = (localServices) => {
  return localServices.map((service, index) => {
    const firstPlan = service.plans && service.plans.length > 0 ? service.plans[0] : null;
    
    return {
      id: service.id,
      name: service.name,
      category: getServiceCategory(service.name),
      price_inr: firstPlan ? firstPlan.priceInr : null,
      price_usd: firstPlan ? firstPlan.priceUsd : null,
      detailed_description: generateDetailedDescription(service),
      delivery_time: 'Custom timeline',
      features: service.plans ? service.plans.map(p => p.description) : []
    };
  });
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCategories, setOpenCategories] = useState({});
  const [openServices, setOpenServices] = useState({});

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const dataPromise = supabase
          .from('services')
          .select('*')
          .order('category');
        
        const result = await Promise.race([dataPromise, timeoutPromise]);
        
        // Handle timeout case
        if (result instanceof Error) {
          console.error('Services fetch timed out, using local services');
          throw result; // Will be caught by catch block
        }
        
        const { data, error } = result;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setServices(data);
        } else {
          // Fallback to local services data
          const mappedServices = mapLocalServicesToBrochureFormat(LOCAL_SERVICES);
          setServices(mappedServices);
        }
        
        // Set all categories to collapsed by default
        setOpenCategories((prev) => {
          const next = { ...prev };
          const servicesToUse = (data && data.length > 0) ? data : mapLocalServicesToBrochureFormat(LOCAL_SERVICES);
          servicesToUse.forEach((service) => {
            const category = service.category || 'General';
            if (typeof next[category] === 'undefined') {
              next[category] = false;
            }
          });
          return next;
        });
        
        // Set all services to collapsed by default
        setOpenServices((prev) => {
          const next = { ...prev };
          const servicesToUse = (data && data.length > 0) ? data : mapLocalServicesToBrochureFormat(LOCAL_SERVICES);
          servicesToUse.forEach((service) => {
            if (typeof next[service.id] === 'undefined') {
              next[service.id] = false;
            }
          });
          return next;
        });
      } catch (err) {
        console.error('Failed to fetch services:', err);
        // Fallback to local services data on error or timeout
        const mappedServices = mapLocalServicesToBrochureFormat(LOCAL_SERVICES);
        setServices(mappedServices);
        setError(''); // Clear error since we have fallback data
        
        // Set all categories to collapsed by default
        setOpenCategories((prev) => {
          const next = { ...prev };
          mappedServices.forEach((service) => {
            const category = service.category || 'General';
            if (typeof next[category] === 'undefined') {
              next[category] = false;
            }
          });
          return next;
        });
        
        // Set all services to collapsed by default
        setOpenServices((prev) => {
          const next = { ...prev };
          mappedServices.forEach((service) => {
            if (typeof next[service.id] === 'undefined') {
              next[service.id] = false;
            }
          });
          return next;
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const groupedServices = useMemo(() => {
    const grouped = services.reduce((acc, service) => {
      const category = service.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleService = (serviceId) => {
    setOpenServices((prev) => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-white">Services</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          Explore the professional service offerings available through Expert Arena. Each listing presents the value, scope, pricing, and delivery expectations in a clear, brochure-style format.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-dark-400 bg-dark-700/70 p-8 text-center text-sm text-slate-400">
          Loading services...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && groupedServices.length === 0 && (
        <div className="rounded-2xl border border-dark-400 bg-dark-700/70 p-8 text-center text-sm text-slate-400">
          No services are available right now.
        </div>
      )}

      <div className="space-y-4">
        {groupedServices.map(([category, items]) => {
          const isOpen = openCategories[category] ?? false;

          return (
            <section key={category} className="overflow-hidden rounded-2xl border border-dark-400 bg-dark-700/80">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-400">Service Category</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{category}</h2>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-dark-500 p-5 sm:p-6 space-y-4">
                  {items.map((service) => {
                    const isServiceOpen = openServices[service.id] ?? false;
                    
                    return (
                      <article key={service.id} className="rounded-2xl border border-dark-500 bg-dark-800/70 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className="w-full p-5 sm:p-6 text-left flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between hover:bg-dark-700/50 transition-colors"
                        >
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-bold text-white">{service.name}</h3>
                              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                                {service.category}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-300">
                              {service.price_inr ? `₹${service.price_inr.toLocaleString()}` : '—'}
                              {service.price_usd && ` (~$${service.price_usd.toLocaleString()})`}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="inline-flex items-center gap-2 rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-slate-300">
                              <span>⏱ {service.delivery_time || 'Custom timeline'}</span>
                            </div>
                            {isServiceOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </div>
                        </button>

                        {isServiceOpen && (
                          <div className="border-t border-dark-500 p-5 sm:p-6 space-y-5">
                            <div className="space-y-3 text-sm leading-7 text-slate-400 whitespace-pre-line">
                              {service.detailed_description || 'Detailed information will be shared with qualified leads.'}
                            </div>

                            {Array.isArray(service.features) && service.features.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Features</h4>
                                <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-300 list-disc">
                                  {service.features.map((feature, index) => (
                                    <li key={`${service.id}-${index}`}>{feature}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex flex-col gap-3 border-t border-dark-500 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-slate-500">Brochure-style service overview for qualified leads.</p>
                              <button
                                type="button"
                                title="Available when adding leads"
                                disabled
                                className="rounded-xl border border-dark-400 bg-dark-700 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed opacity-70"
                              >
                                Request This Service
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
