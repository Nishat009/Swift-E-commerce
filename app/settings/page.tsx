'use client';

import React, { useEffect, useState } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { newPasswordError, passwordMatchError } from '@/lib/formValidation';

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
    const passwordProblem = newPasswordError(passwordData.newPassword);
    if (passwordProblem) {
      toast.error(passwordProblem);
      return;
    }
    const matchProblem = passwordMatchError(passwordData.newPassword, passwordData.confirmPassword);
    if (matchProblem) {
      toast.error(matchProblem);
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
      <div className="space-y-10">

        {/* Title */}
        <div className="border-b border-line pb-5">
          <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">
            Security Settings
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
            Manage your account security, passwords, and multi-factor authentication preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 max-w-2xl">
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-medium tracking-tight text-ink">Google account</h3>
            {user?.googleConnected ? (
              <p className="text-sm text-green-700 dark:text-green-400">Google is connected. You can sign in using your Google account.</p>
            ) : (
              <>
                <p className="text-sm text-stone-600 dark:text-stone-400">Connect Google using the same email as your account ({user?.email}). Your orders, cart and security settings will stay with this account.</p>
                {user && <GoogleSignIn mode="link" />}
              </>
            )}
          </div>
          
          {/* Two-Factor Authentication Box */}
          <div className="border-t border-line pt-10 space-y-6">
            <div>
              <div>
                <h3 className="text-xl font-serif font-medium tracking-tight text-ink">
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Adds an additional layer of security to prevent unauthorized access.
                </p>
              </div>
            </div>

            <TwoFactorSetup enabled={Boolean(user?.twoFactorEnabled)} onChanged={refreshUser} />
          </div>

          {/* Change Password Box */}
          <div className="border-t border-line pt-10 space-y-6">
            <div>
              <div>
                <h3 className="text-xl font-serif font-medium tracking-tight text-ink">
                  Change Password
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
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
                  className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
                />
              )}
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                disabled={changingPassword}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                disabled={changingPassword}
                className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
              />

              <Button type="submit" loading={changingPassword}>
                Change Password
              </Button>
            </form>
          </div>

        </div>
      </div>

    </AccountLayout>
  );
}
