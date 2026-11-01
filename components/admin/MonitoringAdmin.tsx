'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { RefreshCw } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, Pill, StatCard } from './AdminUI';

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

type Tone = 'default' | 'warn' | 'bad' | 'good';
const TONE_DOT: Record<Tone, string> = {
  default: '',
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-red-500',
};

/** KPI tile; a tone adds a status dot beside the value (the value text always carries the meaning). */
function Tile({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: Tone }) {
  return (
    <StatCard
      className="shadow-none"
      label={label}
      value={
        <span className="flex items-center gap-2 tabular-nums">
          {tone !== 'default' && <span className={`size-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} aria-hidden />}
          <span className="inline-block first-letter:uppercase">{value}</span>
        </span>
      }
    />
  );
}

function Meter({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const level = clamped > 85 ? 'bad' : clamped > 65 ? 'warn' : 'ok';
  return (
    <div title={`${label}: ${clamped.toFixed(1)}%`}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="text-stone-700 dark:text-stone-300">{label}</span>
        <span className="flex items-center gap-2">
          {level === 'bad' && <Pill tone="danger">Critical</Pill>}
          {level === 'warn' && <Pill tone="warning">High</Pill>}
          <span className="font-medium tabular-nums text-stone-900 dark:text-white">{clamped.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${level === 'bad' ? 'bg-red-500' : level === 'warn' ? 'bg-amber-500' : 'bg-[#a0702a] dark:bg-[#b8862f]'}`}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500 dark:text-stone-400">Live figures from the API server. Updates every 20 seconds.</p>
        <AdminButton variant="ghost" onClick={() => load()}>
          <RefreshCw className="size-4" /> Refresh
        </AdminButton>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500 dark:text-stone-400">
          <RefreshCw className="size-4 animate-spin" /> Reading server metrics...
        </div>
      ) : error && !stats ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/[0.07] dark:text-red-300">{error}</div>
      ) : stats ? (
        <>
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-200">
              Last refresh failed: {error}
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Server and API</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Tile label="System status" value={stats.systemStatus === 'healthy' ? 'Healthy' : 'Degraded'} tone={stats.systemStatus === 'healthy' ? 'good' : 'bad'} />
              <Tile label="Database" value={stats.database} tone={stats.database === 'connected' ? 'good' : 'bad'} />
              <Tile label="Server uptime" value={formatUptime(stats.uptimeSeconds)} />
              <Tile label="API success rate" value={`${stats.api.successRate.toFixed(2)}%`} tone={stats.api.successRate >= 99 ? 'good' : 'warn'} />
              <Tile label="Requests served" value={stats.api.totalRequests.toLocaleString()} />
              <Tile label="Avg response time" value={`${stats.api.avgResponseTime.toFixed(0)} ms`} />
              <Tile label="Server errors (5xx)" value={stats.api.serverErrors} tone={stats.api.serverErrors > 0 ? 'bad' : 'default'} />
              <Tile label="Client errors (4xx)" value={stats.api.clientErrors} />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-line p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Server resources</h3>
              <Meter label="CPU usage" pct={stats.resources.cpu} />
              <Meter label="System memory in use" pct={stats.resources.ram} />
              <p className="text-xs text-stone-500 dark:text-stone-400">API process memory: <span className="tabular-nums">{stats.resources.processMemoryMb.toFixed(0)} MB</span></p>
            </div>

            <div className="rounded-lg border border-line p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Shop activity (last 24h)</h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                {[
                  { label: 'Orders', value: stats.business.ordersLast24h },
                  { label: 'Revenue', value: `$${stats.business.revenueLast24h.toFixed(2)}` },
                  { label: 'New customers', value: stats.business.newUsersLast24h },
                  { label: 'Admin actions', value: stats.business.adminActionsLast24h },
                ].map((m) => (
                  <div key={m.label}>
                    <dt className="text-xs text-stone-500 dark:text-stone-400">{m.label}</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-stone-900 dark:text-white">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Needs attention</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Tile label="Orders to process" value={stats.business.pendingOrders} tone={stats.business.pendingOrders > 0 ? 'warn' : 'default'} />
              <Tile label="Low stock items" value={stats.business.lowStockCount} tone={stats.business.lowStockCount > 0 ? 'warn' : 'default'} />
              <Tile label="Out of stock" value={stats.business.outOfStockCount} tone={stats.business.outOfStockCount > 0 ? 'bad' : 'default'} />
              <Tile label="Active products / users" value={`${stats.business.activeProducts} / ${stats.business.totalUsers}`} />
            </div>
          </section>

          {stats.note && <p className="text-xs text-stone-500 dark:text-stone-400">{stats.note} Auto-refreshes every 20 seconds.</p>}
        </>
      ) : null}
    </div>
  );
}
