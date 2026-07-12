import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, AlertCircle, MessageSquare, FileText, CheckCircle2, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateLeadStatus, deleteLead } from '../utils/leadService';
import { processLeadConversion } from '../utils/earningsService';
import { getLeads } from '../utils/supabaseQueryHelper'
import { supabase } from '../utils/supabaseClient';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select } from '../components/Input';
import { SERVICES as LOCAL_SERVICES, getPlanPrice } from '../data/services';

// SUPABASE: Run this SQL first: ALTER TABLE leads ADD COLUMN IF NOT EXISTS note text;

// ============================================================
// LeadsPage — lead management with Supabase integration
// ============================================================

const EMPTY_FORM = {
  clientName: '',
  phone: '',
  email: '',
  companyName: '',
  services: [],
  status: 'New',
  note: '',
  clientEmail: '',
  companyEmail: '',
  companyRegNo: '',
  gstNo: '',
  dealAmount: '',
  dealAmountUsd: '',
};

export default function LeadsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [services, setServices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionLead, setConversionLead] = useState(null);
  const [dealAmount, setDealAmount] = useState('');
  const [conversionForm, setConversionForm] = useState({
    clientEmail: '',
    companyEmail: '',
    companyRegNo: '',
    gstNo: '',
    companyName: ''
  });
  const [convertingLead, setConvertingLead] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const updateConversionForm = (k) => (e) => setConversionForm(f => ({ ...f, [k]: e.target.value }));

  const showConversionDetails = (lead) => {
    setSelectedConversion(lead);
    setConversionModalOpen(true);
  };

  // Fetch user's leads on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError('');

      if (!currentUser?.id) {
        setLeads([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: err } = await getLeads(currentUser.id);

        if (err) {
          console.error('Failed to fetch leads:', err);
          setError('Failed to load leads. Retrying...');
          showToast('Failed to load leads. Retrying...', 'error');
          setLeads([]);
        } else if (data) {
          setLeads(data.map((lead) => ({
            ...lead,
            clientName: lead.client_name,
            status: lead.status === 'pending' ? 'New' : lead.status,
            services: Array.isArray(lead.services) ? lead.services : (lead.services ? [lead.services] : []),
            date: new Date(lead.created_at).toLocaleDateString('en-IN'),
            // Use direct lead fields for verification status
            is_verified_by_admin: lead.is_verified_by_admin || false,
            verified_at: lead.verified_at || null
          })));
        } else {
          setLeads([]);
        }
      } catch (e) {
        console.error('Leads fetch error:', e);
        setError('Failed to load leads. Retrying...');
        showToast('Failed to load leads. Retrying...', 'error');
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, showToast, retryCount]);

  useEffect(() => {
    // Prefer local SERVICES for exact pricing and labels
    if (LOCAL_SERVICES && LOCAL_SERVICES.length > 0) {
      setServices(LOCAL_SERVICES);
      return;
    }

    const fetchServices = async () => {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = supabase
        .from('services')
        .select('id, name, price_inr, price_usd')
        .order('name');

      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Services fetch timed out, using local services');
        return; // Keep using LOCAL_SERVICES as fallback
      }
      
      const { data, error } = result;

      if (!error && data) {
        setServices(data);
      } else if (error) {
        console.error('Failed to fetch services:', error);
        // Keep using LOCAL_SERVICES as fallback
      }
    };

    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.clientName?.trim() || !form.phone?.trim() || form.services.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.status === 'Converted') {
      if (!form.dealAmount || parseFloat(form.dealAmount) <= 0) {
        setError('Please enter the deal value for a converted lead');
        return;
      }
      if (!form.clientEmail?.trim()) {
        setError('Please enter client email for converted lead');
        return;
      }
      if (!form.companyEmail?.trim()) {
        setError('Please enter company email for converted lead');
        return;
      }
      if (!form.companyRegNo?.trim()) {
        setError('Please enter company registration number for converted lead');
        return;
      }
      // GST No is optional, so no validation needed
    }

    setSubmitting(true);
    setError('');

    try {
      const serviceNames = form.services
        .map((id) => services.find((service) => service.id === id)?.name)
        .filter(Boolean);

      const leadData = {
        client_name: form.clientName,
        phone: form.phone,
        email: form.email || null,
        company_name: form.companyName || null,
        services: serviceNames,
        status: form.status,
        note: form.note || '',
        client_email: form.status === 'Converted' ? form.clientEmail || null : null,
        company_email: form.status === 'Converted' ? form.companyEmail || null : null,
        company_reg_no: form.status === 'Converted' ? form.companyRegNo || null : null,
        gst_no: form.status === 'Converted' ? form.gstNo || null : null,
        deal_amount: form.status === 'Converted' && form.dealAmount ? parseFloat(form.dealAmount) : null,
        deal_amount_usd: form.status === 'Converted' ? form.dealAmountUsd || null : null,
      };

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({ ...leadData, user_id: currentUser.id })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (form.status === 'Converted' && form.dealAmount && parseFloat(form.dealAmount) > 0) {
        const conversionDetails = {
          client_email: form.clientEmail,
          company_email: form.companyEmail,
          company_reg_no: form.companyRegNo,
          gst_no: form.gstNo,
          company_name: form.companyName
        };

        const { success, message, error: earnError } =
          await processLeadConversion(newLead.id, currentUser.id, parseFloat(form.dealAmount), conversionDetails);

        if (earnError) {
          throw new Error(`Failed to process lead conversion: ${earnError}`);
        }

        setSuccessMessage(message || 'Lead converted! Awaiting admin verification for earnings.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }

      setLeads((prev) => [{
        ...newLead,
        clientName: newLead.client_name,
        services: Array.isArray(newLead.services) ? newLead.services : (newLead.services ? [newLead.services] : []),
        status: newLead.status === 'pending' ? 'New' : newLead.status,
        date: new Date(newLead.created_at).toLocaleDateString('en-IN'),
      }, ...prev]);
      setForm({ ...EMPTY_FORM });
      setShowModal(false);
    } catch (error) {
      console.error('Error adding lead:', error);
      setError(error.message || 'Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (leadId, newStatus) => {
    // If converting to "Converted", show modal for conversion details
    if (newStatus === 'Converted') {
      const lead = leads.find(l => l.id === leadId);
      setConversionLead(lead);
      setDealAmount('');
      // Reset conversion form with existing lead data
      setConversionForm({
        clientEmail: lead.email || '',
        companyEmail: '',
        companyRegNo: '',
        gstNo: '',
        companyName: lead.company_name || ''
      });
      setShowConversionModal(true);
      return;
    }

    // Otherwise, update status directly
    const { error: err } = await updateLeadStatus(leadId, newStatus);

    if (err) {
      setError(`Failed to update lead: ${err}`);
      return;
    }

    // Update in state
    setLeads(prev => 
      prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
  };

  // Handle lead conversion with deal amount and details
  const handleConvertLead = async () => {
    // Validation
    if (!dealAmount || parseFloat(dealAmount) <= 0) {
      setError('Deal amount must be greater than 0');
      return;
    }
    if (!conversionForm.clientEmail?.trim()) {
      setError('Please enter client email for converted lead');
      return;
    }
    if (!conversionForm.companyEmail?.trim()) {
      setError('Please enter company email for converted lead');
      return;
    }
    if (!conversionForm.companyRegNo?.trim()) {
      setError('Please enter company registration number for converted lead');
      return;
    }

    setConvertingLead(true);
    setError('');

    try {
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      // Collect all conversion details from the form
      const conversionDetails = {
        client_email: conversionForm.clientEmail || null,
        company_email: conversionForm.companyEmail || null,
        company_reg_no: conversionForm.companyRegNo || null,
        gst_no: conversionForm.gstNo || null,
        company_name: conversionForm.companyName || null
      };

      const conversionPromise = processLeadConversion(
        conversionLead.id,
        currentUser.id,
        parseFloat(dealAmount),
        conversionDetails
      );

      const { message, error: err } = await Promise.race([conversionPromise, timeoutPromise]);

      if (err) {
        throw new Error(`Failed to convert lead: ${err}`);
      }

      // Update lead in state with conversion details
      setLeads(prev =>
        prev.map(lead =>
          lead.id === conversionLead.id ? { 
            ...lead, 
            status: 'Converted',
            deal_amount: parseFloat(dealAmount),
            deal_amount_usd: (parseFloat(dealAmount) / 83).toFixed(2),
            client_email: conversionForm.clientEmail,
            company_email: conversionForm.companyEmail,
            company_reg_no: conversionForm.companyRegNo,
            gst_no: conversionForm.gstNo,
            company_name: conversionForm.companyName
          } : lead
        )
      );

      // Show success toast
      showToast(`🎉 Lead converted! ${message}`, 'success');

      // Close modal and reset form
      setShowConversionModal(false);
      setConversionLead(null);
      setDealAmount('');
      setConversionForm({
        clientEmail: '',
        companyEmail: '',
        companyRegNo: '',
        gstNo: '',
        companyName: ''
      });
    } catch (error) {
      console.error('Error converting lead:', error);
      setError(error.message || 'Failed to convert lead');
    } finally {
      setConvertingLead(false);
    }
  };

  // Handle deleting a lead
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    const { error: err } = await deleteLead(leadId);

    if (err) {
      setError(`Failed to delete lead: ${err}`);
      return;
    }

    // Remove from state
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  // Filter leads
  const filtered = leads.filter((lead) => {
    const searchText = `${lead.clientName || ''} ${Array.isArray(lead.services) ? lead.services.join(' ') : (lead.services || '')}`.toLowerCase();
    const matchSearch = searchText.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || lead.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Count by status
  const statusCounts = {
    All: leads.length,
    New: leads.filter((lead) => lead.status === 'New').length,
    'follow-up': leads.filter((lead) => lead.status === 'follow-up').length,
    Converted: leads.filter((lead) => lead.status === 'Converted').length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Lead Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{leads.length} total leads in pipeline</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Lead</Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setRetryCount(prev => prev + 1)} variant="secondary">Retry Loading</Button>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search by client name or service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-700 border border-dark-400 rounded-xl text-sm text-white placeholder-slate-600 pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([s, count]) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`
                px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5
                ${filterStatus === s
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
                }
              `}
            >
              {s}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${filterStatus === s ? 'bg-amber-500/20' : 'bg-dark-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Service</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Notes</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600 text-sm">
                    {leads.length === 0 ? 'No leads yet. Create your first lead to get started!' : 'No leads match your filters'}
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-dark-600/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{lead.client_name || lead.clientName || '—'}</p>
                      <p className="text-xs text-slate-500 sm:hidden mt-0.5">{lead.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={11} />
                        {lead.phone || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-300">
                      {Array.isArray(lead.services) && lead.services.length > 0
                        ? lead.services.join(', ')
                        : (lead.service || '—')}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {lead.note ? (
                        <div className="group relative">
                          <button className="text-slate-400 hover:text-amber-400 transition-colors" title={lead.note}>
                            <MessageSquare size={16} />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap z-10 pointer-events-none">
                            {lead.note}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={lead.status === 'New' ? 'New' : lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-dark-600 border border-dark-400 rounded-lg text-xs px-2 py-1 text-white focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="New">New</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {lead.status === 'Converted' && (
                          <button
                            onClick={() => showConversionDetails(lead)}
                            className="text-xs px-2 py-1 text-amber-400 hover:bg-amber-500/10 rounded transition-colors flex items-center gap-1"
                          >
                            <FileText size={12} />
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Lead">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Client Name *"
            type="text"
            placeholder="TechCorp Solutions"
            value={form.clientName}
            onChange={update('clientName')}
            required
          />
          <Input
            label="Phone Number"
            icon={Phone}
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={update('phone')}
          />
          <Input
            label="Company Name"
            type="text"
            placeholder="AAKAR Co."
            value={form.companyName}
            onChange={update('companyName')}
          />
          <Input
            label="Freelancer Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={update('email')}
          />
          <div className="space-y-2">
            <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
              Services * (Select one or more)
            </label>
            <div className="space-y-2 rounded-xl border border-dark-400 bg-dark-700 p-3">
              {services.length === 0 ? (
                <p className="text-sm text-slate-500">No services available yet.</p>
              ) : (
                services.map((svc) => {
                  const checked = form.services.includes(svc.id);
                  return (
                    <label key={svc.id} className="flex cursor-pointer items-start gap-2 rounded-lg bg-dark-600/70 px-3 py-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, services: [...f.services, svc.id] }));
                          } else {
                            setForm((f) => ({ ...f, services: f.services.filter((id) => id !== svc.id) }));
                          }
                        }}
                        className="mt-1 h-4 w-4 rounded border-dark-400 bg-dark-600"
                      />
                      <span>
                        {svc.name} — {svc.plans && svc.plans.length > 0
                          ? `${getPlanPrice(svc.plans[0], 'INR')} (~${getPlanPrice(svc.plans[0], 'USD')})`
                          : (svc.priceInr ? `₹${svc.priceInr} (${svc.priceUsd ? `~$${svc.priceUsd}` : ''})` : svc.name)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {form.services.length === 0 && (
              <p className="text-xs text-amber-400">At least one service is required</p>
            )}
          </div>
          <Select label="Status" value={form.status} onChange={update('status')}>
            <option value="New">New</option>
            <option value="follow-up">Follow-up</option>
            <option value="Converted">Converted</option>
          </Select>
          
          {/* Debug: Show current status */}
          <div className="text-xs text-slate-500">Current status: {form.status}</div>
          
          {form.status === 'Converted' && (
            <div className="space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Conversion Details Required</p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                  Deal Amount (INR) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter deal value e.g. 15000"
                    value={form.dealAmount || ''}
                    onChange={(e) => {
                      const inrAmount = parseFloat(e.target.value);
                      setForm((f) => ({
                        ...f,
                        dealAmount: e.target.value,
                        dealAmountUsd: inrAmount ? (inrAmount / 83).toFixed(2) : '',
                      }));
                    }}
                    className="flex-1 bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                  <div className="flex-1 bg-dark-600 border border-dark-400 rounded-xl text-sm text-slate-400 px-4 py-2.5 flex items-center">
                    ${form.dealAmountUsd || '0'}
                  </div>
                </div>
                <p className="text-xs text-amber-400/80">USD auto-calculated at 1 USD = 83 INR</p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                  Client Email *
                </label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={form.clientEmail}
                  onChange={update('clientEmail')}
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                  Company Email *
                </label>
                <input
                  type="email"
                  placeholder="info@company.com"
                  value={form.companyEmail}
                  onChange={update('companyEmail')}
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                  Company Registration No *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CIN12345"
                  value={form.companyRegNo}
                  onChange={update('companyRegNo')}
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                  GST No (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18AAACR5055K1Z0"
                  value={form.gstNo}
                  onChange={update('gstNo')}
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</label>
            <textarea
              placeholder="Add any notes about this lead…"
              value={form.note}
              onChange={update('note')}
              rows="3"
              className="w-full bg-dark-700 border border-dark-400 rounded-xl text-sm text-white placeholder-slate-600 px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 justify-center" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Conversion Modal */}
      <Modal isOpen={showConversionModal} onClose={() => setShowConversionModal(false)} title="Convert Lead to Deal">
        <form onSubmit={(e) => { e.preventDefault(); handleConvertLead(); }} className="space-y-4">
          {conversionLead && (
            <>
              <div className="bg-dark-600/50 border border-dark-500 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Lead Details</p>
                <p className="text-white font-medium">{conversionLead.client_name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {Array.isArray(conversionLead.services) ? conversionLead.services.join(', ') : conversionLead.service}
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Conversion Details Required</p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Deal Amount (INR) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter deal value e.g. 15000"
                      value={dealAmount}
                      onChange={(e) => {
                        const inrAmount = parseFloat(e.target.value);
                        setDealAmount(e.target.value);
                      }}
                      className="flex-1 bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                    <div className="flex-1 bg-dark-600 border border-dark-400 rounded-xl text-sm text-slate-400 px-4 py-2.5 flex items-center">
                      ${dealAmount ? (parseFloat(dealAmount) / 83).toFixed(2) : '0'}
                    </div>
                  </div>
                  <p className="text-xs text-amber-400/80">USD auto-calculated at 1 USD = 83 INR</p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={conversionForm.clientEmail}
                    onChange={updateConversionForm('clientEmail')}
                    className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    value={conversionForm.companyEmail}
                    onChange={updateConversionForm('companyEmail')}
                    className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Company Registration No *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CIN12345"
                    value={conversionForm.companyRegNo}
                    onChange={updateConversionForm('companyRegNo')}
                    className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    GST No (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18AAACR5055K1Z0"
                    value={conversionForm.gstNo}
                    onChange={updateConversionForm('gstNo')}
                    className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Company name"
                    value={conversionForm.companyName}
                    onChange={updateConversionForm('companyName')}
                    className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>
              </div>

              {dealAmount && parseFloat(dealAmount) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Earning Preview</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Deal Amount:</span>
                      <span className="text-white font-medium">₹{parseFloat(dealAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Commission (10%):</span>
                      <span className="text-amber-400 font-medium">₹{(parseFloat(dealAmount) * 0.1).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setShowConversionModal(false)} disabled={convertingLead}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 justify-center" disabled={convertingLead || !dealAmount || parseFloat(dealAmount) <= 0 || !conversionForm.clientEmail || !conversionForm.companyEmail || !conversionForm.companyRegNo}>
              {convertingLead ? 'Converting…' : 'Confirm Conversion'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Conversion Details Modal */}
      {selectedConversion && conversionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConversionModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-dark-800 border border-dark-500 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white text-xl">Conversion Details</h2>
              <button onClick={() => setConversionModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Information Section */}
              <div className="border-t border-dark-500 pt-4">
                <h3 className="text-amber-400 font-semibold mb-4">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Client Name</p>
                    <p className="text-white mt-1">{selectedConversion.client_name || selectedConversion.clientName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Client Phone</p>
                    <p className="text-white mt-1">{selectedConversion.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Client Email</p>
                    <p className="text-white mt-1">{selectedConversion.client_email || selectedConversion.clientEmail || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Freelancer Email</p>
                    <p className="text-white mt-1">{selectedConversion.email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="border-t border-dark-500 pt-4">
                <h3 className="text-amber-400 font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Company Name</p>
                    <p className="text-white mt-1">{selectedConversion.company_name || selectedConversion.companyName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Company Email</p>
                    <p className="text-white mt-1">{selectedConversion.company_email || selectedConversion.companyEmail || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Company Reg No</p>
                    <p className="text-white mt-1">{selectedConversion.company_reg_no || selectedConversion.companyRegNo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">GST No</p>
                    <p className="text-white mt-1">{selectedConversion.gst_no || selectedConversion.gstNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Deal Information Section */}
              <div className="border-t border-dark-500 pt-4">
                <h3 className="text-amber-400 font-semibold mb-4">Deal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Deal Amount (INR)</p>
                    <p className="text-white font-mono text-lg mt-1">₹{(selectedConversion.deal_amount || selectedConversion.dealAmount)?.toLocaleString('en-IN') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Deal Amount (USD)</p>
                    <p className="text-white font-mono text-lg mt-1">${(selectedConversion.deal_amount_usd || selectedConversion.dealAmountUsd)?.toLocaleString('en-US') || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Services Selected</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Array.isArray(selectedConversion.services) ? selectedConversion.services : (selectedConversion.services ? [selectedConversion.services] : [])).map((svc, i) => (
                        <span key={i} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedConversion.note && (
                <div className="border-t border-dark-500 pt-4">
                  <h3 className="text-amber-400 font-semibold mb-2">Notes</h3>
                  <p className="text-slate-300 text-sm">{selectedConversion.note}</p>
                </div>
              )}

              {/* Action Buttons - Freelancer View */}
              {currentUser.role === 'freelancer' && !selectedConversion.is_verified_by_admin && (
                <div className="border-t border-dark-500 pt-4 flex gap-3">
                  <p className="text-yellow-400 text-sm">Awaiting admin verification...</p>
                </div>
              )}

              {/* Verification Status */}
              <div className="border-t border-dark-500 pt-4">
                <div className="flex items-center gap-2">
                  {selectedConversion.is_verified_by_admin ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-emerald-400 text-sm">Verified by Admin</span>
                      <span className="text-slate-600 text-xs ml-auto">
                        {selectedConversion.verified_at ? new Date(selectedConversion.verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} className="text-amber-400" />
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30 font-medium">
                        Awaiting Admin Verification
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

