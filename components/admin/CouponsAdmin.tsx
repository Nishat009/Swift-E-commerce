'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, RefreshCw, Gift } from 'lucide-react';
import { errMsg } from './adminUtils';

interface Coupon {
  id: string;
  code: string;
  percentage: number;
  amount: number;
  expiry: string;
  active: boolean;
}

const emptyForm = { code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', expiry: '', active: true };

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#8b6f47]" /> Discount Coupons
        </h2>
        <Button onClick={openCreate} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Loading coupons...
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Valid until</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No coupons yet. Create your first one with the button above.
                  </td>
                </tr>
              )}
              {coupons.map((c) => {
                const expired = new Date(c.expiry).getTime() < now;
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">{c.code}</td>
                    <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">
                      {c.percentage > 0 ? `${c.percentage}% off` : `$${c.amount.toFixed(2)} off`}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{new Date(c.expiry).toLocaleDateString()}</td>
                    <td className="p-3">
                      {expired ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-600">Expired</span>
                      ) : (
                        <button
                          onClick={() => toggleActive(c)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer ${
                            c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                          title="Click to toggle"
                        >
                          {c.active ? 'Active' : 'Disabled'}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit coupon">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete coupon">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">
              {editing ? `Edit coupon ${editing.code}` : 'New coupon'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Code</label>
                <Input
                  type="text"
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full text-sm font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Discount type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    {form.type === 'percentage' ? 'Percent off' : 'Amount off'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                    className="w-full text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Valid until</label>
                <input
                  type="date"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  required
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-gray-300 text-[#8b6f47]"
                />
                Active (customers can use it at checkout)
              </label>
              <Button type="submit" loading={saving} className="w-full text-sm py-2.5 font-bold rounded-xl bg-[#8b6f47] text-white">
                {editing ? 'Save changes' : 'Create coupon'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
