'use client';

import React, { useEffect, useState } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ShieldCheck, Key } from 'lucide-react';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

export default function SettingsPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [hasPassword, setHasPassword] = useState(true);
  useEffect(() => {
    apiClient.get('/auth/profile').then((res) => {
      const u = res.data?.data?.user;
      if (u && typeof u.hasPassword === 'boolean') setHasPassword(u.hasPassword);
    }).catch(() => {});
  }, []);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPassword && !passwordData.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    
    setChangingPassword(true);
    try {
      // Profile update endpoint supports changing password with currentPassword verification
      await updateProfile(
        user?.name || '',
        user?.email || '',
        user?.phone || '',
        passwordData.newPassword,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        passwordData.currentPassword || undefined
      );
      setHasPassword(true);
      toast.success(hasPassword ? 'Your password has been changed successfully.' : 'Password set. You can now sign in with email and password.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AccountLayout activeTabName="/settings">
      <div className="space-y-8">
        
        {/* Title */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
            Security Settings
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Manage your account security, passwords, and multi-factor authentication preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-serif font-bold">Google account</h3>
            {user?.googleConnected ? (
              <p className="text-sm text-emerald-600">Google is connected. You can sign in using your Google account.</p>
            ) : (
              <>
                <p className="text-sm text-text-muted">Connect Google using the same email as your account ({user?.email}). Your orders, cart and security settings will stay with this account.</p>
                {user && <GoogleSignIn mode="link" />}
              </>
            )}
          </div>
          
          {/* Two-Factor Authentication Box */}
          <div className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] flex items-center justify-center text-white shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-[10px] text-text-muted">
                  Adds an additional layer of security to prevent unauthorized access.
                </p>
              </div>
            </div>

            <TwoFactorSetup enabled={Boolean(user?.twoFactorEnabled)} onChanged={refreshUser} />
          </div>

          {/* Change Password Box */}
          <div className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] flex items-center justify-center text-white shadow-inner">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-[10px] text-text-muted">
                  Update your login password regularly to protect access.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
              {!hasPassword ? null : (
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  disabled={changingPassword}
                  className="rounded-xl text-xs"
                />
              )}
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                disabled={changingPassword}
                className="rounded-xl text-xs"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                disabled={changingPassword}
                className="rounded-xl text-xs"
              />

              <Button
                type="submit"
                loading={changingPassword}
                className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold px-6 shadow-md text-xs"
              >
                Change Password
              </Button>
            </form>
          </div>

        </div>
      </div>

    </AccountLayout>
  );
}
