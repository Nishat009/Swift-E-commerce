'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AccountLayout from '@/components/layout/AccountLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ProfileFormSkeleton } from '@/components/ui/Skeleton';
import { Edit2, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Populate data when user object changes
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: defaultAddr?.street || '',
        city: defaultAddr?.city || '',
        state: defaultAddr?.state || '',
        zipCode: defaultAddr?.zipCode || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await updateProfile(
        formData.name,
        formData.email,
        formData.phone,
        undefined, // password is not modified here
        formData.address,
        formData.city,
        formData.state,
        formData.zipCode
      );
      toast.success('Your profile was updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Failed to update profile. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout activeTabName="/profile">
      <div className="space-y-6">
        
        {/* Title / Section Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
              Profile Settings
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Keep your contact information and default shipping details up to date.
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex items-center gap-2 rounded-full text-xs font-bold shadow-xs px-5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Card Info */}
        {!user ? (
          <ProfileFormSkeleton />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Profile Picture & Email Header */}
            <div className="flex flex-row items-center gap-5 p-5 bg-[#faf9f6] dark:bg-gray-850 rounded-3xl border border-gray-150/40 dark:border-gray-800/80">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold font-serif text-gray-900 dark:text-white truncate">
                  {user.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5 truncate">
                  {user.email}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Verified Account
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 dark:bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs font-bold leading-normal">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing || submitting}
                required
                className="rounded-2xl"
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || submitting}
                required
                className="rounded-2xl"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing || submitting}
                className="rounded-2xl"
              />
              <Input
                label="Street Address (Default)"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing || submitting}
                className="rounded-2xl"
              />
              <Input
                label="City"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditing || submitting}
                className="rounded-2xl"
              />
              <Input
                label="State / Province"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!isEditing || submitting}
                className="rounded-2xl"
              />
              <Input
                label="Zip / Postal Code"
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                disabled={!isEditing || submitting}
                className="rounded-2xl md:col-span-2"
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="submit"
                  loading={submitting}
                  className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold px-6 shadow-md text-xs"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg(null);
                  }}
                  className="rounded-full px-6 text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </AccountLayout>
  );
}
