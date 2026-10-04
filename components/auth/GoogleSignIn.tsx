'use client';

import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import apiClient, { getAccessToken } from '@/lib/apiClient';
import { loadGoogleIdentity } from '@/lib/googleIdentity';

interface Props {
  mode?: 'signin' | 'signup' | 'link';
  rememberMe?: boolean;
  disabled?: boolean;
  redirectUrl?: string;
}

const errorMessage = (error: unknown) =>
  (isAxiosError(error) && error.response?.data?.message) ||
  (error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');

export default function GoogleSignIn({ mode = 'signin', rememberMe = false, disabled = false, redirectUrl }: Props) {
  const { loginWithGoogle, verify2FA, refreshUser } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ loginWithGoogle, rememberMe, refreshUser, disabled, redirectUrl });
  const [mounted, setMounted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'busy' | 'error' | 'linked' | 'two-factor'>('loading');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [secondFactorRemember, setSecondFactorRemember] = useState(false);

  useEffect(() => {
    latest.current = { loginWithGoogle, rememberMe, refreshUser, disabled, redirectUrl };
  }, [loginWithGoogle, rememberMe, refreshUser, disabled, redirectUrl]);

  // GIS writes an iframe and attributes into its container. Do not let a
  // third-party widget touch markup while React is hydrating it.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let active = true;
    let submitting = false;
    const element = buttonRef.current;
    async function prepare() {
      try {
        const response = await apiClient.post('/auth/google/challenge');
        const clientId = response.data?.data?.clientId;
        const nonce = response.data?.data?.nonce;
        if (!clientId || !nonce) throw new Error('Google sign-in configuration could not be loaded.');
        if (!active) return;
        const identity = await loadGoogleIdentity();
        if (!active || !element) return;
        identity.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            if (!active || submitting || latest.current.disabled) return;
            if (!credential) {
              setError('Google did not return a valid sign-in credential. Please try again.');
              setStatus('error');
              return;
            }
            submitting = true;
            setStatus('busy');
            setError('');
            try {
              if (mode === 'link') {
                // Linking is a protected action. Revalidate first so an
                // expired or cleared local session never reaches the API as
                // an opaque "no token provided" error.
                await latest.current.refreshUser();
                if (!getAccessToken()) {
                  throw new Error('Please sign in to your SwiftCart account before connecting Google.');
                }
                await apiClient.post('/auth/google/link', { credential });
                await latest.current.refreshUser();
                if (active) setStatus('linked');
              } else {
                const remember = latest.current.rememberMe;
                const result = await latest.current.loginWithGoogle(credential, remember, latest.current.redirectUrl);
                if (active && result?.require2FA) {
                  setUserId(result.userId || '');
                  setSecondFactorRemember(remember);
                  setStatus('two-factor');
                }
              }
            } catch (err) {
              if (active) {
                setError(errorMessage(err));
                setStatus('error');
              }
            } finally {
              submitting = false;
            }
          },
        });
        element.replaceChildren();
        identity.renderButton(element, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : mode === 'link' ? 'continue_with' : 'signin_with',
          // English labels, and never wider than the form column on small phones
          locale: 'en',
          width: Math.max(200, Math.min(element.clientWidth || element.parentElement?.clientWidth || 280, 400)),
        });
        if (active) setStatus('ready');
      } catch (err) {
        if (active) {
          setError(errorMessage(err));
          setStatus('error');
        }
      }
    }
    // Avoid issuing duplicate challenges during React Strict Mode's effect replay.
    queueMicrotask(() => { if (active) void prepare(); });
    return () => {
      active = false;
      element?.replaceChildren();
      window.google?.accounts?.id?.cancel();
    };
  }, [attempt, mode, mounted]);

  const retry = () => {
    setError('');
    setCode('');
    setStatus('loading');
    setAttempt(value => value + 1);
  };

  const submitSecondFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('busy');
    try {
      await verify2FA(userId, code.trim(), secondFactorRemember, latest.current.redirectUrl);
    } catch (err) {
      setError(errorMessage(err));
      setStatus('two-factor');
    }
  };

  return (
    <div className="space-y-3 text-center">
      <div
        ref={buttonRef}
        inert={disabled || status !== 'ready'}
        aria-hidden={status !== 'ready'}
        aria-busy={status === 'loading' || status === 'busy'}
        suppressHydrationWarning
        className={`flex min-h-10 justify-center ${status !== 'ready' ? 'hidden' : ''} ${disabled ? 'opacity-50' : ''}`}
      />
      {(status === 'loading' || status === 'busy') && (
        <p role="status" className="text-xs text-gray-500">{status === 'loading' ? 'Loading Google sign-in…' : 'Verifying your account…'}</p>
      )}
      {status === 'linked' && <p role="status" className="text-sm text-emerald-600">Google is connected.</p>}
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {status === 'error' && <button type="button" onClick={retry} className="text-xs underline">Try Google again</button>}
      {status === 'two-factor' && (
        <form onSubmit={submitSecondFactor} className="space-y-3">
          <label htmlFor="google-two-factor" className="block text-sm font-medium">Enter your authenticator or recovery code</label>
          <input id="google-two-factor" value={code} onChange={event => setCode(event.target.value)}
            autoComplete="one-time-code" maxLength={8} required autoFocus
            className="w-full rounded-xl border border-gray-300 p-3 text-center dark:bg-gray-900" />
          <button type="submit" disabled={disabled || !code.trim()} className="w-full rounded-xl bg-emerald-700 p-3 text-sm text-white disabled:opacity-50">Verify and sign in</button>
          <button type="button" onClick={retry} className="text-xs underline">Start Google sign-in again</button>
        </form>
      )}
    </div>
  );
}
