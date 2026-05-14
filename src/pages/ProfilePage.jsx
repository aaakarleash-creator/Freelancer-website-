import React, { useState } from 'react';
import { Mail, Briefcase, Calendar, Edit3, Save, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { Input } from '../components/Input';
import { uploadProfilePicture, updateUserProfile } from '../utils/userManagementService';

// ============================================================
// ProfilePage — user profile with edit and image upload capability
// ============================================================

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(currentUser?.profile_image_url || null);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    designation: currentUser?.designation || '',
    email: currentUser?.email || '',
  });

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const { imageUrl, error: uploadError } = await uploadProfilePicture(currentUser.id, file);
    
    if (uploadError) {
      setError(uploadError);
      setLoading(false);
      return;
    }

    setProfileImageUrl(imageUrl);
    setSuccess('Profile picture updated!');
    setLoading(false);
  };

  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { success, error: updateError } = await updateUserProfile(currentUser.id, {
        name: form.name,
        designation: form.designation,
        email: form.email,
        profileImageUrl: profileImageUrl,
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
          email: form.email,
          profile_image_url: profileImageUrl,
        });
      }

      setSuccess('Profile updated successfully!');
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
          {error}
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
            <div className="relative group">
              <Avatar 
                initials={currentUser?.avatar} 
                imageUrl={profileImageUrl}
                size="xl" 
                className="ring-4 ring-dark-700" 
              />
              {editing && (
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition">
                  <Upload size={24} className="text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              )}
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
                <Input label="Email" type="email" value={form.email} onChange={update('email')} disabled={loading} />
                <div className="p-3 bg-dark-600 border border-dark-500 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Profile Picture</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Upload size={16} className="text-amber-400" />
                    <span className="text-sm text-amber-400 hover:text-amber-300">
                      {profileImageUrl ? 'Change Image' : 'Upload Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                  {profileImageUrl && (
                    <p className="text-xs text-green-400 mt-2">✓ Image selected</p>
                  )}
                </div>
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
