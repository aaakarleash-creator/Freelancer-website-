import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, Calendar, Edit3, Save, X, CreditCard, DollarSign, FileText, Eye, CheckCircle2, AlertCircle, Toggle2, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { Input, Select } from '../components/Input';
import Modal from '../components/Modal';
import { updateUserProfile } from '../utils/userManagementService';
import { LEGAL_TEXT } from '../constants/legalText';

// ============================================================
// ProfilePage — user profile with edit capability
// ============================================================

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    designation: currentUser?.designation || '',
  });

  // Bank Details state
  const [bankForm, setBankForm] = useState({
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    bank_code: '',
    branch: '',
    account_type: 'Savings',
    country: 'India',
    currency: 'INR',
  });
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);

  // Payout Settings state
  const [autopayEnabled, setAutopayEnabled] = useState(currentUser?.autopay_enabled || false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Legal Documents state
  const [agreements, setAgreements] = useState([]);
  const [agreementsLoading, setAgreementsLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showLegalFlow, setShowLegalFlow] = useState(false);
  const [documentToSign, setDocumentToSign] = useState(null);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const updateBank = (k) => (e) => setBankForm(f => ({ ...f, [k]: e.target.value }));

  // Fetch bank details on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchBankDetails();
      fetchAgreements();
    }
  }, [currentUser?.id]);

  const fetchBankDetails = async () => {
    setBankLoading(true);
    setBankError(null);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = supabase
        .from('bank_details')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Bank details fetch timed out');
        setBankError('Request timed out. Please check your connection.');
        setBankLoading(false);
        return;
      }
      
      const { data, error } = result;

      if (error) {
        setBankError(error.message);
      } else if (data) {
        setBankDetails(data);
        setBankForm({
          account_holder_name: data.account_holder_name || '',
          account_number: data.account_number || '',
          bank_name: data.bank_name || '',
          bank_code: data.bank_code || '',
          branch: data.branch || '',
          account_type: data.account_type || 'Savings',
          country: data.country || 'India',
          currency: data.currency || 'INR',
        });
      }
    } catch (err) {
      setBankError(err.message);
    }
    setBankLoading(false);
  };

  const saveBankDetails = async () => {
    if (!bankForm.account_holder_name.trim() || !bankForm.account_number.trim() || !bankForm.bank_name.trim()) {
      setBankError('Account Holder Name, Account Number, and Bank Name are required');
      return;
    }

    setBankLoading(true);
    setBankError(null);
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .upsert({
          user_id: currentUser.id,
          account_holder_name: bankForm.account_holder_name,
          account_number: bankForm.account_number,
          bank_name: bankForm.bank_name,
          bank_code: bankForm.bank_code,
          branch: bankForm.branch,
          account_type: bankForm.account_type,
          country: bankForm.country,
          currency: bankForm.currency,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        setBankError(error.message);
      } else {
        setBankDetails(data);
        setSuccess('Bank details saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setBankError(err.message);
    }
    setBankLoading(false);
  };

  const toggleAutopay = async (value) => {
    setPayoutLoading(true);
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ autopay_enabled: value })
        .eq('id', currentUser.id);

      const { error: scheduleError } = await supabase
        .from('user_payout_schedule')
        .upsert({
          user_id: currentUser.id,
          autopay_enabled: value,
          email: currentUser.email,
          name: currentUser.name,
        });

      if (userError || scheduleError) {
        setError('Failed to update payout settings');
      } else {
        setAutopayEnabled(value);
        if (setCurrentUser) {
          setCurrentUser({ ...currentUser, autopay_enabled: value });
        }
        setSuccess('Payout settings updated!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
    setPayoutLoading(false);
  };

  const fetchAgreements = async () => {
    setAgreementsLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = supabase
        .from('agreements')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Agreements fetch timed out, using empty state');
        setAgreements([]);
        setAgreementsLoading(false);
        return;
      }
      
      const { data, error } = result;

      if (error) {
        console.error('Error fetching agreements:', error);
      } else {
        setAgreements(data || []);
      }
    } catch (err) {
      console.error('Error fetching agreements:', err);
      setAgreements([]);
    }
    setAgreementsLoading(false);
  };

  const saveProfile = async () => {
    if (!form.name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { success, error: updateError } = await updateUserProfile(currentUser.id, {
        name: form.name,
        designation: form.designation,
      });

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Update context with new user data
      if (setCurrentUser) {
        setCurrentUser({
          ...currentUser,
          name: form.name,
          designation: form.designation,
        });
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account details</p>
      </div>

      {/* Success/Error messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
        {/* Cover banner */}
        <div className="h-24 bg-gradient-to-r from-dark-600 via-amber-900/20 to-dark-600 relative">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.3) 0%, transparent 60%)' }}
          />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="-mt-8 flex items-end justify-between">
            <div>
              <Avatar 
                initials={currentUser?.avatar} 
                size="xl" 
                className="ring-4 ring-dark-700" 
              />
            </div>
            <div className="mb-1">
              {!editing ? (
                <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={X} onClick={() => setEditing(false)} disabled={loading}>Cancel</Button>
                  <Button size="sm" icon={Save} onClick={saveProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            {!editing ? (
              <>
                <h2 className="font-display text-xl font-bold text-white">{currentUser?.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5">{currentUser?.designation}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <StatusBadge status={currentUser?.status} />
                  <StatusBadge status={currentUser?.role} />
                </div>
              </>
            ) : (
              <div className="space-y-4 mt-2">
                <Input label="Full Name" value={form.name} onChange={update('name')} disabled={loading} />
                <Input label="Designation" value={form.designation} onChange={update('designation')} disabled={loading} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail rows */}
      {!editing && (
        <div className="bg-dark-700 border border-dark-400 rounded-2xl divide-y divide-dark-500">
          {[
            { icon: Mail, label: 'Email Address', value: currentUser?.email },
            { icon: Briefcase, label: 'Designation', value: currentUser?.designation },
            { icon: Calendar, label: 'Member Since', value: currentUser?.joined },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-xl bg-dark-500 border border-dark-400 flex items-center justify-center text-amber-400/60 flex-shrink-0">
                <Icon size={15} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm text-white mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Account & Payout Settings Section */}
      {!editing && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-amber-400" />
            Bank Account & Payout Settings
          </h2>

          {/* Bank Details Form */}
          <div className="bg-dark-700 border border-dark-400 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Bank Details</h3>
              {bankDetails?.is_verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-xs font-medium text-green-400">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              )}
              {!bankDetails?.is_verified && bankDetails && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-400">
                  <AlertCircle size={12} />
                  Pending Verification
                </span>
              )}
            </div>

            {bankError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {bankError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name"
                value={bankForm.account_holder_name}
                onChange={updateBank('account_holder_name')}
                disabled={bankLoading}
                placeholder="John Doe"
              />
              <Input
                label="Account Number"
                value={bankForm.account_number}
                onChange={updateBank('account_number')}
                disabled={bankLoading}
                placeholder="1234567890"
              />
              <Input
                label="Bank Name"
                value={bankForm.bank_name}
                onChange={updateBank('bank_name')}
                disabled={bankLoading}
                placeholder="State Bank of India"
              />
              <Input
                label="IFSC Code"
                value={bankForm.bank_code}
                onChange={updateBank('bank_code')}
                disabled={bankLoading}
                placeholder="SBIN0001234"
              />
              <Input
                label="Branch"
                value={bankForm.branch}
                onChange={updateBank('branch')}
                disabled={bankLoading}
                placeholder="New Delhi"
              />
              <Select
                label="Account Type"
                value={bankForm.account_type}
                onChange={updateBank('account_type')}
                disabled={bankLoading}
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
              </Select>
              <Input
                label="Country"
                value={bankForm.country}
                onChange={updateBank('country')}
                disabled={bankLoading}
                placeholder="India"
              />
              <Input
                label="Currency"
                value={bankForm.currency}
                onChange={updateBank('currency')}
                disabled={bankLoading}
                placeholder="INR"
              />
            </div>

            <Button onClick={saveBankDetails} disabled={bankLoading} className="w-full justify-center">
              {bankLoading ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </div>

          {/* Payout Settings */}
          <div className="bg-dark-700 border border-dark-400 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-white">Payout Settings</h3>

            {/* Autopay Toggle */}
            <div className="flex items-center justify-between p-4 bg-dark-600/50 rounded-xl border border-dark-500">
              <div>
                <p className="font-medium text-white">Enable Automatic Payouts</p>
                <p className="text-xs text-slate-400 mt-1">Payouts are processed on the 1st and 15th of every month. Minimum payout threshold is ₹500.</p>
              </div>
              <button
                onClick={() => toggleAutopay(!autopayEnabled)}
                disabled={payoutLoading}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                  autopayEnabled ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-dark-500 border border-dark-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    autopayEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Payout Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-dark-600/50 rounded-xl border border-dark-500">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Last Payout Date</p>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" />
                  {currentUser?.last_payout_date || 'Never'}
                </p>
              </div>
              <div className="p-4 bg-dark-600/50 rounded-xl border border-dark-500">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Next Payout Date</p>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Calendar size={14} className="text-amber-400" />
                  {currentUser?.next_payout_date || 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Documents & Agreements Section */}
      {!editing && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} className="text-amber-400" />
            Legal Documents & Agreements
          </h2>

          {agreementsLoading ? (
            <div className="text-center py-6 text-slate-400">Loading agreements...</div>
          ) : (
            <div className="bg-dark-700 border border-dark-400 rounded-2xl divide-y divide-dark-500">
              {['Terms & Conditions', 'Privacy Policy', 'Freelancer Agreement'].map((docName, idx) => {
                const docKey = idx === 0 ? 'terms' : idx === 1 ? 'privacy' : 'agreement';
                const signedAtKey = idx === 0 ? 'accepted_terms_at' : idx === 1 ? 'accepted_privacy_at' : 'accepted_agreement_at';
                const isSigned = currentUser?.[signedAtKey];
                const agreement = agreements.find(a => a.document_type === docKey);

                return (
                  <div key={docName} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium text-white">{docName}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-xs font-medium text-green-400">
                            <CheckCircle2 size={12} />
                            Signed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-xs font-medium text-slate-400">
                            Not Signed
                          </span>
                        )}
                        {isSigned && (
                          <span className="text-xs text-slate-500">Signed on {new Date(isSigned).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => {
                          setSelectedDocument({ name: docName, type: docKey, text: LEGAL_TEXT[docKey] });
                          setShowDocumentModal(true);
                        }}
                      >
                        View
                      </Button>
                      {!isSigned && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setDocumentToSign(docKey);
                            setShowLegalFlow(true);
                          }}
                        >
                          Sign Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Document View Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedDocument(null);
        }}
        title={selectedDocument?.name}
      >
        <div className="max-h-96 overflow-y-auto pr-4 text-sm text-slate-300 whitespace-pre-wrap font-mono text-xs">
          {selectedDocument?.text}
        </div>
      </Modal>

      {/* Legal Flow Modal for Signing */}
      <Modal
        isOpen={showLegalFlow}
        onClose={() => {
          setShowLegalFlow(false);
          setDocumentToSign(null);
        }}
        title="Sign Legal Document"
      >
        <div className="text-center text-slate-400 text-sm">
          <p>Legal document signing flow would be integrated here.</p>
          <p className="mt-2 text-xs">Please use the Legal Acceptance Flow for complete signing process.</p>
          <Button
            className="mt-4 w-full justify-center"
            onClick={() => {
              setShowLegalFlow(false);
              setDocumentToSign(null);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
