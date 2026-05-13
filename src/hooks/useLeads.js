// File: src/hooks/useLeads.js
// Purpose: Custom hook for lead operations
// Encapsulates lead management logic for reuse

import { useState, useCallback } from 'react';
import { 
  addLead, 
  getUserLeads, 
  updateLeadStatus, 
  deleteLead 
} from '../utils/leadService';

export const useLeads = (userId) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch user's leads
  const fetchLeads = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    const { leads: data, error: err } = await getUserLeads(userId);
    
    if (err) {
      setError(err);
      setLeads([]);
    } else {
      setLeads(data);
    }
    setLoading(false);
  }, [userId]);

  // Add new lead
  const createLead = useCallback(async (leadData) => {
    if (!userId) {
      setError('User not authenticated');
      return { success: false };
    }

    setError('');
    const { lead, error: err } = await addLead(leadData, userId);
    
    if (err) {
      setError(err);
      return { success: false, error: err };
    }

    setLeads(prev => [lead, ...prev]);
    return { success: true, lead };
  }, [userId]);

  // Update lead status
  const updateStatus = useCallback(async (leadId, newStatus) => {
    setError('');
    const { success, error: err } = await updateLeadStatus(leadId, newStatus);
    
    if (err) {
      setError(err);
      return { success: false };
    }

    setLeads(prev => 
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );
    return { success: true };
  }, []);

  // Delete lead
  const removeLead = useCallback(async (leadId) => {
    setError('');
    const { success, error: err } = await deleteLead(leadId);
    
    if (err) {
      setError(err);
      return { success: false };
    }

    setLeads(prev => prev.filter(l => l.id !== leadId));
    return { success: true };
  }, []);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateStatus,
    removeLead,
  };
};
