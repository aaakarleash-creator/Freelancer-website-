import { supabase } from './supabaseClient';

const QUERY_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Wrapper function for queries with timeout and retry
export const queryWithRetry = async (queryFn, queryName = 'query') => {
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create a promise that rejects after QUERY_TIMEOUT
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${queryName} timeout after ${QUERY_TIMEOUT}ms`)), QUERY_TIMEOUT)
      );

      // Race between the query and the timeout
      const result = await Promise.race([
        queryFn(),
        timeoutPromise,
      ]);

      // If Supabase returns its own { data, error, status } object, unwrap it.
      if (result && typeof result === 'object' && 'data' in result && 'error' in result) {
        return { data: result.data, error: result.error ?? null };
      }

      // Success — return raw result for non-Supabase query functions.
      return { data: result, error: null };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ ${queryName} failed (attempt ${attempt}/${MAX_RETRIES}):`, err.message);

      // Don't retry on permission errors
      if (err.message?.includes('permission denied')) {
        return { data: null, error: err.message };
      }

      // Wait before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  // All retries failed
  console.error(`❌ ${queryName} failed after ${MAX_RETRIES} attempts`);
  return { data: null, error: lastError?.message || 'Unknown error' };
};

// Pre-made query helpers for common operations
export const getLeads = async (userId) => {
  return queryWithRetry(
    () => supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'getLeads'
  );
};

export const getLeadsWithVerification = async (userId) => {
  return queryWithRetry(
    () => supabase
      .from('leads')
      .select(`
        *,
        lead_verifications (
          id,
          status,
          report_data,
          notes,
          created_at,
          verification_date,
          admin_final_verification_date,
          verified_by_admin_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'getLeadsWithVerification'
  );
};

export const getEarnings = async (userId) => {
  return queryWithRetry(
    () => supabase
      .from('earnings')
      .select('*, leads(client_name, service)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'getEarnings'
  );
};

export const getServices = async () => {
  return queryWithRetry(
    () => supabase
      .from('services')
      .select('*')
      .order('category'),
    'getServices'
  );
};

export const getAnnouncements = async () => {
  return queryWithRetry(
    () => supabase
      .from('announcements')
      .select('id, title, message, type')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3),
    'getAnnouncements'
  );
};

export const getLeaderboard = async () => {
  return queryWithRetry(
    () => supabase
      .from('users')
      .select('id, name, designation, role')
      .eq('status', 'active'),
    'getLeaderboard'
  );
};

export const getLeadVerifications = async () => {
  return queryWithRetry(
    () => supabase
      .from('lead_verifications')
      .select('*')
      .order('created_at', { ascending: false }),
    'getLeadVerifications'
  );
};
