'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product, Order } from '@/types';
import AccountLayout from '@/components/layout/AccountLayout';
import { StatsSkeleton, OrderSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import {
  Package,
  Heart,
  ShoppingCart,
  Calendar,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, wishlistRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/wishlist'),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data);
      }
      if (wishlistRes.data?.success) {
        setWishlistCount(wishlistRes.data.data.length);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const memberYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'blue', link: '/orders' },
    { label: 'Wishlist Items', value: wishlistCount, icon: Heart, color: 'red', link: '/wishlist' },
    { label: 'Cart Items', value: cartItems.reduce((acc, item) => acc + item.quantity, 0), icon: ShoppingCart, color: 'purple', link: '/cart' },
  ];

  const recentOrders = orders.slice(0, 3);

  return (
    <AccountLayout activeTabName="/dashboard">
      <div className="space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="z-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-xs text-white/80 max-w-md">
              Here is what is happening with your account today. Check your order statuses or search for new draws.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center z-10">
            <span className="block text-[9px] font-black uppercase tracking-widest text-white/60">Loyalty Level</span>
            <span className="font-serif font-bold text-sm">Platinum Member (Est. {memberYear})</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-base font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Activity Overview
          </h3>
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                const colors = {
                  blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
                  red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30',
                  purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
                };
                return (
                  <Link href={stat.link} key={idx} className="block group">
                    <div className="bg-[#faf9f6] dark:bg-gray-850 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 ${colors[stat.color as keyof typeof colors]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <h3 className="text-base font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Recent Orders
            </h3>
            {orders.length > 3 && (
              <Link href="/orders" className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline flex items-center gap-0.5">
                <span>View all orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <OrderSkeleton />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="bg-[#faf9f6] dark:bg-gray-850 rounded-3xl border border-gray-150/30 dark:border-gray-800/80 p-8">
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="Once you place an order, it will appear here along with live tracking statuses."
                actionText="Start Shopping"
                actionLink="/products"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const status = order.orderStatus || 'Pending';
                const itemsCount = order.products
                  ? order.products.reduce((acc, p) => acc + p.quantity, 0)
                  : 0;

                const statusStyles = {
                  Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                  Shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                  Processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                };

                return (
                  <div
                    key={order.id}
                    className="bg-[#faf9f6] dark:bg-gray-850 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs transition duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white font-serif">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <span>{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <Link href={`/orders`}>
                      <button className="text-[10px] font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 py-1.5 px-4 rounded-full transition shadow-xs">
                        Details
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
