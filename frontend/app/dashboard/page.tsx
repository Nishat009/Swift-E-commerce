'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Package, User, LogOut, ChevronRight, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product, Order } from '@/types';
import Loading from '@/components/ui/Loading';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'wishlist' | 'cart' | 'orders'>('overview');
  
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeFromCart = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartTotal = useCartStore((state) => state.getTotalPrice());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([loadWishlist(), loadOrders()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await apiClient.get('/wishlist');
      if (res.data?.success) {
        setWishlistItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await apiClient.get('/orders');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const removeFromWishlist = async (productId: string | number) => {
    try {
      const res = await apiClient.delete(`/wishlist/${productId}`);
      if (res.data?.success) {
        setWishlistItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const moveToCart = async (product: Product) => {
    await addItem(product, 1);
    await removeFromWishlist(product.id);
  };

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'blue' },
    { label: 'Wishlist Items', value: wishlistItems.length, icon: Heart, color: 'red' },
    { label: 'Cart Items', value: cartItems.length, icon: ShoppingCart, color: 'purple' },
  ];

  if (authLoading || (user && loadingData)) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {user?.name}! Manage your account</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button 
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Overview Tab - Stats */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                };
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'cart', label: 'Shopping Cart', icon: '🛒' },
            { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
            { id: 'orders', label: 'Orders', icon: '📦' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'cart' | 'wishlist' | 'orders')}
              className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shopping Cart Tab */}
        {activeTab === 'cart' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shopping Cart</h2>
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Your cart is empty</p>
                  <Link
                    href="/products"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => {
                      const itemPrice = item.product.price * (1 - item.product.discountPercentage / 100);
                      return (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                        >
                          <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image
                              src={item.product.thumbnail}
                              alt={item.product.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.product.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">${itemPrice.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-white"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-white"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white w-24 text-right">${(itemPrice * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Subtotal:</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Shipping and taxes calculated at checkout</p>
                    <Link
                      href="/checkout"
                      className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-center"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist</h2>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No items in your wishlist yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((item) => {
                    const inStock = item.stock > 0;
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative w-full h-32 mb-3 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">${item.price}</p>
                        </div>
                        {inStock ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveToCart(item)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add to Cart
                            </button>
                            <button
                              onClick={() => removeFromWishlist(item.id)}
                              className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              disabled
                              className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed text-center"
                            >
                              Out of Stock
                            </button>
                            <button
                              onClick={() => removeFromWishlist(item.id)}
                              className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">You haven&apos;t placed any orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = order.orderStatus || 'Pending';
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                    const itemsCount = order.products ? order.products.reduce((acc, p) => acc + p.quantity, 0) : 0;
                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">#{order.orderNumber || order.id}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  status === 'Delivered'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Placed on {date} • {itemsCount} item{itemsCount > 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment Method: {order.paymentMethod.toUpperCase()}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status: {order.paymentStatus || 'Pending'}</p>
                          </div>
                          <div className="flex flex-col md:items-end gap-3">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                            <Link
                              href="/orders"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                            >
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
