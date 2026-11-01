'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Download, Lock, RefreshCw, Scale, Wallet, X } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, AdminEmpty, Pill, SearchField, StatCard, table } from './AdminUI';

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

const CATEGORY_LABELS: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'violet' }> = {
  opening_balance: { label: 'Opening balance', tone: 'neutral' },
  sale: { label: 'Sale', tone: 'success' },
  refund: { label: 'Refund', tone: 'warning' },
  adjustment: { label: 'Adjustment', tone: 'violet' },
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

const labelCls = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark]';

function SelectField({ value, onChange, options, className, ...rest }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
  'aria-label'?: string;
}) {
  return (
    <div className={`relative ${className || ''}`}>
      <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldCls} cursor-pointer appearance-none pr-8`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
    </div>
  );
}

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-stone-500 dark:text-stone-400">
          The store&apos;s own account. Every paid order is booked in as a sale, every refund is paid out of it, and refunds are refused when the balance is too low.
        </p>
        <div className="flex gap-2">
          <AdminButton onClick={exportCsv} disabled={exporting} title="Download the statement shown below as a CSV file">
            {exporting ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
          </AdminButton>
          <AdminButton variant="ghost" onClick={() => load(page)}>
            <RefreshCw className="size-4" /> Refresh
          </AdminButton>
        </div>
      </div>

      {/* Balance and totals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard className="shadow-none" label="Current balance" icon={Wallet} value={<span className="tabular-nums">{money(balance)}</span>} hint="Available for refunds" />
        <StatCard
          className="shadow-none"
          label="Money in"
          icon={ArrowDownLeft}
          value={<span className="tabular-nums">{money(totals?.credits)}</span>}
          hint={`${totals?.saleCount || 0} ${totals?.saleCount === 1 ? 'sale' : 'sales'} · ${money(totals?.sales)}`}
        />
        <StatCard
          className="shadow-none"
          label="Money out"
          icon={ArrowUpRight}
          value={<span className="tabular-nums">{money(totals?.debits)}</span>}
          hint={`${totals?.refundCount || 0} ${totals?.refundCount === 1 ? 'refund' : 'refunds'} · ${money(totals?.refunds)}`}
        />
        <StatCard
          className="shadow-none"
          label="Net"
          icon={Scale}
          value={<span className="tabular-nums">{money((totals?.credits || 0) - (totals?.debits || 0))}</span>}
          hint={filtered ? 'For the filters below' : 'All time'}
        />
      </div>

      {/* Manual adjustment */}
      {canAdjust ? (
        <div className="rounded-lg border border-line p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Add or withdraw funds</h3>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Recorded on the statement and in the system log. The note needs at least 5 characters.</p>
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[180px_140px_1fr_auto]">
            <div>
              <label htmlFor="adj-type" className={labelCls}>Type</label>
              <SelectField
                id="adj-type"
                value={adjType}
                onChange={setAdjType}
                options={[{ value: 'credit', label: 'Add funds' }, { value: 'debit', label: 'Withdraw' }]}
              />
            </div>
            <div>
              <label htmlFor="adj-amount" className={labelCls}>Amount ($)</label>
              <input id="adj-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className={`${fieldCls} tabular-nums`} />
            </div>
            <div>
              <label htmlFor="adj-note" className={labelCls}>Note</label>
              <input id="adj-note" placeholder="Why? e.g. Owner top up, bank withdrawal" maxLength={300} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} className={fieldCls} />
            </div>
            <AdminButton variant="primary" onClick={() => setAdjConfirm(true)} disabled={!adjValid || adjusting}>
              {adjType === 'credit' ? 'Add' : 'Withdraw'}
            </AdminButton>
          </div>
          {adjType === 'debit' && adjValue > balance && <p className="mt-2 text-xs text-red-600 dark:text-red-400">You cannot withdraw more than the balance ({money(balance)}).</p>}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <Lock className="size-3.5" /> Only a super admin can add or withdraw funds by hand.
        </p>
      )}

      {/* Statement */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Statement</h3>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">Every sale, refund and adjustment, newest first.</p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchField value={query} onChange={setQuery} placeholder="Search order number or description" className="w-full lg:flex-1" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <SelectField aria-label="Money in or out" value={type} onChange={setType} options={TYPE_OPTIONS} className="lg:w-44" />
            <SelectField aria-label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="lg:w-40" />
            <input type="date" aria-label="From" title="From" value={from} onChange={(e) => setFrom(e.target.value)} className={`${fieldCls} lg:w-36`} />
            <input type="date" aria-label="To" title="To" value={to} onChange={(e) => setTo(e.target.value)} className={`${fieldCls} lg:w-36`} />
          </div>
          {filtered && (
            <AdminButton variant="ghost" size="sm" onClick={clearFilters} className="self-start lg:self-auto">
              <X className="size-3.5" /> Clear filters
            </AdminButton>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500 dark:text-stone-400">
            <RefreshCw className="size-4 animate-spin" /> Loading statement...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/[0.07] dark:text-red-300">{error}</div>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Description</th>
                  <th className={table.th}>Category</th>
                  <th className={`${table.th} text-right`}>Amount</th>
                  <th className={`${table.th} text-right`}>Balance</th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {txns.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <AdminEmpty icon={Wallet} title={`No transactions${filtered ? ' match these filters' : ' yet'}`} description={filtered ? 'Try a different search, category or date range.' : 'Paid orders, refunds and adjustments will appear here.'} />
                    </td>
                  </tr>
                )}
                {txns.map((t) => {
                  const cat = CATEGORY_LABELS[t.category];
                  return (
                    <tr key={t.id} className={`${table.tr} align-top`}>
                      <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td className={table.td}>
                        <span className="block text-stone-800 dark:text-stone-200">{t.description}</span>
                        {(t.orderNumber || t.byName) && (
                          <span className="mt-0.5 block text-xs text-stone-400">
                            {t.orderNumber && (onOpenOrder && t.order ? (
                              <button onClick={() => onOpenOrder(String(t.order))} className="cursor-pointer font-mono text-stone-600 hover:text-[#8b6f47] hover:underline dark:text-stone-300 dark:hover:text-[#c9a96b]">{t.orderNumber}</button>
                            ) : <span className="font-mono">{t.orderNumber}</span>)}
                            {t.orderNumber && t.byName && ' · '}
                            {t.byName && `by ${t.byName}`}
                          </span>
                        )}
                      </td>
                      <td className={table.td}>
                        <Pill tone={cat?.tone || 'neutral'}>{cat?.label || t.category}</Pill>
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-right font-medium tabular-nums ${t.type === 'credit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'credit' ? '+' : '-'}{money(t.amount)}
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-right tabular-nums text-stone-600 dark:text-stone-300`}>{t.balanceAfter === null ? '-' : money(t.balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <span className="tabular-nums">{total} {total === 1 ? 'transaction' : 'transactions'} &middot; Page {page} of {pages}</span>
          <div className="flex gap-2">
            <AdminButton size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</AdminButton>
            <AdminButton size="sm" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
          </div>
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
