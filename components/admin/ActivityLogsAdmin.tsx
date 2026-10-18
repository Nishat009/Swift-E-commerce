'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { errMsg } from './adminUtils';

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

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  customer: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  guest: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
const statusClass = (code: number) =>
  code >= 500 ? 'bg-red-100 text-red-700' : code >= 400 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700';

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#8b6f47]" /> System Logs
        </h2>
        <Button variant="outline" size="sm" onClick={() => load(page)} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 p-1 bg-gray-50 dark:bg-gray-950">
        {([['activity', 'Activity'], ['requests', 'API requests']] as [View, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchView(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === id ? 'bg-white dark:bg-gray-900 text-[#8b6f47] shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {view === 'activity'
          ? 'What happened in the store: staff actions, customer actions (orders, returns, refund answers) and automatic jobs (payments, expired orders), with who did it and when.'
          : 'Every API call that changed something, and every call that failed, with who made it and how it ended. Kept for 90 days. Request contents are never stored.'}
      </p>

      <div className={`grid grid-cols-2 gap-2 ${view === 'activity' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
        <div className="relative col-span-full">
          <Input
            type="text"
            placeholder={view === 'activity' ? 'Search action, detail, name or email...' : 'Search path, email or IP...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Dropdown aria-label="Who" value={role} onChange={setRole} options={view === 'activity' ? ROLE_OPTIONS : REQUEST_ROLE_OPTIONS} />
        {view === 'activity' ? (
          <Dropdown aria-label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
        ) : (
          <>
            <Dropdown aria-label="Method" value={method} onChange={setMethod} options={METHOD_OPTIONS} />
            <Dropdown aria-label="Result" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </>
        )}
        <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm" />
        <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm" />
      </div>
      {filtered && <button onClick={clearFilters} className="text-[11px] font-bold text-[#8b6f47] underline">Clear filters</button>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Loading logs...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : view === 'activity' ? (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Who</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No log entries{filtered ? ' match these filters' : ''}.</td></tr>
              )}
              {(rows as ActivityEntry[]).map((l) => {
                const who = l.actorRole || 'admin';
                return (
                  <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 align-top">
                    <td className="p-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-xs">
                      <span className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${ROLE_BADGE[who]}`}>{who === 'admin' ? 'Staff' : who}</span>
                      {who === 'system' ? (
                        <span className="block text-gray-500">Automatic</span>
                      ) : (
                        <>
                          <span className="block font-bold text-gray-800 dark:text-gray-200">{l.adminUser?.name || 'Deleted user'}</span>
                          <span className="block text-[10px] text-gray-400">{l.adminUser?.email}</span>
                        </>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#8b6f47]/10 text-[#8b6f47] whitespace-nowrap">{l.action.replace(/_/g, ' ')}</span>
                      {l.category && l.category !== 'other' && <span className="block mt-1 text-[9px] uppercase text-gray-400">{l.category}</span>}
                    </td>
                    <td className="p-3 text-xs text-gray-700 dark:text-gray-300 max-w-[340px] break-words">{l.details}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-400">{l.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Request</th>
                <th className="p-3">Result</th>
                <th className="p-3">Who</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No requests{filtered ? ' match these filters' : ''}.</td></tr>
              )}
              {(rows as RequestEntry[]).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 align-top">
                  <td className="p-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-xs">
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mr-2">{r.method}</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400 break-all">{r.path}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusClass(r.statusCode)}`}>{r.statusCode}</span>
                    <span className="ml-2 text-[10px] text-gray-400">{r.durationMs} ms</span>
                  </td>
                  <td className="p-3 text-xs">
                    <span className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${ROLE_BADGE[r.userRole] || ROLE_BADGE.guest}`}>{r.userRole === 'admin' ? 'Staff' : r.userRole === 'guest' ? 'Signed out' : r.userRole}</span>
                    {r.userEmail && <span className="block text-[10px] text-gray-500">{r.userEmail}</span>}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-gray-400">{r.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{total} {total === 1 ? 'entry' : 'entries'} &middot; Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
