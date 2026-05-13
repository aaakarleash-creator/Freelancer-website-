import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addLead, getUserLeads, updateLeadStatus, deleteLead } from '../utils/leadService';
import { services } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select } from '../components/Input';

// ============================================================
// LeadsPage — lead management with Supabase integration
// ============================================================

const emptyForm = { 
  client_name: '', 
  phone: '', 
  service: services[0] || '', 
  status: 'pending' 
};

export default function LeadsPage() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Fetch user's leads on component mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchLeads();
    }
  }, [currentUser]);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    const { leads: data, error: err } = await getUserLeads(currentUser.id);
    
    if (err) {
      setError(`Failed to load leads: ${err}`);
      setLeads([]);
    } else {
      setLeads(data);
    }
    setLoading(false);
  };

  // Handle adding a new lead to Supabase
  const handleAddLead = async (e) => {
    e.preventDefault();
    
    if (!form.client_name.trim()) {
      setError('Client name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    const { lead: newLead, error: err } = await addLead(form, currentUser.id);

    if (err) {
      setError(`Failed to add lead: ${err}`);
      setSubmitting(false);
      return;
    }

    // Add new lead to state
    setLeads(prev => [newLead, ...prev]);
    setForm(emptyForm);
    setShowModal(false);
    setSubmitting(false);
  };

  // Handle status change
  const handleStatusChange = async (leadId, newStatus) => {
    const { success, error: err } = await updateLeadStatus(leadId, newStatus);
    
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

  // Handle deleting a lead
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    const { success, error: err } = await deleteLead(leadId);
    
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
    converted: leads.filter(l => l.status === 'converted').length,
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

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Service</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-600 text-sm">
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
                    <td className="px-5 py-3.5">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-dark-600 border border-dark-400 rounded-lg text-xs px-2 py-1 text-white focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="pending">Pending</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="converted">Converted</option>
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
        <form onSubmit={handleAddLead} className="space-y-4">
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
            <option value="converted">Converted</option>
          </Select>
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
    </div>
  );
}
