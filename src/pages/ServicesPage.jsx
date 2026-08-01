import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SERVICES as LOCAL_SERVICES } from "../data/services";

// Helper functions outside component
const getServiceCategory = (serviceName) => {
  const categories = {
    "Website Development": "Website Development",
    "AI Automation Tools & Setup": "AI Automation Tools & Setup",
    "App Development": "App Development",
    "Branding & Growth Optimization": "Branding",
    "Digital Marketing — SEO + Ads": "Digital Marketing — SEO + Ads",
    "Influencer Marketing": "Influencer Marketing",
    "Sales Optimization": "Sales Optimization",
    "Social Media Management": "Social Media Management",
  };
  return categories[serviceName] || "General";
};

const mapLocalServicesToBrochureFormat = (localServices) => {
  const mappedServices = [];

  localServices.forEach((service) => {
    if (service.plans && service.plans.length > 0) {
      service.plans.forEach((plan, planIndex) => {
        mappedServices.push({
          id: `${service.id}-${planIndex}`,
          name: `${service.name} - ${plan.name}`,
          category: getServiceCategory(service.name),
          price_inr: plan.priceInr,
          price_usd: plan.priceUsd,
          monthly_inr: plan.monthlyInr,
          detailed_description: plan.description,
          delivery_time:
            plan.type === "monthly" ? "Monthly" : "Custom timeline",
          features: plan.features || [],
        });
      });
    }
  });

  return mappedServices;
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState({});
  const [openServices, setOpenServices] = useState({});

  useEffect(() => {
    // Always use local services data to ensure prices are from services.js
    const mappedServices = mapLocalServicesToBrochureFormat(LOCAL_SERVICES);
    setServices(mappedServices);

    // Set all categories to collapsed by default
    setOpenCategories((prev) => {
      const next = { ...prev };
      mappedServices.forEach((service) => {
        const category = service.category || "General";
        if (typeof next[category] === "undefined") {
          next[category] = false;
        }
      });
      return next;
    });

    // Set all services to collapsed by default
    setOpenServices((prev) => {
      const next = { ...prev };
      mappedServices.forEach((service) => {
        if (typeof next[service.id] === "undefined") {
          next[service.id] = false;
        }
      });
      return next;
    });

    setLoading(false);
  }, []);

  const groupedServices = useMemo(() => {
    const grouped = services.reduce((acc, service) => {
      const category = service.category || "General";
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
          Explore the professional service offerings available through Expert
          Arena. Each listing presents the value, scope, pricing, and delivery
          expectations in a clear, brochure-style format.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-dark-400 bg-dark-700/70 p-8 text-center text-sm text-slate-400">
          Loading services...
        </div>
      )}

      {!loading && groupedServices.length === 0 && (
        <div className="rounded-2xl border border-dark-400 bg-dark-700/70 p-8 text-center text-sm text-slate-400">
          No services are available right now.
        </div>
      )}

      <div className="space-y-4">
        {groupedServices.map(([category, items]) => {
          const isOpen = openCategories[category] ?? false;

          return (
            <section
              key={category}
              className="overflow-hidden rounded-2xl border border-dark-400 bg-dark-700/80"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-400">
                    Service Category
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {category}
                  </h2>
                </div>
                {isOpen ? (
                  <ChevronUp size={18} className="text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-dark-500 p-5 sm:p-6 space-y-4">
                  {items.map((service) => {
                    const isServiceOpen = openServices[service.id] ?? false;

                    return (
                      <article
                        key={service.id}
                        className="rounded-2xl border border-dark-500 bg-dark-800/70 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className="w-full p-5 sm:p-6 text-left flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between hover:bg-dark-700/50 transition-colors"
                        >
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-bold text-white">
                                {service.name}
                              </h3>
                              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                                {service.category}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-300">
                              {service.monthly_inr
                                ? `₹${service.price_inr.toLocaleString()} + ₹${service.monthly_inr.toLocaleString()}/mo`
                                : service.delivery_time === "Monthly"
                                  ? `₹${service.price_inr.toLocaleString()}/mo`
                                  : `₹${service.price_inr.toLocaleString()}`}
                              {service.price_usd &&
                                ` (~$${service.price_usd.toLocaleString()})`}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="inline-flex items-center gap-2 rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-slate-300">
                              <span>
                                ⏱ {service.delivery_time || "Custom timeline"}
                              </span>
                            </div>
                            {isServiceOpen ? (
                              <ChevronUp size={18} className="text-slate-400" />
                            ) : (
                              <ChevronDown
                                size={18}
                                className="text-slate-400"
                              />
                            )}
                          </div>
                        </button>

                        {isServiceOpen && (
                          <div className="border-t border-dark-500 p-5 sm:p-6 space-y-5">
                            <div className="space-y-3 text-sm leading-7 text-slate-400 whitespace-pre-line">
                              {service.detailed_description ||
                                "Detailed information will be shared with qualified leads."}
                            </div>

                            {Array.isArray(service.features) &&
                              service.features.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Features
                                  </h4>
                                  <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-300 list-disc">
                                    {service.features.map((feature, index) => (
                                      <li key={`${service.id}-${index}`}>
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            <div className="flex flex-col gap-3 border-t border-dark-500 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-slate-500">
                                Brochure-style service overview for qualified
                                leads.
                              </p>
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
