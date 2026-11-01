'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { ChevronDown, RefreshCw, ScrollText, X } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, AdminEmpty, FilterTabs, Pill, SearchField, table } from './AdminUI';

interface ActivityEntry {
  id: string;
  action: string;
  details: string;
  actorRole?: 'admin' | 'customer' | 'system';
  category?: string;
  ipAddress?: string;
  createdAt: string;
  adminUser?: { name?: string; email?: string } | null;
}

interface RequestEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userEmail?: string;
  userRole: string;
  ipAddress?: string;
  createdAt: string;
}

type View = 'activity' | 'requests';

const ROLE_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: 'admin', label: 'Staff' },
  { value: 'customer', label: 'Customers' },
  { value: 'system', label: 'System' },
];
const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'order', label: 'Orders' },
  { value: 'refund', label: 'Refunds' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'product', label: 'Products' },
  { value: 'user', label: 'Users' },
  { value: 'auth', label: 'Sign-in' },
  { value: 'campaign', label: 'Campaigns' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'system', label: 'System' },
  { value: 'other', label: 'Other' },
];
const METHOD_OPTIONS = [
  { value: '', label: 'All methods' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'GET', label: 'GET (failed only)' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'Any result' },
  { value: '2xx', label: 'Succeeded (2xx)' },
  { value: '4xx', label: 'Refused (4xx)' },
  { value: '5xx', label: 'Server error (5xx)' },
];
const REQUEST_ROLE_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: 'admin', label: 'Staff' },
  { value: 'customer', label: 'Customers' },
  { value: 'guest', label: 'Signed out' },
];

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'requests', label: 'API requests' },
];

const ROLE_PILL: Record<string, { tone: 'violet' | 'info' | 'neutral'; label: string }> = {
  admin: { tone: 'violet', label: 'Staff' },
  customer: { tone: 'info', label: 'Customer' },
  system: { tone: 'neutral', label: 'System' },
  guest: { tone: 'neutral', label: 'Signed out' },
};
const statusTone = (code: number) => (code >= 500 ? 'danger' : code >= 400 ? 'warning' : 'success');

const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark]';

