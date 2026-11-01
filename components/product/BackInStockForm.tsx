'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// FR-1.15: "Email me when it's back" capture for out-of-stock products
export default function BackInStockForm({ productId }: { productId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.post(`/products/${productId}/notify-me`, { email });
      setDone(true);
      toast.success(res.data?.message || "We'll email you when it's back.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save your request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-300">
        Thanks! We&apos;ll email {email} as soon as this is back in stock.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 pt-1 sm:flex-row">
      <label htmlFor="back-in-stock-email" className="sr-only">Email address</label>
      <input
        id="back-in-stock-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-11 min-w-0 flex-1 rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving}
        className="h-11 cursor-pointer whitespace-nowrap rounded-full bg-ink px-6 text-xs font-semibold uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Email me when it’s back'}
      </button>
    </form>
  );
}
