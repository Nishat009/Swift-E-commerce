'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { errMsg } from './adminUtils';

interface LogEntry {
  id: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
  adminUser?: { name?: string; email?: string } | null;
}

export default function ActivityLogsAdmin() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/enterprise/logs', { params: { page: p, limit: 15 } });
      setLogs(res.data?.data || []);
      setPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      setError(errMsg(err, 'Failed to load activity logs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          (l.adminUser?.name || '').toLowerCase().includes(q)
      )
    : logs;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#8b6f47]" /> Action Audit Log
        </h2>
        <Button variant="outline" size="sm" onClick={() => load(page)} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Every important admin action (products, orders, users, coupons, categories, campaigns) is recorded here with who did it and when.
      </p>

      <div className="relative">
        <Input
          type="text"
          placeholder="Filter this page by action, detail or admin name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-sm pl-8"
        />
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Loading logs...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No log entries.</td>
                </tr>
              )}
              {visible.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 align-top">
                  <td className="p-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-xs">
                    <span className="block font-bold text-gray-800 dark:text-gray-200">{l.adminUser?.name || 'Deleted admin'}</span>
                    <span className="block text-[10px] text-gray-400">{l.adminUser?.email}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 whitespace-nowrap">
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-700 dark:text-gray-300 max-w-[320px]">{l.details}</td>
                  <td className="p-3 font-mono text-[10px] text-gray-400">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
