'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { useCurrencyStore } from '@/stores/currencyStore';
import { Plus, Edit2, Trash2, X, Coins } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { AdminButton, AdminEmpty, Pill, table } from './AdminUI';

const labelCls = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:text-stone-100 dark:disabled:bg-white/[0.03]';
const iconBtn =
  'inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-100 cursor-pointer';

function ModalShell({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-xl border border-line bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
          <button type="button" onClick={onClose} className={iconBtn} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CurrenciesAdmin() {
  const toast = useToast();
  const [adminCurrencies, setAdminCurrencies] = useState<any[]>([]);
  const [showCreateCurrencyModal, setShowCreateCurrencyModal] = useState(false);
  const [showEditCurrencyModal, setShowEditCurrencyModal] = useState(false);
  const [selectedEditCurrency, setSelectedEditCurrency] = useState<any>(null);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [newCurrencyDefault, setNewCurrencyDefault] = useState(false);
  const [editCurrencySymbol, setEditCurrencySymbol] = useState('');
  const [editCurrencyRate, setEditCurrencyRate] = useState('');
  const [editCurrencyDefault, setEditCurrencyDefault] = useState(false);

  const fetchCurrencies = async () => {
    try {
      const res = await apiClient.get('/currencies');
      if (res.data?.success) {
        setAdminCurrencies(res.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to reload currencies list.');
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/currencies', {
        code: newCurrencyCode.toUpperCase().trim(),
        symbol: newCurrencySymbol.trim(),
        rate: Number(newCurrencyRate),
        isDefault: newCurrencyDefault,
      });
      if (res.data?.success) {
        toast.success(`Currency ${newCurrencyCode} added successfully!`);
        fetchCurrencies();
        setNewCurrencyCode('');
        setNewCurrencySymbol('');
        setNewCurrencyRate('');
        setNewCurrencyDefault(false);
        setShowCreateCurrencyModal(false);
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add currency.');
    }
  };

  const handleUpdateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditCurrency) return;
    const cid = selectedEditCurrency.id || selectedEditCurrency._id;
    try {
      const res = await apiClient.put(`/currencies/${cid}`, {
        symbol: editCurrencySymbol.trim(),
        rate: Number(editCurrencyRate),
        isDefault: editCurrencyDefault,
      });
      if (res.data?.success) {
        toast.success(`Currency updated successfully!`);
        fetchCurrencies();
        setShowEditCurrencyModal(false);
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update currency.');
    }
  };

  const handleDeleteCurrency = async (currency: any) => {
    if (currency.isDefault) {
      toast.error('Cannot delete the default base currency.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the currency ${currency.code}?`)) return;
    const cid = currency.id || currency._id;
    try {
      const res = await apiClient.delete(`/currencies/${cid}`);
      if (res.data?.success) {
        toast.success(`Currency deleted successfully.`);
        fetchCurrencies();
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete currency.');
    }
  };

  const handleOpenEditCurrency = (currency: any) => {
    setSelectedEditCurrency(currency);
    setEditCurrencySymbol(currency.symbol);
    setEditCurrencyRate(String(currency.rate));
    setEditCurrencyDefault(currency.isDefault);
    setShowEditCurrencyModal(true);
  };

  const loading = useSectionLoad(fetchCurrencies);
  if (loading) return <SectionLoading />;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Prices are stored in USD and shown to shoppers at these rates.
          </p>
          <AdminButton variant="primary" onClick={() => setShowCreateCurrencyModal(true)}>
            <Plus className="size-4" /> Add currency
          </AdminButton>
        </div>

        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>Code</th>
                <th className={table.th}>Symbol</th>
                <th className={`${table.th} text-right`}>Rate (per 1 USD)</th>
                <th className={table.th}>Status</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {adminCurrencies.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <AdminEmpty icon={Coins} title="No currencies yet" description="Add a currency so shoppers can browse prices in it." />
                  </td>
                </tr>
              )}
              {adminCurrencies.map((curr) => (
                <tr key={curr.id || curr._id} className={table.tr}>
                  <td className={`${table.td} font-mono text-xs font-semibold uppercase text-stone-900 dark:text-stone-100`}>{curr.code}</td>
                  <td className={`${table.td} text-base font-medium text-stone-800 dark:text-stone-200`}>{curr.symbol}</td>
                  <td className={`${table.td} whitespace-nowrap text-right tabular-nums text-stone-700 dark:text-stone-300`}>
                    <span className="text-stone-400">1 USD = </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{curr.rate.toFixed(4)}</span> {curr.code}
                  </td>
                  <td className={table.td}>
                    {curr.isDefault ? <Pill tone="accent" dot>Base currency</Pill> : <Pill>Secondary</Pill>}
                  </td>
                  <td className={`${table.td} text-right`}>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditCurrency(curr)}
                        className={iconBtn}
                        title="Edit currency"
                        aria-label={`Edit ${curr.code}`}
                      >
                        <Edit2 className="size-4" />
                      </button>
                      {!curr.isDefault && (
                        <button
                          onClick={() => handleDeleteCurrency(curr)}
                          className={`${iconBtn} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-300`}
                          title="Delete currency"
                          aria-label={`Delete ${curr.code}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateCurrencyModal && (
        <ModalShell title="Add currency" onClose={() => setShowCreateCurrencyModal(false)}>
          <form onSubmit={handleCreateCurrency}>
            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="new-currency-code" className={labelCls}>Currency code (ISO)</label>
                <input
                  id="new-currency-code"
                  type="text"
                  placeholder="e.g. BDT"
                  maxLength={3}
                  value={newCurrencyCode}
                  onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                  required
                  className={`${fieldCls} font-mono`}
                />
              </div>

              <div>
                <label htmlFor="new-currency-symbol" className={labelCls}>Symbol</label>
                <input
                  id="new-currency-symbol"
                  type="text"
                  placeholder="e.g. ৳ or BDT"
                  value={newCurrencySymbol}
                  onChange={(e) => setNewCurrencySymbol(e.target.value)}
                  required
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="new-currency-rate" className={labelCls}>Rate (1 USD = X of this currency)</label>
                <input
                  id="new-currency-rate"
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 118.0"
                  value={newCurrencyRate}
                  onChange={(e) => setNewCurrencyRate(e.target.value)}
                  required
                  className={`${fieldCls} tabular-nums`}
                />
              </div>

              <label className="flex cursor-pointer select-none items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  id="newCurrencyDefault"
                  checked={newCurrencyDefault}
                  onChange={(e) => setNewCurrencyDefault(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#8b6f47]"
                />
                <span>
                  Set as the store base currency
                  <span className="block text-xs text-stone-500 dark:text-stone-400">USD must remain 1.0 if it is not the base.</span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
              <AdminButton onClick={() => setShowCreateCurrencyModal(false)}>Cancel</AdminButton>
              <AdminButton type="submit" variant="primary">Create currency</AdminButton>
            </div>
          </form>
        </ModalShell>
      )}

      {showEditCurrencyModal && selectedEditCurrency && (
        <ModalShell title={`Edit ${selectedEditCurrency.code}`} onClose={() => setShowEditCurrencyModal(false)}>
          <form onSubmit={handleUpdateCurrency}>
            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="edit-currency-code" className={labelCls}>Currency code (ISO)</label>
                <input
                  id="edit-currency-code"
                  type="text"
                  value={selectedEditCurrency.code}
                  disabled
                  className={`${fieldCls} font-mono`}
                />
              </div>

              <div>
                <label htmlFor="edit-currency-symbol" className={labelCls}>Symbol</label>
                <input
                  id="edit-currency-symbol"
                  type="text"
                  value={editCurrencySymbol}
                  onChange={(e) => setEditCurrencySymbol(e.target.value)}
                  required
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="edit-currency-rate" className={labelCls}>Rate (1 USD = X of this currency)</label>
                <input
                  id="edit-currency-rate"
                  type="number"
                  step="0.0001"
                  value={editCurrencyRate}
                  onChange={(e) => setEditCurrencyRate(e.target.value)}
                  required
                  className={`${fieldCls} tabular-nums`}
                />
              </div>

              <label className={`flex select-none items-center gap-2.5 text-sm text-stone-700 dark:text-stone-300 ${selectedEditCurrency.isDefault ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  id="editCurrencyDefault"
                  checked={editCurrencyDefault}
                  onChange={(e) => setEditCurrencyDefault(e.target.checked)}
                  disabled={selectedEditCurrency.isDefault}
                  className="size-4 shrink-0 cursor-pointer accent-[#8b6f47] disabled:cursor-not-allowed"
                />
                Set as the store base currency
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
              <AdminButton onClick={() => setShowEditCurrencyModal(false)}>Cancel</AdminButton>
              <AdminButton type="submit" variant="primary">Save changes</AdminButton>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}
