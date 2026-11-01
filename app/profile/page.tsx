'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AccountLayout from '@/components/layout/AccountLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ProfileFormSkeleton } from '@/components/ui/Skeleton';
import { ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Changing the sign-in email needs the current password
  const [currentPassword, setCurrentPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const emailChanged = Boolean(user && formData.email.trim().toLowerCase() !== (user.email || '').toLowerCase());

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

    const addrFields = [formData.address, formData.city, formData.state, formData.zipCode].map((v) => v.trim());
    if (addrFields.some(Boolean) && !addrFields.every(Boolean)) {
      const msg = 'Please fill in street, city, state and zip code to save an address (or clear all four).';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
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
        formData.zipCode,
        undefined,
        emailChanged ? currentPassword : undefined
      );
      setCurrentPassword('');
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
      <div className="space-y-8">

        {/* Title / Section Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">
              Profile Settings
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
              Keep your contact information and default shipping details up to date.
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Card Info */}
        {!user ? (
          <ProfileFormSkeleton />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture & Email Header */}
            <div className="flex flex-row items-center gap-5">
              <div className="relative w-20 h-20 bg-ink text-paper rounded-full flex items-center justify-center font-serif text-3xl flex-shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-serif font-medium tracking-tight text-ink truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2.5 text-sm leading-normal">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing || submitting}
                required
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || submitting}
                required
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              {isEditing && emailChanged && (
                <Input
                  label="Current Password (to change email)"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
                />
              )}
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing || submitting}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="Street Address (Default)"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing || submitting}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="City"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditing || submitting}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="State / Province"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!isEditing || submitting}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="Zip / Postal Code"
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                disabled={!isEditing || submitting}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink md:col-span-2"
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-6 border-t border-line">
                <Button type="submit" loading={submitting}>
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
