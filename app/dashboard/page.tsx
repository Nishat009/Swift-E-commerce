'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product, Order } from '@/types';
import AccountLayout from '@/components/layout/AccountLayout';
import { StatsSkeleton, OrderSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';
import StatusPill, { ORDER_STATUS_TONE } from '@/components/orders/StatusPill';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const cartItems = useCartStore((state) => state.items);

  const loadDashboardStats = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [ordersRes, wishlistRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/wishlist'),
      ]);

      if (ordersRes.data?.success) {
        setOrders(Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []);
      }
      if (wishlistRes.data?.success) {
        setWishlistCount(Array.isArray(wishlistRes.data.data) ? wishlistRes.data.data.length : 0);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const memberYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  const stats = [
    { label: 'Total Orders', value: orders.length, link: '/orders' },
    { label: 'Wishlist Items', value: wishlistCount, link: '/wishlist' },
    { label: 'Cart Items', value: cartItems.reduce((acc, item) => acc + item.quantity, 0), link: '/cart' },
  ];

  const recentOrders = orders.slice(0, 3);
  const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400';

  return (
    <AccountLayout activeTabName="/dashboard">
      <div className="space-y-12">

        {/* Welcome Section */}
        <div className="border-b border-line pb-8">
          <p className={eyebrow + ' mb-3'}>Member since {memberYear}</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-ink leading-tight">
            Welcome back, {user?.name}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mt-3 leading-relaxed">
            Here is what is happening with your account today. Check your order statuses or browse new arrivals.
          </p>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-2xl font-serif font-medium tracking-tight text-ink mb-5">
            Activity Overview
          </h3>
          {loading ? (
            <StatsSkeleton />
          ) : loadError ? (
            <div className="py-6 text-sm text-stone-500 dark:text-stone-400 space-y-3">
              <p>We could not load your account activity.</p>
              <Button variant="outline" size="sm" onClick={loadDashboardStats}>Try again</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line border-y border-line">
              {stats.map((stat, idx) => (
                <Link href={stat.link} key={idx} className="block group py-6 sm:px-6 first:pl-0 hover:bg-surface-muted transition-colors">
                  <p className={eyebrow}>{stat.label}</p>
                  <p className="mt-2 text-4xl font-serif font-medium tabular-nums text-ink">{stat.value}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-end justify-between mb-2 gap-4">
            <h3 className="text-2xl font-serif font-medium tracking-tight text-ink">
              Recent Orders
            </h3>
            {orders.length > 3 && (
              <Link href="/orders" className="text-sm text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink whitespace-nowrap">
                View all orders
              </Link>
            )}
          </div>

          {loading ? (
            <OrderSkeleton />
          ) : loadError ? null : recentOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Once you place an order, it will appear here along with live tracking statuses."
              actionText="Start Shopping"
              actionLink="/products"
            />
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {recentOrders.map((order) => {
                const status = order.orderStatus || 'Pending';
                const itemsCount = order.products
                  ? order.products.reduce((acc, p) => acc + p.quantity, 0)
                  : 0;
                const first = order.products?.[0]?.product;
                const thumb = first?.thumbnail || first?.image;

                return (
                  <div
                    key={order.id}
                    className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 aspect-[3/4] shrink-0 rounded-sm overflow-hidden bg-surface-muted">
                        {thumb && <img src={thumb} alt={first?.title || ''} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-ink tabular-nums">
                            Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                          </span>
                          <StatusPill tone={ORDER_STATUS_TONE[status] || 'neutral'}>{status}</StatusPill>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                          {new Date(order.createdAt).toLocaleDateString()} &middot; {itemsCount} item{itemsCount > 1 ? 's' : ''} &middot; <span className="font-medium text-ink">${order.total.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <Link href="/orders">
                      <Button variant="outline" size="sm">Details</Button>
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
