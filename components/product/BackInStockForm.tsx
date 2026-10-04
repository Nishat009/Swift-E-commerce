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
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        Thanks! We&apos;ll email {email} as soon as this is back in stock.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 pt-1">
      <label htmlFor="back-in-stock-email" className="sr-only">Email address</label>
      <input
        id="back-in-stock-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 min-w-0 px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 rounded-full text-xs font-bold bg-[#8b6f47] hover:bg-[#725a38] text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Email me when it’s back'}
      </button>
    </form>
  );
}
