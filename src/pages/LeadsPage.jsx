import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserLeads, updateLeadStatus, deleteLead } from '../utils/leadService';
import { processLeadConversion } from '../utils/earningsService';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select } from '../components/Input';

// SUPABASE: Run this SQL first: ALTER TABLE leads ADD COLUMN IF NOT EXISTS note text;

// Available services
const services = [
  'Web Development', 'Mobile App', 'UI/UX Design',
  'SEO & Marketing', 'Branding', 'Social Media', 'Content Writing',
];

// ============================================================
// LeadsPage — lead management with Supabase integration
// ============================================================

const emptyForm = {
  client_name: '',
  phone: '',
  service: services[0] || '',
  status: 'pending',
  note: '',
  dealAmount: ''
};

export default function LeadsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionLead, setConversionLead] = useState(null);
  const [dealAmount, setDealAmount] = useState('');
  const [convertingLead, setConvertingLead] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Fetch user's leads on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map snake_case DB columns to camelCase for existing JSX
        setLeads(data.map(l => ({
          ...l,
          clientName: l.client_name,
          date: new Date(l.created_at).toLocaleDateString('en-IN'),
        })));
      } else if (error) {
        console.error('Failed to fetch leads:', error);
      }
      setLoading(false);
    };
    if (currentUser?.id) fetchLeads();
  }, [currentUser?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.phone || !form.service) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.status === 'Converted' && (!form.dealAmount || parseFloat(form.dealAmount) <= 0)) {
      setError('Please enter the deal value for a converted lead');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const leadData = {
        client_name: form.client_name,
        phone:       form.phone,
        service:     form.service,
        status:      form.status,
        note:        form.note || '',
      };

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({ ...leadData, user_id: currentUser.id })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // If this is a converted lead with deal amount, process earnings
      if (form.status === 'Converted' && form.dealAmount && parseFloat(form.dealAmount) > 0) {
        const { commission, rate, error: earnError } =
          await processLeadConversion(newLead.id, currentUser.id, parseFloat(form.dealAmount));

        if (earnError) {
          throw new Error(`Failed to process earnings: ${earnError}`);
        }

        setSuccessMessage(`🎉 Lead converted! ₹${commission} commission (${rate}%) added to your earnings.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }

      setLeads(prev => [newLead, ...prev]);
      setForm(emptyForm);
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
    // If converting to "Converted", show modal for deal amount
    if (newStatus === 'Converted') {
      const lead = leads.find(l => l.id === leadId);
      setConversionLead(lead);
      setDealAmount('');
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

  // Handle lead conversion with deal amount
  const handleConvertLead = async () => {
    if (!dealAmount || parseFloat(dealAmount) <= 0) {
      setError('Deal amount must be greater than 0');
      return;
    }

    setConvertingLead(true);
    setError('');

    try {
      const { commission, rate, error: err } = await processLeadConversion(
        conversionLead.id,
        currentUser.id,
        parseFloat(dealAmount)
      );

      if (err) {
        throw new Error(`Failed to convert lead: ${err}`);
      }

      // Update lead in state
      setLeads(prev =>
        prev.map(lead =>
          lead.id === conversionLead.id ? { ...lead, status: 'Converted' } : lead
        )
      );

      // Show success toast
      showToast(`🎉 Lead converted! ₹${Math.round(commission).toLocaleString('en-IN')} commission (${rate}%) added to your earnings.`, 'success');

      // Close modal
      setShowConversionModal(false);
      setConversionLead(null);
      setDealAmount('');
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
  const filtered = leads.filter(lead => {
    const matchSearch = 
      lead.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.service && lead.service.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'All' || lead.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Count by status
  const statusCounts = {
    All: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    'follow-up': leads.filter(l => l.status === 'follow-up').length,
    Converted: leads.filter(l => l.status === 'Converted').length,
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
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 ml-auto text-sm font-medium"
          >
            Dismiss
          </button>
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
                      <p className="font-medium text-white">{lead.client_name}</p>
                      <p className="text-xs text-slate-500 sm:hidden mt-0.5">{lead.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={11} />
                        {lead.phone || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-300">{lead.service || '—'}</td>
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
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-dark-600 border border-dark-400 rounded-lg text-xs px-2 py-1 text-white focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="pending">Pending</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-center">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        Delete
                      </button>
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
            value={form.client_name}
            onChange={update('client_name')}
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
          <Select label="Service" value={form.service} onChange={update('service')}>
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={update('status')}>
            <option value="pending">Pending</option>
            <option value="follow-up">Follow-up</option>
            <option value="Converted">Converted</option>
          </Select>
          {form.status === 'Converted' && (
            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">
                Deal Value (₹) *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter deal value e.g. 15000"
                value={form.dealAmount || ''}
                onChange={e => setForm(f => ({ ...f, dealAmount: e.target.value }))}
                className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white px-4 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <p className="text-xs text-amber-400/70">
                Commission will be calculated automatically (10% or 15%)
              </p>
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
                <p className="text-sm text-slate-400 mt-1">{conversionLead.service}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Deal Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder="Enter deal value in ₹"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-dark-700 border border-dark-400 rounded-xl text-sm text-white placeholder-slate-600 px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-all"
                />
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
            <Button type="submit" className="flex-1 justify-center" disabled={convertingLead || !dealAmount || parseFloat(dealAmount) <= 0}>
              {convertingLead ? 'Converting…' : 'Confirm Conversion'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

