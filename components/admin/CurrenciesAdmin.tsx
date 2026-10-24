'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCurrencyStore } from '@/stores/currencyStore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';

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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Dynamic Currencies (Store Localization)</h2>
          <Button onClick={() => setShowCreateCurrencyModal(true)} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Currency
          </Button>
        </div>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Rate (relative to USD)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {adminCurrencies.map((curr) => (
                <tr key={curr.id || curr._id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-mono font-bold text-gray-850 dark:text-white uppercase">{curr.code}</td>
                  <td className="p-3 text-lg font-bold text-gray-800 dark:text-gray-250 font-serif">{curr.symbol}</td>
                  <td className="p-3 font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b]">
                    1.00 USD = {curr.rate.toFixed(4)} {curr.code}
                  </td>
                  <td className="p-3">
                    {curr.isDefault ? (
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        Base Currency
                      </span>
                    ) : (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        Secondary
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditCurrency(curr)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer"
                        title="Edit Currency Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!curr.isDefault && (
                        <button
                          onClick={() => handleDeleteCurrency(curr)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                          title="Delete Currency"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowCreateCurrencyModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8b6f47]" /> Add Dynamic Currency
            </h3>

            <form onSubmit={handleCreateCurrency} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency Code (ISO)</label>
                <Input
                  type="text"
                  placeholder="e.g. BDT"
                  maxLength={3}
                  value={newCurrencyCode}
                  onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                  required
                  className="w-full text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Symbol</label>
                <Input
                  type="text"
                  placeholder="e.g. ৳ or BDT"
                  value={newCurrencySymbol}
                  onChange={(e) => setNewCurrencySymbol(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (1.00 USD = X Currency)</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 118.0"
                  value={newCurrencyRate}
                  onChange={(e) => setNewCurrencyRate(e.target.value)}
                  required
                  className="w-full text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newCurrencyDefault"
                  checked={newCurrencyDefault}
                  onChange={(e) => setNewCurrencyDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newCurrencyDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Set as store base currency (USD must remain 1.0 if not base)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Create Currency
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CURRENCY DIALOG MODAL */}
      {showEditCurrencyModal && selectedEditCurrency && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowEditCurrencyModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#8b6f47]" /> Edit Currency: {selectedEditCurrency.code}
            </h3>

            <form onSubmit={handleUpdateCurrency} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency Code (ISO)</label>
                <Input
                  type="text"
                  value={selectedEditCurrency.code}
                  disabled
                  className="w-full text-sm font-mono font-bold bg-gray-50/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Symbol</label>
                <Input
                  type="text"
                  value={editCurrencySymbol}
                  onChange={(e) => setEditCurrencySymbol(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (1.00 USD = X Currency)</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editCurrencyRate}
                  onChange={(e) => setEditCurrencyRate(e.target.value)}
                  required
                  className="w-full text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editCurrencyDefault"
                  checked={editCurrencyDefault}
                  onChange={(e) => setEditCurrencyDefault(e.target.checked)}
                  disabled={selectedEditCurrency.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editCurrencyDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Set as store base currency
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Update Currency Rate
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
