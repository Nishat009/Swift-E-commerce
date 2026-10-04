'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { errMsg } from './adminUtils';

interface Stats {
  systemStatus: string;
  database: string;
  uptimeSeconds: number;
  api: { totalRequests: number; serverErrors: number; clientErrors: number; successRate: number; avgResponseTime: number };
  resources: { cpu: number; ram: number; processMemoryMb: number };
  business: {
    ordersLast24h: number;
    revenueLast24h: number;
    newUsersLast24h: number;
    pendingOrders: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeProducts: number;
    totalUsers: number;
    adminActionsLast24h: number;
  };
  note?: string;
}

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d ? d + 'd ' : ''}${h}h ${m}m`;
};

function Tile({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'warn' | 'bad' | 'good' }) {
  const toneClass =
    tone === 'warn' ? 'text-amber-600' : tone === 'bad' ? 'text-red-600' : tone === 'good' ? 'text-emerald-600' : 'text-gray-900 dark:text-white';
  return (
    <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/40">
      <span className="block text-[10px] text-gray-400 uppercase font-black">{label}</span>
      <span className={`text-lg font-black mt-1 block ${toneClass}`}>{value}</span>
    </div>
  );
}

function Meter({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
        <span>{label}</span>
        <span>{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${clamped > 85 ? 'bg-red-500' : clamped > 65 ? 'bg-amber-500' : 'bg-[#8b6f47]'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function MonitoringAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await apiClient.get('/enterprise/monitoring-stats');
      setStats(res.data?.data || null);
      setError('');
    } catch (err) {
      setError(errMsg(err, 'Failed to load system stats.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#8b6f47]" /> System Monitoring
        </h2>
        <Button variant="outline" size="sm" onClick={() => load()} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Reading server metrics...
        </div>
      ) : error && !stats ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : stats ? (
        <>
          {error && <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs">Last refresh failed: {error}</div>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="System status" value={stats.systemStatus === 'healthy' ? 'Healthy' : 'Degraded'} tone={stats.systemStatus === 'healthy' ? 'good' : 'bad'} />
            <Tile label="Database" value={stats.database} tone={stats.database === 'connected' ? 'good' : 'bad'} />
            <Tile label="Server uptime" value={formatUptime(stats.uptimeSeconds)} />
            <Tile label="API success rate" value={`${stats.api.successRate.toFixed(2)}%`} tone={stats.api.successRate >= 99 ? 'good' : 'warn'} />
            <Tile label="Requests served" value={stats.api.totalRequests.toLocaleString()} />
            <Tile label="Avg response time" value={`${stats.api.avgResponseTime.toFixed(0)} ms`} />
            <Tile label="Server errors (5xx)" value={stats.api.serverErrors} tone={stats.api.serverErrors > 0 ? 'bad' : 'default'} />
            <Tile label="Client errors (4xx)" value={stats.api.clientErrors} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Server resources</h4>
              <Meter label="CPU usage" pct={stats.resources.cpu} />
              <Meter label="System memory in use" pct={stats.resources.ram} />
              <p className="text-[10px] text-gray-400">API process memory: {stats.resources.processMemoryMb.toFixed(0)} MB</p>
            </div>

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Shop activity (last 24h)</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Tile label="Orders" value={stats.business.ordersLast24h} />
                <Tile label="Revenue" value={`$${stats.business.revenueLast24h.toFixed(2)}`} />
                <Tile label="New customers" value={stats.business.newUsersLast24h} />
                <Tile label="Admin actions" value={stats.business.adminActionsLast24h} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Orders to process" value={stats.business.pendingOrders} tone={stats.business.pendingOrders > 0 ? 'warn' : 'default'} />
            <Tile label="Low stock items" value={stats.business.lowStockCount} tone={stats.business.lowStockCount > 0 ? 'warn' : 'default'} />
            <Tile label="Out of stock" value={stats.business.outOfStockCount} tone={stats.business.outOfStockCount > 0 ? 'bad' : 'default'} />
            <Tile label="Active products / users" value={`${stats.business.activeProducts} / ${stats.business.totalUsers}`} />
          </div>

          {stats.note && <p className="text-[10px] text-gray-400">{stats.note} Auto-refreshes every 20 seconds.</p>}
        </>
      ) : null}
    </div>
  );
}
