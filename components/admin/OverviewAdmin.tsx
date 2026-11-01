'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { Product, Order } from '@/types';
import AISalesAdvisor from '@/features/ai/product-ai/AISalesAdvisor';
import { CircleDollarSign, ShoppingBag, Users, Receipt, ArrowRight, PackageCheck, AlertTriangle } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { Panel, StatCard, StatusPill, Pill, AdminEmpty, AdminButton, table } from './AdminUI';
import type { AdminTab } from './adminNav';

interface DashboardData {
  stats: {
    totalSales: number;
    revenue: number;
    ordersCount: number;
    activeOrdersCount?: number;
    customersCount: number;
    productsCount: number;
  };
  ordersByStatus?: { status: string; count: number }[];
  monthlyRevenue?: { month: string; revenue: number }[];
  topSellingProducts?: { product: Product; totalQuantity: number; totalSales: number }[];
  recentOrders: Order[];
  lowStockProducts: Product[];
}

// Order lifecycle, so the pipeline reads top to bottom in the order an order moves through it
const PIPELINE = ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const compactMoney = (n: number) => (n >= 10000 ? `$${Math.round(n / 1000)}K` : money(n));

/** A round tick step for an axis that has to reach `max`. */
function niceStep(max: number, ticks = 4) {
  const raw = Math.max(max, 1) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const r = raw / mag;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
}

/** Last six calendar months, zero-filled where the API has no orders. */
function lastSixMonths(rows: { month: string; revenue: number }[] = []) {
  const byKey = new Map(rows.map((r) => [r.month, r.revenue]));
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return { key, label: MONTHS[d.getMonth()], revenue: byKey.get(key) || 0 };
  });
}

