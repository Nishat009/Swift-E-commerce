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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#151513] border border-gray-200 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 relative">
        <button 
          onClick={() => onClose()} 
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-850 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {forgotStep === 'request' && (
          <form onSubmit={handleRequestForgotOtp} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-600">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Reset Password</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter the email address associated with your account and we will email you a secure reset link and code.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                Your Email Address
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 uppercase tracking-wider"
            >
              {forgotLoading ? 'Sending...' : 'Email Me a Reset Link'}
            </button>
          </form>
        )}

        {forgotStep === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-600">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Enter Token & New Password</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste the reset code from the email we sent{forgotEmail ? <> to <span className="font-bold text-gray-700 dark:text-gray-300">{forgotEmail}</span></> : ' you'}.
              </p>
            </div>

            {forgotTestNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                💡 {forgotTestNotice}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                Reset Token
              </label>
              <input
                type="text"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                placeholder="Paste reset code from email"
                maxLength={128}
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-center tracking-widest text-sm font-bold rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-650 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-xs rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 uppercase tracking-wider mt-2"
            >
              {forgotLoading ? 'Updating Password...' : 'Save & Update Password'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setForgotStep('request')}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold"
              >
                ← Back to email input
              </button>
            </div>
          </form>
        )}

        {forgotStep === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Password Updated!</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => onClose()}
              className="w-full py-3 bg-[#0a3d4a] hover:bg-[#072a33] text-white font-bold text-xs rounded-xl transition shadow-md uppercase tracking-wider"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
