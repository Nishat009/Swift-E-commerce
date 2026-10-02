'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { ShieldCheck, ShieldAlert, Copy, Download } from 'lucide-react';

interface TwoFactorSetupProps {
  enabled: boolean;
  /** Called after 2FA is enabled/disabled so the caller can refresh the user. */
  onChanged: () => void | Promise<void>;
}

type Mode = 'idle' | 'setup' | 'codes' | 'disable' | 'regen';

const inputCls =
  'w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8b6f47]';
const primaryBtn =
  'bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 py-2 text-xs disabled:opacity-50 transition';
const ghostBtn =
  'border border-gray-200 dark:border-gray-700 rounded-full px-6 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50';

export default function TwoFactorSetup({ enabled, onChanged }: TwoFactorSetupProps) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [secret, setSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(true);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Google-only accounts have no password; learn this so the password field can be hidden.
  useEffect(() => {
    let active = true;
    apiClient
      .get('/auth/profile')
      .then((res) => {
        const u = res.data?.data?.user;
        if (active && u && typeof u.hasPassword === 'boolean') setHasPassword(u.hasPassword);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  const reset = () => {
    setMode('idle');
    setCode('');
    setPassword('');
    setError('');
    setSecret('');
    setQrDataUrl('');
  };

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      const { secret: s, otpauthUrl } = res.data.data;
      setSecret(s);
      // Generated locally in the browser; the secret never leaves this device.
      setQrDataUrl(await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 1 }));
      setMode('setup');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start 2FA setup.');
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/2fa/enable', { code: code.trim() });
      setRecoveryCodes(res.data.data.recoveryCodes || []);
      setCode('');
      setSecret('');
      setQrDataUrl('');
      setMode('codes');
      toast.success('Two-Factor Authentication activated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code. Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError('');
    try {
      await apiClient.post('/auth/2fa/disable', { code: code.trim(), currentPassword: password });
      toast.success('Two-Factor Authentication has been disabled.');
      reset();
      await onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/2fa/recovery-codes', { code: code.trim(), currentPassword: password });
      setRecoveryCodes(res.data.data.recoveryCodes || []);
      setCode('');
      setPassword('');
      setMode('codes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate recovery codes.');
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast.success('Recovery codes copied.');
    } catch {
      toast.error('Could not copy. Please select and copy them manually.');
    }
  };

  const downloadCodes = () => {
    const blob = new Blob([`SwiftCart recovery codes (each works once)\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swiftcart-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneWithCodes = async () => {
    setRecoveryCodes([]);
    reset();
    await onChanged();
  };

  const errorBox = error && (
    <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex gap-2">
      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );

  const reauthForm = (title: string, hint: string, action: () => void, label: string, danger?: boolean) => (
    <div className="space-y-3 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
      <h4 className="font-serif text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
      <p className="text-[11px] text-gray-500 leading-relaxed">{hint}</p>
      {errorBox}
      {hasPassword && (
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Current password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      )}
      <input
        type="text"
        autoComplete="one-time-code"
        placeholder="Authenticator code or recovery code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className={inputCls}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={action}
          disabled={busy || !code.trim() || (hasPassword && !password)}
          className={danger ? 'bg-red-600 hover:bg-red-700 text-white rounded-full font-bold px-6 py-2 text-xs disabled:opacity-50' : primaryBtn}
        >
          {busy ? 'Please wait...' : label}
        </button>
        <button type="button" onClick={reset} disabled={busy} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </div>
  );

  if (mode === 'codes') {
    return (
      <div className="space-y-4 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
          Save your recovery codes now. They are shown only once.
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          If you lose your device, each of these codes can be used once to sign in. Store them somewhere safe.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-950 p-4 rounded-xl font-mono text-center text-xs font-bold text-gray-700 dark:text-gray-300">
          {recoveryCodes.map((c) => (
            <div key={c} className="tracking-wider select-all">{c}</div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyCodes} className={`${ghostBtn} inline-flex items-center gap-1.5`}>
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button type="button" onClick={downloadCodes} className={`${ghostBtn} inline-flex items-center gap-1.5`}>
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button type="button" onClick={doneWithCodes} className={primaryBtn}>
            I have saved them
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'disable') {
    return reauthForm(
      'Disable Two-Factor Authentication',
      hasPassword
        ? 'Confirm with your password and a current authenticator code (or an unused recovery code).'
        : 'Confirm with a current authenticator code (or an unused recovery code).',
      disable,
      'Disable 2FA',
      true,
    );
  }

  if (mode === 'regen') {
    return reauthForm(
      'Regenerate recovery codes',
      'Your old recovery codes will stop working. Confirm with your password and a current authenticator code.',
      regenerate,
      'Generate new codes',
    );
  }

  if (enabled && mode === 'idle') {
    return (
      <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Two-Factor Authentication is active</h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-500/80 mt-1 leading-relaxed">
              You will be asked for an authenticator code every time you sign in.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode('regen')} className={ghostBtn}>
            New recovery codes
          </button>
          <button
            type="button"
            onClick={() => setMode('disable')}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 rounded-full text-xs font-bold px-5 py-2"
          >
            Disable 2FA
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="space-y-5 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
        <h4 className="font-serif text-sm font-bold text-gray-900 dark:text-white">Configure authenticator app</h4>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {qrDataUrl && (
            <div className="p-3 bg-white border rounded-2xl flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="2FA QR code" width={220} height={220} />
            </div>
          )}
          <div className="space-y-2 text-[11px] text-gray-500 leading-relaxed">
            <p>1. Open Google Authenticator (or any TOTP app), tap <strong>+</strong> and scan this QR code.</p>
            <p className="text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 p-2 rounded-xl">
              On iPhone, scan from inside the authenticator app, not the default Camera app.
            </p>
            <p>2. Or enter this setup key manually:</p>
            <code className="block bg-gray-100 dark:bg-gray-950 p-2 rounded text-gray-900 dark:text-gray-100 font-mono tracking-wider text-[10px] font-bold select-all break-all">
              {secret}
            </code>
          </div>
        </div>
        {errorBox}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={busy}
            className={inputCls}
          />
          <div className="flex gap-2">
            <button type="button" onClick={enable} disabled={busy} className={primaryBtn}>
              {busy ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button type="button" onClick={reset} disabled={busy} className={ghostBtn}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Protect your account with an authenticator app such as Google Authenticator or Microsoft Authenticator. You will also get one-time recovery codes.
      </p>
      <button type="button" onClick={start} disabled={busy} className={primaryBtn}>
        {busy ? 'Starting...' : 'Set up 2FA'}
      </button>
    </div>
  );
}
