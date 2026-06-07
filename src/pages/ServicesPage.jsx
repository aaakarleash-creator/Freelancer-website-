import React, { useState } from 'react';
import { Check, ArrowRight, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { SERVICES, COMPANY_INFO, formatPrice } from '../data/services';
import Button from '../components/Button';

export default function ServicesPage({ onNavigate }) {
  const [currency, setCurrency] = useState('INR');
  const [expandedService, setExpandedService] = useState(null);

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi! I\'m interested in your services. Can you tell me more?');
    window.open(`https://wa.me/919679090801?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:contact@aakarco.com?subject=Service Inquiry - AAKAR & CO.';
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-white mb-2">Services</h1>
            <p className="text-slate-400">
              Comprehensive digital solutions to grow your business. Trusted by 100+ clients across India & globally.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-dark-700 border border-dark-400 rounded-lg p-1">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                currency === 'INR'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="bg-dark-700 border border-dark-400 rounded-2xl p-6 hover:border-amber-500/30 transition-all cursor-pointer group"
            onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
          >
            {/* Service Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-4xl mb-2">{service.icon}</div>
                <h2 className="font-display text-xl font-bold text-white">{service.name}</h2>
                <p className="text-sm text-slate-400 mt-1">{service.shortDesc}</p>
              </div>
              <ArrowRight
                size={20}
                className={`text-amber-400 flex-shrink-0 transition-transform ${
                  expandedService === service.id ? 'rotate-90' : ''
                }`}
              />
            </div>

            {/* Plans - Compact View */}
            <div className="space-y-2 mb-4">
              {service.plans.slice(0, 2).map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{plan.name}</span>
                  <span className="text-amber-400 font-semibold">
                    {formatPrice(plan.priceInr, currency)}
                    {plan.monthlyInr && <span className="text-xs text-slate-400"> + {formatPrice(plan.monthlyInr, currency)}/mo</span>}
                    {plan.type === 'monthly' && <span className="text-xs text-slate-400">/mo</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded Content */}
            {expandedService === service.id && (
              <div className="border-t border-dark-500 pt-4 space-y-4">
                {/* All Plans */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">All Plans</h3>
                  <div className="space-y-2">
                    {service.plans.map((plan, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg transition-all ${
                          plan.highlighted
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-dark-600 border border-dark-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white text-sm">{plan.name}</p>
                              {plan.highlighted && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-amber-400 font-bold">
                              {formatPrice(plan.priceInr, currency)}
                            </p>
                            {(plan.monthlyInr || plan.type === 'monthly') && (
                              <p className="text-xs text-slate-400">
                                {plan.monthlyInr ? `+ ${formatPrice(plan.monthlyInr, currency)}/mo` : '/month'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add-ons */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Popular Add-ons</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.addOns.slice(0, 4).map((addon, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <Check size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-300">{addon.name}</p>
                          <p className="text-slate-500">
                            {typeof addon.priceInr === 'string'
                              ? addon.priceInr
                              : formatPrice(addon.priceInr, currency)}
                            {addon.type === 'monthly' && ' /mo'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp();
                  }}
                >
                  <MessageCircle size={16} />
                  Inquire Now
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
          <p className="text-slate-400 mb-6">
            Have questions about our services? Get in touch with our team. We're here to help you find the perfect solution.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-3 bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 px-6 py-3 rounded-xl font-medium transition-all"
            >
              <MessageCircle size={20} />
              WhatsApp: {COMPANY_INFO.whatsapp}
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-3 bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 px-6 py-3 rounded-xl font-medium transition-all"
            >
              <Mail size={20} />
              Email: {COMPANY_INFO.contact}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-amber-500/20 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-400">📍 Location: {COMPANY_INFO.location}</p>
              <p className="text-sm text-slate-400">Serving India & Globally</p>
            </div>
            <a
              href={COMPANY_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium text-sm"
            >
              Visit Website <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="text-center space-y-4">
        <p className="text-slate-500 text-sm">Connect with us on social media</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href={COMPANY_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-400 transition-colors">
            📸 Instagram (@aakarco.official)
          </a>
          <a href={COMPANY_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-400 transition-colors">
            𝕏 Twitter (@aaakarandco)
          </a>
        </div>
      </div>
    </div>
  );
}
