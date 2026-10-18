'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ArrowDownLeft, ArrowUpRight, Download, RefreshCw, Search, Wallet } from 'lucide-react';
import { errMsg } from './adminUtils';

interface Txn {
  id: string;
  type: 'credit' | 'debit';
  category: 'opening_balance' | 'sale' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number | null;
  description: string;
  orderNumber?: string;
  order?: string | null;
  byName?: string;
  createdAt: string;
}

interface Totals {
  credits: number;
  debits: number;
  sales: number;
  saleCount: number;
  refunds: number;
  refundCount: number;
  adjustments: number;
}

const money = (n: number | null | undefined) =>
  `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_LABELS: Record<string, { label: string; className: string }> = {
  opening_balance: { label: 'Opening balance', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sale: { label: 'Sale', className: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  refund: { label: 'Refund', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  adjustment: { label: 'Adjustment', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
};

const TYPE_OPTIONS = [
  { value: '', label: 'Money in and out' },
  { value: 'credit', label: 'Money in' },
  { value: 'debit', label: 'Money out' },
];
const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'sale', label: 'Sales' },
  { value: 'refund', label: 'Refunds' },
  { value: 'adjustment', label: 'Adjustments' },
  { value: 'opening_balance', label: 'Opening balance' },
];

/** Store account (admin only): wallet balance, statement of every sale / refund / adjustment, and manual adjustments */
export default function WalletAdmin({ onOpenOrder }: { onOpenOrder?: (orderId: string) => void }) {
  const toast = useToast();
  const [balance, setBalance] = useState(0);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [canAdjust, setCanAdjust] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [adjType, setAdjType] = useState('credit');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [adjConfirm, setAdjConfirm] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const params = useCallback(() => {
    const p: Record<string, string> = {};
    if (type) p.type = type;
    if (category) p.category = category;
    if (from) p.from = from;
    if (to) p.to = to;
    if (debouncedQuery) p.q = debouncedQuery;
    return p;
  }, [type, category, from, to, debouncedQuery]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/admin/wallet', { params: { ...params(), page: p, limit: 20 } });
      const data = res.data?.data || {};
      setBalance(data.balance || 0);
      setTotals(data.totals || null);
      setTxns(data.transactions || []);
      setPages(res.data?.pagination?.pages || 1);
      setTotal(res.data?.pagination?.total || 0);
      setCanAdjust(Boolean(res.data?.canAdjust));
    } catch (err) {
      setError(errMsg(err, 'Failed to load the store wallet.'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  // New filters start again from page 1
  useEffect(() => { setPage(1); }, [type, category, from, to, debouncedQuery]);
  useEffect(() => { load(page); }, [load, page]);

  const filtered = Boolean(type || category || from || to || debouncedQuery);
  const clearFilters = () => { setType(''); setCategory(''); setFrom(''); setTo(''); setQuery(''); };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get('/admin/wallet/statement.csv', { params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-statement-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to export the statement.'));
    } finally {
      setExporting(false);
    }
  };

  const adjValue = Number(adjAmount);
  const adjValid = Number.isFinite(adjValue) && adjValue > 0 && adjNote.trim().length >= 5 && (adjType === 'credit' || adjValue <= balance);

  const adjust = async () => {
    setAdjusting(true);
    try {
      await apiClient.post('/admin/wallet/adjust', { type: adjType, amount: adjValue, note: adjNote.trim() });
      toast.success(adjType === 'credit' ? `${money(adjValue)} added to the store wallet.` : `${money(adjValue)} withdrawn from the store wallet.`);
      setAdjAmount('');
      setAdjNote('');
      setPage(1);
      await load(1);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to adjust the wallet.'));
    } finally {
      setAdjusting(false);
      setAdjConfirm(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#8b6f47]" /> Accounts &amp; Wallet
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} loading={exporting} className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => load(page)} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        The store&apos;s own account. Every paid order is booked in as a sale, every refund is paid out of it, and refunds are refused when the balance is too low.
      </p>

      {/* Balance and totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1 rounded-2xl bg-[#8b6f47] text-white p-4">
          <span className="block text-[10px] font-black uppercase tracking-widest text-white/70">Current balance</span>
          <span className="block text-2xl font-extrabold mt-1">{money(balance)}</span>
          <span className="block text-[10px] text-white/70 mt-1">Available for refunds</span>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400"><ArrowDownLeft className="w-3 h-3 text-green-600" /> Money in</span>
          <span className="block text-lg font-extrabold text-green-700 dark:text-green-400 mt-1">{money(totals?.credits)}</span>
          <span className="block text-[10px] text-gray-400">{totals?.saleCount || 0} sales &middot; {money(totals?.sales)}</span>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400"><ArrowUpRight className="w-3 h-3 text-red-600" /> Money out</span>
          <span className="block text-lg font-extrabold text-red-600 dark:text-red-400 mt-1">{money(totals?.debits)}</span>
          <span className="block text-[10px] text-gray-400">{totals?.refundCount || 0} refunds &middot; {money(totals?.refunds)}</span>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Net</span>
          <span className="block text-lg font-extrabold text-gray-800 dark:text-gray-100 mt-1">{money((totals?.credits || 0) - (totals?.debits || 0))}</span>
          <span className="block text-[10px] text-gray-400">{filtered ? 'For the filters below' : 'All time'}</span>
        </div>
      </div>

      {/* Manual adjustment */}
      {canAdjust ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-3">Add or withdraw funds</p>
          <div className="grid sm:grid-cols-[180px_140px_1fr_auto] gap-2 items-start">
            <Dropdown
              aria-label="Adjustment type"
              value={adjType}
              onChange={setAdjType}
              options={[{ value: 'credit', label: 'Add funds' }, { value: 'debit', label: 'Withdraw' }]}
            />
            <Input type="number" min="0.01" step="0.01" placeholder="Amount ($)" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="text-sm" />
            <Input placeholder="Why? e.g. Owner top up, bank withdrawal" maxLength={300} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} className="text-sm" />
            <Button onClick={() => setAdjConfirm(true)} disabled={!adjValid || adjusting} className="text-sm py-2.5 px-5 font-bold rounded-xl bg-[#8b6f47] text-white">
              {adjType === 'credit' ? 'Add' : 'Withdraw'}
            </Button>
          </div>
          {adjType === 'debit' && adjValue > balance && <p className="text-[10px] text-red-600 mt-1.5">You cannot withdraw more than the balance ({money(balance)}).</p>}
        </div>
      ) : (
        <p className="text-[11px] text-gray-500">Only a super admin can add or withdraw funds by hand.</p>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-[1fr_170px_170px_140px_140px] gap-2">
        <div className="relative col-span-2 lg:col-span-1">
          <Input placeholder="Search order number or description..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full text-sm pl-8" />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Dropdown aria-label="Money in or out" value={type} onChange={setType} options={TYPE_OPTIONS} />
        <Dropdown aria-label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
        <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm" />
        <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm" />
      </div>
      {filtered && (
        <button onClick={clearFilters} className="text-[11px] font-bold text-[#8b6f47] underline">Clear filters</button>
      )}

      {/* Statement */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Loading statement...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {txns.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions{filtered ? ' match these filters' : ' yet'}.</td></tr>
              )}
              {txns.map((t) => {
                const cat = CATEGORY_LABELS[t.category];
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 align-top">
                    <td className="p-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-xs">
                      <span className="block text-gray-800 dark:text-gray-200">{t.description}</span>
                      <span className="block text-[10px] text-gray-400">
                        {t.orderNumber && (onOpenOrder && t.order ? (
                          <button onClick={() => onOpenOrder(String(t.order))} className="font-mono text-[#8b6f47] hover:underline">{t.orderNumber}</button>
                        ) : <span className="font-mono">{t.orderNumber}</span>)}
                        {t.orderNumber && t.byName && ' · '}
                        {t.byName && `by ${t.byName}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${cat?.className || ''}`}>{cat?.label || t.category}</span>
                    </td>
                    <td className={`p-3 text-right font-bold whitespace-nowrap ${t.type === 'credit' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'credit' ? '+' : '-'}{money(t.amount)}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.balanceAfter === null ? '-' : money(t.balanceAfter)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{total} {total === 1 ? 'transaction' : 'transactions'} &middot; Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={adjConfirm}
        onClose={() => setAdjConfirm(false)}
        onConfirm={adjust}
        title={adjType === 'credit' ? 'Add funds to the store wallet?' : 'Withdraw from the store wallet?'}
        message={`${adjType === 'credit' ? 'Add' : 'Withdraw'} ${money(adjValue)} (“${adjNote.trim()}”). The balance becomes ${money(adjType === 'credit' ? balance + adjValue : balance - adjValue)}. This is recorded on the statement and in the system log.`}
        confirmText={adjType === 'credit' ? 'Yes, add funds' : 'Yes, withdraw'}
        cancelText="Go back"
        variant={adjType === 'credit' ? 'primary' : 'warning'}
        isLoading={adjusting}
      />
    </div>
  );
}
