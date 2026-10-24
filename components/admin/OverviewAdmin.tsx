'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Product, Order } from '@/types';
import AISalesAdvisor from '@/features/ai/product-ai/AISalesAdvisor';
import { AlertTriangle } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';

interface DashboardData {
  stats: {
    totalSales: number;
    revenue: number;
    ordersCount: number;
    customersCount: number;
    productsCount: number;
  };
  recentOrders: Order[];
  lowStockProducts: Product[];
}

/** Admin home: sales totals, low-stock alert and the latest orders. */
export default function OverviewAdmin() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/admin/dashboard');
    if (res.data?.success) setDashboard(res.data.data);
  });

  if (loading) return <SectionLoading />;
  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 border-b pb-2">Dashboard Overview</h2>

      {/* Grid cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#8b6f47]/5 to-[#8b6f47]/10 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <span className="block text-[10px] text-gray-400 uppercase font-black">Gross Sales Revenue</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">${dashboard.stats.totalSales.toFixed(0)}</span>
        </div>
        <div className="bg-gradient-to-br from-blue-50/20 to-blue-50/50 dark:from-blue-950/10 dark:to-blue-900/20 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <span className="block text-[10px] text-gray-400 uppercase font-black">Total Placed Orders</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.ordersCount}</span>
        </div>
        <div className="bg-gradient-to-br from-purple-50/20 to-purple-50/50 dark:from-purple-950/10 dark:to-purple-900/20 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <span className="block text-[10px] text-gray-400 uppercase font-black">Unique Customers</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.customersCount}</span>
        </div>
        <div className="bg-gradient-to-br from-green-50/20 to-green-50/50 dark:from-emerald-950/10 dark:to-emerald-900/20 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <span className="block text-[10px] text-gray-400 uppercase font-black">Active Products</span>
          <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.productsCount}</span>
        </div>
      </div>

      {/* AI Sales Advisor Widget */}
      <AISalesAdvisor />

      {/* Stock Alert */}
      {dashboard.lowStockProducts.length > 0 && (
        <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/55 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Inventory Alert: Low Stock Levels detected</h4>
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-0.5">The following items are nearly sold out (stock &lt;= 5):</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {dashboard.lowStockProducts.map((p) => (
                <span key={p.id} className="bg-white dark:bg-gray-900 border border-amber-200/50 rounded-lg py-1 px-2.5 text-[9px] font-bold text-gray-600 dark:text-gray-300">
                  {p.title} ({p.stock} left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent orders table */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Sales Orders</h3>
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dashboard.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-mono text-gray-550">{o.id}</td>
                  <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{(o.user as any)?.name || 'Guest User'}</td>
                  <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${o.total.toFixed(0)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                      o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {o.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
