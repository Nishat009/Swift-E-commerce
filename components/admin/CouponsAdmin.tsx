'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit2, Trash2, X, Loader2, TicketPercent, ChevronDown } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, AdminEmpty, Pill, table } from './AdminUI';

interface Coupon {
  id: string;
  code: string;
  percentage: number;
  amount: number;
  expiry: string;
  active: boolean;
}

const emptyForm = { code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', expiry: '', active: true };

const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const inputClass = 'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark]';
const iconButton = 'w-8 px-0 text-stone-500 dark:text-stone-400';

export default function CouponsAdmin() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiClient.get('/coupons');
      setCoupons(res.data?.data || []);
    } catch (err) {
      setLoadError(errMsg(err, 'Failed to load coupons.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.percentage > 0 ? 'percentage' : 'fixed',
      value: String(c.percentage > 0 ? c.percentage : c.amount),
      expiry: c.expiry ? new Date(c.expiry).toISOString().split('T')[0] : '',
      active: c.active,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim()) return toast.error('Coupon code is required.');
    if (!(value > 0)) return toast.error('Discount value must be greater than 0.');
    if (form.type === 'percentage' && value > 100) return toast.error('Percentage cannot be more than 100.');
    if (!form.expiry) return toast.error('Expiry date is required.');

    const payload = {
      code: form.code.trim().toUpperCase(),
      percentage: form.type === 'percentage' ? value : 0,
      amount: form.type === 'fixed' ? value : 0,
      // valid through the end of the chosen day
      expiry: new Date(`${form.expiry}T23:59:59`).toISOString(),
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/coupons/${editing.id}`, payload);
        toast.success('Coupon updated.');
      } else {
        await apiClient.post('/coupons', payload);
        toast.success('Coupon created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Failed to save coupon.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await apiClient.put(`/coupons/${c.id}`, {
        code: c.code,
        percentage: c.percentage,
        amount: c.amount,
        expiry: c.expiry,
        active: !c.active,
      });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
      toast.success(`Coupon ${c.code} ${!c.active ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update coupon.'));
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}? Customers will no longer be able to use it.`)) return;
    try {
      await apiClient.delete(`/coupons/${c.id}`);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Coupon deleted.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to delete coupon.'));
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500 dark:text-stone-400">Codes customers enter at checkout. Click a status to turn a coupon on or off.</p>
        <AdminButton variant="primary" onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" /> New coupon
        </AdminButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-line py-16 text-sm text-stone-500 dark:text-stone-400">
          <Loader2 className="size-4 animate-spin" /> Loading coupons...
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <span>{loadError}</span>
          <AdminButton size="sm" onClick={load}>Retry</AdminButton>
        </div>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>Code</th>
                <th className={`${table.th} text-right`}>Discount</th>
                <th className={table.th}>Valid until</th>
                <th className={table.th}>Status</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <AdminEmpty icon={TicketPercent} title="No coupons yet" description="Create your first one with New coupon." />
                  </td>
                </tr>
              )}
              {coupons.map((c) => {
                const expired = new Date(c.expiry).getTime() < now;
                return (
                  <tr key={c.id} className={table.tr}>
                    <td className={`${table.td} font-mono text-[13px] font-medium text-stone-900 dark:text-stone-100`}>{c.code}</td>
                    <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>
                      {c.percentage > 0 ? `${c.percentage}% off` : `$${c.amount.toFixed(2)} off`}
                    </td>
                    <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>{new Date(c.expiry).toLocaleDateString()}</td>
                    <td className={table.td}>
                      {expired ? (
                        <Pill>Expired</Pill>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleActive(c)}
                          className="rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f47]/40"
                          title={c.active ? 'Click to disable' : 'Click to activate'}
                        >
                          <Pill tone={c.active ? 'success' : 'danger'} dot>{c.active ? 'Active' : 'Disabled'}</Pill>
                        </button>
                      )}
                    </td>
                    <td className={`${table.td} text-right`}>
                      <div className="flex justify-end gap-1">
                        <AdminButton variant="ghost" size="sm" onClick={() => openEdit(c)} className={iconButton} title="Edit coupon" aria-label={`Edit ${c.code}`}>
                          <Edit2 className="size-3.5" />
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(c)}
                          className={`${iconButton} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300`}
                          title="Delete coupon"
                          aria-label={`Delete ${c.code}`}
                        >
                          <Trash2 className="size-3.5" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title" className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <h3 id="coupon-modal-title" className="pr-8 text-base font-semibold text-stone-900 dark:text-white">
              {editing ? `Edit coupon ${editing.code}` : 'New coupon'}
            </h3>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="coupon-code" className={labelClass}>Code</label>
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className={`${inputClass} font-mono font-medium`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="coupon-type" className={labelClass}>Discount type</label>
                  <div className="relative">
                    <select
                      id="coupon-type"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                      className={`${inputClass} cursor-pointer appearance-none pr-9`}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount ($)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="coupon-value" className={labelClass}>
                    {form.type === 'percentage' ? 'Percent off' : 'Amount off'}
                  </label>
                  <input
                    id="coupon-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="coupon-expiry" className={labelClass}>Valid until</label>
                <input
                  id="coupon-expiry"
                  type="date"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="size-4 accent-[#8b6f47]"
                />
                Active (customers can use it at checkout)
              </label>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <AdminButton onClick={() => setModalOpen(false)}>Cancel</AdminButton>
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? 'Save changes' : 'Create coupon'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
