'use client';

import React, { useState } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ShieldCheck, ShieldAlert, Key, Award, Clock } from 'lucide-react';

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

  // 2FA Security setups
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading2FA, setLoading2FA] = useState(false);

  // Confirmations
  const [isDisable2FAConfirmOpen, setIsDisable2FAConfirmOpen] = useState(false);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Profile update endpoint supports changing password
      await updateProfile(
        user?.name || '',
        user?.email || '',
        user?.phone || '',
        passwordData.newPassword
      );
      toast.success('Your password has been changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    setVerificationError('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      if (res.data?.success) {
        setSetupSecret(res.data.data.secret);
        setSetupQrUrl(res.data.data.otpauthUrl);
        setIsSettingUp2FA(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initialize 2FA setup.');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Verification code is required');
      return;
    }
    setLoading2FA(true);
    setVerificationError('');
    try {
      const res = await apiClient.post('/auth/2fa/enable', { code: verificationCode });
      if (res.data?.success) {
        setRecoveryCodes(res.data.data.recoveryCodes || []);
        toast.success('Two-Factor Authentication activated successfully.');
        await refreshUser();
      }
    } catch (err: any) {
      console.error(err);
      setVerificationError(err.response?.data?.message || 'Invalid code. Verification failed.');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading2FA(true);
    try {
      const res = await apiClient.post('/auth/2fa/disable');
      if (res.data?.success) {
        toast.success('Two-Factor Authentication has been disabled.');
        setIsSettingUp2FA(false);
        setIsDisable2FAConfirmOpen(false);
        await refreshUser();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading2FA(false);
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

            {user?.twoFactorEnabled ? (
              /* Enabled State */
              <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      Two-Factor Authentication is Active
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-500/80 mt-1 leading-relaxed">
                      Your account is protected using TOTP authenticator tokens. You will be prompted to enter a verification code each time you sign in.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsDisable2FAConfirmOpen(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200/50 rounded-full text-[10px] font-black px-5 py-1.5"
                >
                  Deactivate 2FA
                </Button>
              </div>
            ) : (
              /* Disabled / Setup State */
              <div className="space-y-6">
                {!isSettingUp2FA ? (
                  <div className="space-y-4">
                    <p className="text-xs text-text-muted leading-relaxed">
                      Protect your account with Two-Factor Authentication. Once set up, you will scan a QR code with apps like Google Authenticator or Microsoft Authenticator to generate verification codes.
                    </p>
                    <Button
                      onClick={handleStart2FASetup}
                      loading={loading2FA}
                      className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 shadow-md border-0 text-xs"
                    >
                      Set Up 2FA
                    </Button>
                  </div>
                ) : (
                  /* 2FA Setup Flow */
                  <div className="space-y-6 border border-gray-150/40 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
                    <h4 className="font-serif text-sm font-bold text-gray-900 dark:text-white">
                      Configure Authenticator App
                    </h4>

                    {recoveryCodes.length > 0 ? (
                      /* Success: Display Recovery Codes */
                      <div className="space-y-4">
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold leading-normal">
                          ✓ Two-Factor Authentication activated successfully!
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Save these recovery codes in a secure place. If you lose access to your device, you can use these to regain access. Each code works once.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-950 p-4 rounded-xl font-mono text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                          {recoveryCodes.map((code, idx) => (
                            <div key={idx} className="tracking-wider">{code}</div>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            setIsSettingUp2FA(false);
                            setRecoveryCodes([]);
                          }}
                          className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full px-6 font-bold text-xs"
                        >
                          Done & Close
                        </Button>
                      </div>
                    ) : (
                      /* QR Code Scan Form */
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                          {setupQrUrl && (
                            <div className="p-3 bg-white border rounded-2xl shadow-xs flex-shrink-0">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupQrUrl)}`}
                                alt="2FA QR Code"
                                className="w-[150px] h-[150px]"
                              />
                            </div>
                          )}
                          <div className="space-y-2 text-[10px] text-text-muted leading-relaxed">
                            <p className="font-bold font-serif text-gray-900 dark:text-white text-xs">Steps:</p>
                            <p>1. Scan the QR code using Google/Microsoft Authenticator.</p>
                            <p>2. If you cannot scan, manually enter the setup key:</p>
                            <code className="block bg-gray-100 dark:bg-gray-950 p-2 rounded text-gray-900 dark:text-gray-100 font-mono tracking-wider text-[9px] font-bold select-all break-all">
                              {setupSecret}
                            </code>
                          </div>
                        </div>

                        {verificationError && (
                          <div className="p-3.5 bg-red-500/10 dark:bg-red-500/5 text-red-650 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex gap-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>{verificationError}</span>
                          </div>
                        )}

                        <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-gray-800">
                          <Input
                            label="Verify Authenticator Code"
                            placeholder="Enter 6-digit code"
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            disabled={loading2FA}
                            className="rounded-xl text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleEnable2FA}
                              loading={loading2FA}
                              className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 shadow-md border-0 text-xs"
                            >
                              Verify & Enable
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsSettingUp2FA(false)}
                              disabled={loading2FA}
                              className="rounded-full px-6 text-xs font-bold"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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

      {/* Disable 2FA Modal */}
      <ConfirmationModal
        isOpen={isDisable2FAConfirmOpen}
        onClose={() => setIsDisable2FAConfirmOpen(false)}
        onConfirm={handleDisable2FA}
        title="Disable Two-Factor Authentication"
        message="Are you sure you want to deactivate Two-Factor Authentication? This makes your account more vulnerable to phishing and brute-force attacks."
        confirmText="Deactivate"
        variant="danger"
        isLoading={loading2FA}
      />
    </AccountLayout>
  );
}
