'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { ShieldCheck, ShieldAlert, ShieldOff, Copy, Download } from 'lucide-react';

interface TwoFactorSetupProps {
  enabled: boolean;
  /** Called after 2FA is enabled/disabled so the caller can refresh the user. */
  onChanged: () => void | Promise<void>;
}

type Mode = 'idle' | 'setup' | 'codes' | 'disable' | 'regen';

// Plain stone styles: this component renders in the admin panel and on the customer settings page.
const inputCls =
  'h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100';
const btnBase =
  'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';
const primaryBtn =
  `${btnBase} bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200`;
const ghostBtn =
  `${btnBase} border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:border-white/10 dark:bg-transparent dark:text-stone-200 dark:hover:bg-white/[0.06]`;
const dangerSoftBtn =
  `${btnBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50`;
const dangerBtn = `${btnBase} bg-red-600 text-white hover:bg-red-700`;
const boxCls = 'rounded-xl border border-stone-200 p-5 dark:border-white/10';
const headingCls = 'font-sans text-sm font-semibold text-stone-900 dark:text-stone-100';
const bodyCls = 'text-sm leading-relaxed text-stone-500 dark:text-stone-400';

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
    <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <ShieldAlert className="size-4 shrink-0" />
      <span>{error}</span>
    </div>
  );

  const reauthForm = (title: string, hint: string, action: () => void, label: string, danger?: boolean) => (
    <div className={`${boxCls} space-y-4`}>
      <div>
        <h4 className={headingCls}>{title}</h4>
        <p className={`mt-1 ${bodyCls}`}>{hint}</p>
      </div>
      {errorBox}
      <div className="space-y-3">
        {hasPassword && (
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            aria-label="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        )}
        <input
          type="text"
          autoComplete="one-time-code"
          placeholder="Authenticator code or recovery code"
          aria-label="Authenticator code or recovery code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={reset} disabled={busy} className={ghostBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={action}
          disabled={busy || !code.trim() || (hasPassword && !password)}
          className={danger ? dangerBtn : primaryBtn}
        >
          {busy ? 'Please wait...' : label}
        </button>
      </div>
    </div>
  );

  if (mode === 'codes') {
    return (
      <div className={`${boxCls} space-y-4`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h4 className={headingCls}>Save your recovery codes now</h4>
            <p className={`mt-1 ${bodyCls}`}>
              They are shown only once. If you lose your device, each of these codes can be used once to sign in. Store them somewhere safe.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-stone-50 p-4 text-center font-mono text-sm text-stone-800 sm:grid-cols-4 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-200">
          {recoveryCodes.map((c) => (
            <div key={c} className="select-all tracking-wider">{c}</div>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={copyCodes} className={ghostBtn}>
            <Copy className="size-4" /> Copy
          </button>
          <button type="button" onClick={downloadCodes} className={ghostBtn}>
            <Download className="size-4" /> Download
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
      'Disable two-factor authentication',
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
      <div className={`${boxCls} space-y-4`}>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h4 className={`${headingCls} flex flex-wrap items-center gap-2`}>
              Two-factor authentication
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <span className="size-1.5 rounded-full bg-current" aria-hidden /> Active
              </span>
            </h4>
            <p className={`mt-1 ${bodyCls}`}>
              You will be asked for an authenticator code every time you sign in.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-4 dark:border-white/10">
          <button type="button" onClick={() => setMode('regen')} className={ghostBtn}>
            New recovery codes
          </button>
          <button type="button" onClick={() => setMode('disable')} className={dangerSoftBtn}>
            Disable 2FA
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className={`${boxCls} space-y-5`}>
        <h4 className={headingCls}>Set up your authenticator app</h4>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {qrDataUrl && (
            <div className="shrink-0 rounded-lg border border-stone-200 bg-white p-3 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="2FA QR code" width={220} height={220} />
            </div>
          )}
          <div className="min-w-0 space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            <p>1. Open Google Authenticator (or any TOTP app), tap <strong className="font-semibold text-stone-900 dark:text-stone-100">+</strong> and scan this QR code.</p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-200">
              On iPhone, scan from inside the authenticator app, not the default Camera app.
            </p>
            <p>2. Or enter this setup key manually:</p>
            <code className="block select-all break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs tracking-wider text-stone-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100">
              {secret}
            </code>
          </div>
        </div>
        {errorBox}
        <div className="space-y-3 border-t border-stone-200 pt-4 dark:border-white/10">
          <label htmlFor="twofa-code" className="block text-xs font-medium text-stone-600 dark:text-stone-300">3. Enter the 6-digit code from the app</label>
          <input
            id="twofa-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={busy}
            className={`${inputCls} max-w-xs font-mono tracking-widest`}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={reset} disabled={busy} className={ghostBtn}>
              Cancel
            </button>
            <button type="button" onClick={enable} disabled={busy} className={primaryBtn}>
              {busy ? 'Verifying...' : 'Verify and enable'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${boxCls} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-white/[0.06] dark:text-stone-400">
          <ShieldOff className="size-5" />
        </span>
        <div>
          <h4 className={`${headingCls} flex flex-wrap items-center gap-2`}>
            Two-factor authentication
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-500/15 dark:bg-white/[0.06] dark:text-stone-300 dark:ring-white/10">
              <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden /> Off
            </span>
          </h4>
          <p className={`mt-1 ${bodyCls}`}>
            Protect your account with an authenticator app such as Google Authenticator or Microsoft Authenticator. You will also get one-time recovery codes.
          </p>
        </div>
      </div>
      <button type="button" onClick={start} disabled={busy} className={`${primaryBtn} shrink-0 self-start sm:self-center`}>
        {busy ? 'Starting...' : 'Set up 2FA'}
      </button>
    </div>
  );
}