/** Single-series column chart: monthly revenue. One hue, no legend (the panel title names it). */
function RevenueChart({ rows }: { rows: { key: string; label: string; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.revenue), 0);
  const step = niceStep(max);
  const top = Math.max(step * Math.ceil(max / step), step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const peak = rows.reduce((best, r, i) => (r.revenue > rows[best].revenue ? i : best), 0);
  const last = rows.length - 1;

  return (
    <div>
      <div className="relative flex h-56 gap-3">
        {/* y axis */}
        <div className="relative w-12 shrink-0 text-right text-[11px] tabular-nums text-stone-400">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {compactMoney(t)}
            </span>
          ))}
        </div>
        {/* plot */}
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? 'border-stone-300 dark:border-white/15' : 'border-stone-200/80 dark:border-white/[0.07]'}`}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end">
            {rows.map((r, i) => {
              const h = (r.revenue / top) * 100;
              const labelled = r.revenue > 0 && (i === peak || i === last);
              return (
                <div
                  key={r.key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${r.key}: ${money(r.revenue)}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                >
                  {hover === i && <div className="absolute inset-y-0 inset-x-1 rounded-md bg-stone-100/80 dark:bg-white/[0.04]" />}
                  <div
                    className="relative w-6 max-w-[60%] rounded-t-[4px] bg-[#a0702a] transition-opacity dark:bg-[#b8862f]"
                    style={{ height: `${Math.max(h, r.revenue > 0 ? 1.5 : 0)}%`, opacity: hover === null || hover === i ? 1 : 0.55 }}
                  >
                    {labelled && hover !== i && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium tabular-nums text-stone-600 dark:text-stone-300">
                        {compactMoney(r.revenue)}
                      </span>
                    )}
                  </div>
                  {hover === i && (
                    <div
                      className="pointer-events-none absolute z-10 -translate-y-2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-left shadow-lg"
                      style={{ bottom: `${Math.min(h, 80)}%` }}
                    >
                      <p className="text-sm font-semibold tabular-nums text-stone-900 dark:text-white">{money(r.revenue)}</p>
                      <p className="text-[11px] text-stone-500">{r.key}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* x axis */}
      <div className="ml-[60px] mt-2 flex text-[11px] text-stone-400">
        {rows.map((r) => (
          <span key={r.key} className="flex-1 text-center">{r.label}</span>
        ))}
      </div>
      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>Revenue by month</caption>
        <thead><tr><th>Month</th><th>Revenue</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.key}><td>{r.key}</td><td>{money(r.revenue)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/** Admin home: KPIs, revenue trend, order pipeline, recent orders, best sellers and low stock. */
export default function OverviewAdmin({ onNavigate }: { onNavigate?: (tab: AdminTab) => void }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/admin/dashboard');
    if (res.data?.success) setDashboard(res.data.data);
  });

  if (loading) return <SectionLoading />;
  if (!dashboard) return null;

  const { stats } = dashboard;
  const statusCounts = new Map((dashboard.ordersByStatus || []).map((s) => [s.status, s.count]));
  const pipeline = [...PIPELINE, ...[...statusCounts.keys()].filter((s) => !PIPELINE.includes(s))]
    .map((status) => ({ status, count: statusCounts.get(status) || 0 }))
    .filter((s) => s.count > 0);
  const pipelineMax = Math.max(...pipeline.map((s) => s.count), 1);
  const activeOrders = stats.activeOrdersCount ?? stats.ordersCount - (statusCounts.get('Cancelled') || 0);
  const pending = statusCounts.get('Pending') || 0;
  const aov = activeOrders > 0 ? stats.revenue / activeOrders : 0;
  const months = lastSixMonths(dashboard.monthlyRevenue);
  const sixMonthTotal = months.reduce((sum, m) => sum + m.revenue, 0);
  const openOrder = (id: string) => router.push(`/admin?tab=orders&order=${id}`);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" icon={CircleDollarSign} value={money(stats.revenue)} hint={`From ${activeOrders} orders, excluding cancelled`} />
        <StatCard label="Orders" icon={ShoppingBag} value={stats.ordersCount.toLocaleString()} hint={pending > 0 ? `${pending} waiting to be processed` : 'Nothing waiting to be processed'} />
        <StatCard label="Average order value" icon={Receipt} value={money(aov)} hint="Revenue per order, excluding cancelled" />
        <StatCard label="Customers" icon={Users} value={stats.customersCount.toLocaleString()} hint={`${stats.productsCount} active products in the catalog`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Revenue"
          description={`Last 6 months, excluding cancelled orders · ${money(sixMonthTotal)} total`}
        >
          {sixMonthTotal > 0 ? <RevenueChart rows={months} /> : <AdminEmpty icon={CircleDollarSign} title="No revenue in the last 6 months" description="Paid and pending orders will show up here." />}
        </Panel>

        <Panel title="Order pipeline" description="Every order by its current status">
          {pipeline.length === 0 ? (
            <AdminEmpty icon={ShoppingBag} title="No orders yet" />
          ) : (
            <ul className="space-y-3.5">
              {pipeline.map((s) => (
                <li key={s.status}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-stone-700 dark:text-stone-300">{s.status}</span>
                    <span className="tabular-nums text-stone-500">
                      <span className="font-medium text-stone-900 dark:text-white">{s.count}</span>
                      <span className="ml-1.5 text-xs">{Math.round((s.count / Math.max(stats.ordersCount, 1)) * 100)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 dark:bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#a0702a] dark:bg-[#b8862f]" style={{ width: `${(s.count / pipelineMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          bodyClassName="p-0"
          title="Recent orders"
          actions={
            <AdminButton size="sm" variant="ghost" onClick={() => onNavigate?.('orders')}>
              View all <ArrowRight className="size-3.5" />
            </AdminButton>
          }
        >
          {dashboard.recentOrders.length === 0 ? (
            <AdminEmpty icon={ShoppingBag} title="No orders yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className={table.table}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Order</th>
                    <th className={table.th}>Customer</th>
                    <th className={table.th}>Status</th>
                    <th className={table.th}>Payment</th>
                    <th className={`${table.th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className={table.tbody}>
                  {dashboard.recentOrders.map((o) => (
                    <tr key={o.id} className={`${table.tr} cursor-pointer`} onClick={() => openOrder(o.id)}>
                      <td className={table.td}>
                        <span className="block font-mono text-xs font-medium text-stone-800 dark:text-stone-200">{o.orderNumber || o.id}</span>
                        <span className="text-[11px] text-stone-400">{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </td>
                      <td className={`${table.td} text-stone-700 dark:text-stone-300`}>{(o.user as any)?.name || 'Guest'}</td>
                      <td className={table.td}><StatusPill status={o.orderStatus} /></td>
                      <td className={table.td}><StatusPill kind="payment" status={o.paymentStatus} /></td>
                      <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Best sellers" description="Units sold across all orders" bodyClassName="p-0">
          {(dashboard.topSellingProducts || []).length === 0 ? (
            <AdminEmpty icon={PackageCheck} title="No sales yet" />
          ) : (
            <ul className="divide-y divide-line">
              {(dashboard.topSellingProducts || []).map((t, i) => (
                <li key={t.product.id || i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-4 text-xs tabular-nums text-stone-400">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.product.thumbnail} alt="" className="size-10 shrink-0 rounded-md bg-stone-100 object-cover dark:bg-white/5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">{t.product.title}</p>
                    <p className="text-xs text-stone-500">{t.totalQuantity} sold</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-stone-700 dark:text-stone-300">{money(t.totalSales)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title={<span className="flex items-center gap-2">Low stock {dashboard.lowStockProducts.length > 0 && <Pill tone="warning">{dashboard.lowStockProducts.length}</Pill>}</span>}
          description="Active products with 5 or fewer left"
          bodyClassName="p-0"
          actions={
            <AdminButton size="sm" variant="ghost" onClick={() => onNavigate?.('products')}>
              Manage <ArrowRight className="size-3.5" />
            </AdminButton>
          }
        >
          {dashboard.lowStockProducts.length === 0 ? (
            <AdminEmpty icon={PackageCheck} title="Stock levels look healthy" />
          ) : (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {dashboard.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbnail} alt="" className="size-10 shrink-0 rounded-md bg-stone-100 object-cover dark:bg-white/5" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="block truncate text-sm font-medium text-stone-900 hover:underline dark:text-stone-100">{p.title}</Link>
                    {(p as any).SKU && <p className="font-mono text-[11px] text-stone-400">{(p as any).SKU}</p>}
                  </div>
                  <Pill tone={p.stock <= 2 ? 'danger' : 'warning'}>
                    {p.stock <= 2 && <AlertTriangle className="size-3" />}
                    {p.stock} left
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="lg:col-span-2">
          <AISalesAdvisor />
        </div>
      </div>
    </div>
  );
}
