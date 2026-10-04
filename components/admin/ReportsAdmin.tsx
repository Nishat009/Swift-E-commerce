'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { downloadCsv, errMsg } from './adminUtils';

interface DashboardReport {
  stats: { totalSales: number; ordersCount: number; customersCount: number; productsCount: number };
  monthlyRevenue: { month: string; revenue: number }[];
  topSellingProducts: { product: { title: string; brand?: string; category?: string }; totalQuantity: number; totalSales: number }[];
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

  const maxRevenue = Math.max(1, ...(report?.monthlyRevenue || []).map((m) => m.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#8b6f47]" /> Reports &amp; Export
        </h2>
        <Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Download as spreadsheet (CSV)</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'orders', fn: exportOrders },
            { key: 'customers', fn: exportCustomers },
            { key: 'products', fn: exportProducts },
            { key: 'subscribers', fn: exportSubscribers },
          ].map((b) => (
            <Button
              key={b.key}
              variant="outline"
              size="sm"
              loading={exporting === b.key}
              disabled={!!exporting}
              onClick={() => run(b.key, b.fn)}
              className="flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> {b.key}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Building report...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Revenue (excl. cancelled)', value: `$${report.stats.totalSales.toFixed(2)}` },
              { label: 'Orders', value: report.stats.ordersCount },
              { label: 'Customers', value: report.stats.customersCount },
              { label: 'Active products', value: report.stats.productsCount },
            ].map((t) => (
              <div key={t.label} className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/40">
                <span className="block text-[10px] text-gray-400 uppercase font-black">{t.label}</span>
                <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{t.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Monthly revenue (last 6 months)</h4>
            {report.monthlyRevenue.length === 0 ? (
              <p className="text-xs text-gray-400">No sales in this period yet.</p>
            ) : (
              <div className="space-y-2">
                {report.monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 w-20">{m.month}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full" style={{ width: `${Math.max(2, (m.revenue / maxRevenue) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 w-16 text-right">${m.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Top selling products</h4>
            {report.topSellingProducts.length === 0 ? (
              <p className="text-xs text-gray-400">No product sales yet.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-gray-400 uppercase text-[9px]">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Units sold</th>
                    <th className="py-2 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.topSellingProducts.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2 font-bold text-gray-800 dark:text-gray-200">{t.product.title}</td>
                      <td className="py-2 text-xs text-gray-500 capitalize">{t.product.category}</td>
                      <td className="py-2 text-right">{t.totalQuantity}</td>
                      <td className="py-2 text-right font-extrabold text-[#8b6f47]">${t.totalSales.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
