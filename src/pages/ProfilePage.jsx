import React, { useState } from 'react';
import { Mail, Briefcase, Calendar, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { Input } from '../components/Input';
import { updateUserProfile } from '../utils/userManagementService';

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

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

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
    </div>
  );
}
