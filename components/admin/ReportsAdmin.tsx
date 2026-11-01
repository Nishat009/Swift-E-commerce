'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { BarChart3, Download, PackageCheck, RefreshCw } from 'lucide-react';
import { downloadCsv, errMsg } from './adminUtils';
import { AdminButton, AdminEmpty, StatCard, table } from './AdminUI';

interface DashboardReport {
  stats: { totalSales: number; ordersCount: number; customersCount: number; productsCount: number };
  monthlyRevenue: { month: string; revenue: number }[];
  topSellingProducts: { product: { title: string; brand?: string; category?: string }; totalQuantity: number; totalSales: number }[];
}

const money2 = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compactMoney = (n: number) => (n >= 10000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n).toLocaleString('en-US')}`);

/** A round tick step for an axis that has to reach `max`. */
function niceStep(max: number, ticks = 4) {
  const raw = Math.max(max, 1) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const r = raw / mag;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Last six calendar months ("Oct 2026" keys, as the dashboard API sends them), zero-filled where there were no sales. */
function lastSixMonths(data: { month: string; revenue: number }[]) {
  const byKey = new Map(data.map((r) => [r.month, r.revenue]));
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const month = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return { month, label: MONTHS[d.getMonth()], revenue: byKey.get(month) || 0 };
  });
}

/** Single-series column chart of monthly revenue: one hue, hairline grid, a tooltip per column. */
function MonthlyRevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const rows = lastSixMonths(data);
  const max = Math.max(...rows.map((r) => r.revenue), 0);
  const step = niceStep(max);
  const top = Math.max(step * Math.ceil(max / step), step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const peak = rows.reduce((best, r, i) => (r.revenue > rows[best].revenue ? i : best), 0);
  const last = rows.length - 1;

  return (
    <div>
      <div className="relative flex h-56 gap-3">
        <div className="relative w-12 shrink-0 text-right text-[11px] tabular-nums text-stone-400">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {compactMoney(t)}
            </span>
          ))}
        </div>
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
                  key={r.month}
                  tabIndex={0}
                  role="img"
                  aria-label={`${r.month}: ${money2(r.revenue)}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="relative flex h-full flex-1 items-end justify-center outline-none"
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
                      <p className="text-sm font-semibold tabular-nums text-stone-900 dark:text-white">{money2(r.revenue)}</p>
                      <p className="text-[11px] text-stone-500">{r.month}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-[60px] mt-2 flex text-[11px] text-stone-400">
        {rows.map((r) => (
          <span key={r.month} className="flex-1 text-center">{r.label}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Revenue by month</caption>
        <thead><tr><th>Month</th><th>Revenue</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.month}><td>{r.month}</td><td>{money2(r.revenue)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ReportsAdmin() {
  const toast = useToast();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/admin/dashboard');
      setReport(res.data?.data || null);
    } catch (err) {
      setError(errMsg(err, 'Failed to load report data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stamp = () => new Date().toISOString().split('T')[0];

  const exportOrders = async () => {
    const res = await apiClient.get('/orders/admin/all', { params: { limit: 500 } });
    const orders: any[] = res.data?.data || [];
    downloadCsv(`orders-${stamp()}.csv`, [
      ['Order #', 'Date', 'Customer', 'Email', 'Items', 'Subtotal', 'Shipping', 'Tax', 'Coupon', 'Total', 'Payment method', 'Payment status', 'Order status'],
      ...orders.map((o) => [
        o.orderNumber || o.id,
        new Date(o.createdAt).toISOString(),
        o.user?.name || 'Deleted user',
        o.user?.email || '',
        (o.products || []).reduce((n: number, i: any) => n + (i.quantity || 0), 0),
        o.subtotal,
        o.shipping,
        o.tax,
        o.coupon || '',
        o.total,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
      ]),
    ]);
    return orders.length;
  };

  const exportCustomers = async () => {
    const res = await apiClient.get('/admin/users', { params: { limit: 200 } });
    const users: any[] = res.data?.data || [];
    downloadCsv(`customers-${stamp()}.csv`, [
      ['Name', 'Email', 'Phone', 'Role', 'Joined'],
      ...users.map((u) => [u.name, u.email, u.phone || '', u.role, u.createdAt ? new Date(u.createdAt).toISOString() : '']),
    ]);
    return users.length;
  };

  const exportProducts = async () => {
    const res = await apiClient.get('/products', { params: { all: true, limit: 500 } });
    const products: any[] = res.data?.products || [];
    downloadCsv(`products-${stamp()}.csv`, [
      ['Title', 'SKU', 'Brand', 'Category', 'Price', 'Discount %', 'Stock', 'Status', 'Visibility', 'Active'],
      ...products.map((p) => [p.title, p.sku || p.SKU, p.brand, p.category, p.price, p.discountPercentage || 0, p.stock, p.status, p.visibility, p.active]),
    ]);
    return products.length;
  };

  const exportSubscribers = async () => {
    const res = await apiClient.get('/newsletter/subscriptions');
    const subs: any[] = res.data?.data || [];
    downloadCsv(`newsletter-${stamp()}.csv`, [
      ['Email', 'Subscribed at'],
      ...subs.map((s) => [s.email, s.subscribedAt ? new Date(s.subscribedAt).toISOString() : '']),
    ]);
    return subs.length;
  };

  const run = async (key: string, fn: () => Promise<number>) => {
    setExporting(key);
    try {
      const n = await fn();
      toast.success(`Exported ${n} ${key}.`);
    } catch (err) {
      toast.error(errMsg(err, `Failed to export ${key}.`));
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-stone-500 dark:text-stone-400">Download as CSV</span>
          {[
            { key: 'orders', label: 'Orders', fn: exportOrders },
            { key: 'customers', label: 'Customers', fn: exportCustomers },
            { key: 'products', label: 'Products', fn: exportProducts },
            { key: 'subscribers', label: 'Subscribers', fn: exportSubscribers },
          ].map((b) => (
            <AdminButton
              key={b.key}
              size="sm"
              disabled={!!exporting}
              onClick={() => run(b.key, b.fn)}
              title={`Download ${b.key} as a CSV file`}
            >
              {exporting === b.key ? <RefreshCw className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} {b.label}
            </AdminButton>
          ))}
        </div>
        <AdminButton variant="ghost" onClick={load}>
          <RefreshCw className="size-4" /> Refresh
        </AdminButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500 dark:text-stone-400">
          <RefreshCw className="size-4 animate-spin" /> Building report...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/[0.07] dark:text-red-300">{error}</div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard className="shadow-none" label="Revenue" value={<span className="tabular-nums">{money2(report.stats.totalSales)}</span>} hint="Excluding cancelled orders" />
            <StatCard className="shadow-none" label="Orders" value={<span className="tabular-nums">{report.stats.ordersCount.toLocaleString()}</span>} />
            <StatCard className="shadow-none" label="Customers" value={<span className="tabular-nums">{report.stats.customersCount.toLocaleString()}</span>} />
            <StatCard className="shadow-none" label="Active products" value={<span className="tabular-nums">{report.stats.productsCount.toLocaleString()}</span>} />
          </div>

          <div className="rounded-lg border border-line p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Monthly revenue</h3>
            <p className="mb-5 mt-0.5 text-xs text-stone-500 dark:text-stone-400">Last 6 months, excluding cancelled orders</p>
            {report.monthlyRevenue.length === 0 ? (
              <AdminEmpty icon={BarChart3} title="No sales in this period yet" />
            ) : (
              <MonthlyRevenueChart data={report.monthlyRevenue} />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Top selling products</h3>
            <div className={table.wrap}>
              <table className={table.table}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Product</th>
                    <th className={table.th}>Category</th>
                    <th className={`${table.th} text-right`}>Units sold</th>
                    <th className={`${table.th} text-right`}>Sales</th>
                  </tr>
                </thead>
                <tbody className={table.tbody}>
                  {report.topSellingProducts.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <AdminEmpty icon={PackageCheck} title="No product sales yet" />
                      </td>
                    </tr>
                  )}
                  {report.topSellingProducts.map((t, i) => (
                    <tr key={i} className={table.tr}>
                      <td className={`${table.td} font-medium text-stone-900 dark:text-stone-100`}>{t.product.title}</td>
                      <td className={`${table.td} capitalize text-stone-500 dark:text-stone-400`}>{t.product.category}</td>
                      <td className={`${table.td} text-right tabular-nums text-stone-700 dark:text-stone-300`}>{t.totalQuantity}</td>
                      <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>{money2(t.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