function SelectField({ value, onChange, options, className, ...rest }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
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

/** System logs: business events from staff, customers and the system, plus the raw API request trail */
export default function ActivityLogsAdmin() {
  const [view, setView] = useState<View>('activity');
  const [rows, setRows] = useState<(ActivityEntry | RequestEntry)[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page: p, limit: 20 };
      if (role) params.role = role;
      if (from) params.from = from;
      if (to) params.to = to;
      if (q) params.q = q;
      if (view === 'activity' && category) params.category = category;
      if (view === 'requests' && method) params.method = method;
      if (view === 'requests' && status) params.status = status;
      const res = await apiClient.get(view === 'activity' ? '/enterprise/logs' : '/enterprise/request-logs', { params });
      setRows(res.data?.data || []);
      setPages(res.data?.pagination?.pages || 1);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      setError(errMsg(err, 'Failed to load the logs.'));
    } finally {
      setLoading(false);
    }
  }, [view, role, category, method, status, from, to, q]);

  useEffect(() => { setPage(1); }, [view, role, category, method, status, from, to, q]);
  useEffect(() => { load(page); }, [load, page]);

  const switchView = (next: View) => {
    if (next === view) return;
    setRows([]);
    setRole('');
    setView(next);
  };
  const filtered = Boolean(role || category || method || status || from || to || q);
  const clearFilters = () => { setRole(''); setCategory(''); setMethod(''); setStatus(''); setFrom(''); setTo(''); setQuery(''); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={VIEW_OPTIONS} value={view} onChange={switchView} />
        <AdminButton variant="ghost" onClick={() => load(page)}>
          <RefreshCw className="size-4" /> Refresh
        </AdminButton>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        {view === 'activity'
          ? 'What happened in the store: staff actions, customer actions (orders, returns, refund answers) and automatic jobs (payments, expired orders), with who did it and when.'
          : 'Every API call that changed something, and every call that failed, with who made it and how it ended. Kept for 90 days. Request contents are never stored.'}
      </p>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={view === 'activity' ? 'Search action, detail, name or email' : 'Search path, email or IP'}
          className="w-full xl:flex-1"
        />
        <div className={`grid grid-cols-2 gap-2 ${view === 'activity' ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} xl:flex xl:items-center`}>
          <SelectField aria-label="Who" value={role} onChange={setRole} options={view === 'activity' ? ROLE_OPTIONS : REQUEST_ROLE_OPTIONS} className="xl:w-36" />
          {view === 'activity' ? (
            <SelectField aria-label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="xl:w-40" />
          ) : (
            <>
              <SelectField aria-label="Method" value={method} onChange={setMethod} options={METHOD_OPTIONS} className="xl:w-40" />
              <SelectField aria-label="Result" value={status} onChange={setStatus} options={STATUS_OPTIONS} className="xl:w-44" />
            </>
          )}
          <input type="date" aria-label="From" title="From" value={from} onChange={(e) => setFrom(e.target.value)} className={`${fieldCls} xl:w-36`} />
          <input type="date" aria-label="To" title="To" value={to} onChange={(e) => setTo(e.target.value)} className={`${fieldCls} xl:w-36`} />
        </div>
        {filtered && (
          <AdminButton variant="ghost" size="sm" onClick={clearFilters} className="self-start xl:self-auto">
            <X className="size-3.5" /> Clear filters
          </AdminButton>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500 dark:text-stone-400">
          <RefreshCw className="size-4 animate-spin" /> Loading logs...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/[0.07] dark:text-red-300">{error}</div>
      ) : view === 'activity' ? (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>When</th>
                <th className={table.th}>Who</th>
                <th className={table.th}>Action</th>
                <th className={table.th}>Details</th>
                <th className={table.th}>IP</th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <AdminEmpty icon={ScrollText} title={`No log entries${filtered ? ' match these filters' : ''}`} description={filtered ? 'Try a different search or date range.' : undefined} />
                  </td>
                </tr>
              )}
              {(rows as ActivityEntry[]).map((l) => {
                const who = l.actorRole || 'admin';
                const rolePill = ROLE_PILL[who] || ROLE_PILL.guest;
                return (
                  <tr key={l.id} className={`${table.tr} align-top`}>
                    <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>{new Date(l.createdAt).toLocaleString()}</td>
                    <td className={table.td}>
                      {who === 'system' ? (
                        <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                          Automatic <Pill tone={rolePill.tone}>{rolePill.label}</Pill>
                        </span>
                      ) : (
                        <>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-medium text-stone-900 dark:text-stone-100">{l.adminUser?.name || 'Deleted user'}</span>
                            <Pill tone={rolePill.tone}>{rolePill.label}</Pill>
                          </span>
                          <span className="block text-xs text-stone-400">{l.adminUser?.email}</span>
                        </>
                      )}
                    </td>
                    <td className={table.td}>
                      <Pill>{l.action.replace(/_/g, ' ')}</Pill>
                      {l.category && l.category !== 'other' && <span className="mt-1 block text-[11px] capitalize text-stone-400">{l.category}</span>}
                    </td>
                    <td className={`${table.td} max-w-[340px] break-words text-stone-700 dark:text-stone-300`}>{l.details}</td>
                    <td className={`${table.td} whitespace-nowrap font-mono text-[11px] text-stone-400`}>{l.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>When</th>
                <th className={table.th}>Request</th>
                <th className={table.th}>Result</th>
                <th className={table.th}>Who</th>
                <th className={table.th}>IP</th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <AdminEmpty icon={ScrollText} title={`No requests${filtered ? ' match these filters' : ''}`} description={filtered ? 'Try a different search or date range.' : undefined} />
                  </td>
                </tr>
              )}
              {(rows as RequestEntry[]).map((r) => {
                const rolePill = ROLE_PILL[r.userRole] || { tone: 'neutral' as const, label: r.userRole };
                return (
                  <tr key={r.id} className={`${table.tr} align-top`}>
                    <td className={`${table.td} whitespace-nowrap text-xs text-stone-500 dark:text-stone-400`}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td className={`${table.td} text-xs`}>
                      <span className="mr-2 font-mono font-semibold text-stone-900 dark:text-stone-100">{r.method}</span>
                      <span className="break-all font-mono text-stone-600 dark:text-stone-400">{r.path}</span>
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>
                      <Pill tone={statusTone(r.statusCode)} className="tabular-nums">{r.statusCode}</Pill>
                      <span className="ml-2 text-xs tabular-nums text-stone-400">{r.durationMs} ms</span>
                    </td>
                    <td className={table.td}>
                      <Pill tone={rolePill.tone} className="capitalize">{rolePill.label}</Pill>
                      {r.userEmail && <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">{r.userEmail}</span>}
                    </td>
                    <td className={`${table.td} whitespace-nowrap font-mono text-[11px] text-stone-400`}>{r.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span className="tabular-nums">{total} {total === 1 ? 'entry' : 'entries'} &middot; Page {page} of {pages}</span>
        <div className="flex gap-2">
          <AdminButton size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</AdminButton>
          <AdminButton size="sm" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      </div>
    </div>
  );
}
