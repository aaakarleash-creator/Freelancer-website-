// File: src/hooks/useEarnings.js
// Purpose: Custom hook for earnings operations
// Encapsulates earnings logic for reuse

import { useState, useCallback, useEffect } from 'react';
import {
  getUserEarnings,
  calculateTotalEarnings,
  getPendingPayouts,
  getPaidPayouts,
} from '../utils/earningsService';

export const useEarnings = (userId) => {
  const [earnings, setEarnings] = useState([]);
  const [totals, setTotals] = useState({
    total: 0,
    pending: 0,
    paid: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all earnings data
  const fetchEarnings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      // Fetch all earnings
      const { earnings: data, error: err1 } = await getUserEarnings(userId);
      if (err1) throw err1;

      // Calculate total
      const { total, error: err2 } = await calculateTotalEarnings(userId);
      if (err2) throw err2;

      // Get pending
      const { pendingAmount, error: err3 } = await getPendingPayouts(userId);
      if (err3) throw err3;

      // Get paid
      const { paidAmount, error: err4 } = await getPaidPayouts(userId);
      if (err4) throw err4;

      setEarnings(data);
      setTotals({
        total,
        pending: pendingAmount,
        paid: paidAmount,
      });
    } catch (err) {
      setError(err.message || err);
    }

    setLoading(false);
  }, [userId]);

  // Auto-fetch on mount or userId change
  useEffect(() => {
    if (userId) {
      fetchEarnings();
    }
  }, [userId, fetchEarnings]);

  return {
    earnings,
    totals,
    loading,
    error,
    refetch: fetchEarnings,
  };
};
