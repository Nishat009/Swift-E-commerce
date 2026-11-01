'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { newPasswordError, passwordMatchError } from '@/lib/formValidation';

// The backend only returns dev codes when ALLOW_DEV_AUTH_CODES is on outside production;
// a production build never shows them either way.
const SHOW_DEV_CODES = process.env.NODE_ENV !== 'production';

type Props = {
  /** Pre-fills the email field (what the sign-in form already holds). */
  initialEmail?: string;
  /** Code from an emailed reset link: the modal opens on the new-password step. */
  initialToken?: string;
  onClose: () => void;
  /** Called after a successful reset so the sign-in form can be pre-filled. */
  onPasswordReset: (email: string, password: string) => void;
};

/** Forgot-password flow: email a reset code, then set a new password with it. */
export default function ForgotPasswordModal({ initialEmail = '', initialToken = '', onClose, onPasswordReset }: Props) {
  const { forgotPassword, resetPassword } = useAuth();
  const toast = useToast();
  const [forgotStep, setForgotStep] = useState<'request' | 'reset' | 'success'>(initialToken ? 'reset' : 'request');
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [forgotOtp, setForgotOtp] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotTestNotice, setForgotTestNotice] = useState('');

  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    setForgotTestNotice('');
    try {
      const res = await forgotPassword(forgotEmail);
      toast.success('If an account exists for that email, we have sent reset instructions. Check your inbox (and spam).');
      if (SHOW_DEV_CODES && res && res.testOtp) {
        setForgotTestNotice(`[Dev mode] Reset token: ${res.testOtp}`);
      }
      setForgotStep('reset');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      toast.error('Please enter the reset token');
      return;
    }
    const passwordProblem = newPasswordError(newPassword);
    if (passwordProblem) {
      toast.error(passwordProblem);
      return;
    }
    const matchProblem = passwordMatchError(newPassword, confirmNewPassword);
    if (matchProblem) {
      toast.error(matchProblem);
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail, forgotOtp, newPassword);
      toast.success('Password reset successfully!');
      setForgotStep('success');
      onPasswordReset(forgotEmail, newPassword);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Check the token.');
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = 'h-11 w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-stone-300';
  const primaryClass = 'inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-ink text-xs font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50';
  const titleClass = 'font-serif text-2xl font-medium tracking-tight text-ink';
  const copyClass = 'text-sm text-stone-500 dark:text-stone-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md space-y-6 rounded-lg border border-line bg-paper p-6 shadow-2xl sm:p-8">
        <button
          onClick={() => onClose()}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <X className="size-4" />
        </button>

        {forgotStep === 'request' && (
          <form onSubmit={handleRequestForgotOtp} className="space-y-5">
            <div className="space-y-2">
              <KeyRound className="size-5 text-[#8b6f47] dark:text-[#c9a96b]" strokeWidth={1.5} />
              <h3 className={titleClass}>Reset password</h3>
              <p className={copyClass}>
                Enter the email address associated with your account and we will email you a secure reset link and code.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Your email address</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={forgotLoading} className={primaryClass}>
              {forgotLoading ? 'Sending...' : 'Email Me a Reset Link'}
            </button>
          </form>
        )}

        {forgotStep === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Lock className="size-5 text-[#8b6f47] dark:text-[#c9a96b]" strokeWidth={1.5} />
              <h3 className={titleClass}>Enter token and new password</h3>
              <p className={copyClass}>
                Paste the reset code from the email we sent{forgotEmail ? <> to <span className="font-medium text-ink">{forgotEmail}</span></> : ' you'}.
              </p>
            </div>

            {forgotTestNotice && (
              <div className="rounded-md border border-line bg-surface-muted p-3 text-xs text-stone-600 dark:text-stone-300">
                {forgotTestNotice}
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Reset token</label>
              <input
                type="text"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                placeholder="Paste reset code from email"
                maxLength={128}
                required
                className={`${inputClass} text-center tracking-widest`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>New password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-ink"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Confirm new password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={forgotLoading} className={`${primaryClass} mt-2`}>
              {forgotLoading ? 'Updating Password...' : 'Save & Update Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setForgotStep('request')}
                className="cursor-pointer text-xs text-stone-500 underline underline-offset-4 hover:text-ink"
              >
                Back to email input
              </button>
            </div>
          </form>
        )}

        {forgotStep === 'success' && (
          <div className="space-y-4 py-2">
            <CheckCircle2 className="size-5 text-[#8b6f47] dark:text-[#c9a96b]" strokeWidth={1.5} />
            <h3 className={titleClass}>Password updated</h3>
            <p className={copyClass}>
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <button type="button" onClick={() => onClose()} className={primaryClass}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
