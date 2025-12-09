'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Package, User, LogOut, ChevronRight, Trash2, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'wishlist' | 'cart' | 'orders'>('overview');
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Wireless Headphones Pro', price: 199.99, quantity: 1, image: '🎧' },
    { id: 2, name: 'USB-C Hub', price: 49.99, quantity: 2, image: '🔌' },
  ]);
  const [wishlistItems, setWishlistItems] = useState([
    { id: 1, name: 'Premium Wireless Headphones', price: 199.99, image: '🎧', inStock: true },
    { id: 2, name: 'Smart Watch Series 5', price: 299.99, image: '⌚', inStock: true },
    { id: 3, name: 'USB-C Hub Pro', price: 49.99, image: '🔌', inStock: false },
    { id: 4, name: 'Mechanical Keyboard RGB', price: 149.99, image: '⌨️', inStock: true },
  ]);
  const [orders] = useState([
    {
      id: '#ORD001',
      date: '2025-12-08',
      total: '$299.99',
      status: 'Delivered',
      items: 3,
      trackingNumber: 'TRK123456789',
      estimatedDelivery: '2025-12-08'
    },
    {
      id: '#ORD002',
      date: '2025-12-05',
      total: '$149.50',
      status: 'Processing',
      items: 2,
      trackingNumber: 'TRK987654321',
      estimatedDelivery: '2025-12-12'
    },
    {
      id: '#ORD003',
      date: '2025-11-28',
      total: '$89.99',
      status: 'Delivered',
      items: 1,
      trackingNumber: 'TRK555666777',
      estimatedDelivery: '2025-11-30'
    },
  ]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const removeFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const removeFromWishlist = (id: number) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
  };

  const moveToCart = (item: typeof wishlistItems[0]) => {
    setCartItems([...cartItems, { ...item, quantity: 1, image: item.image }]);
    removeFromWishlist(item.id);
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'blue' },
    { label: 'Wishlist Items', value: wishlistItems.length, icon: Heart, color: 'red' },
    { label: 'Cart Items', value: cartItems.length, icon: ShoppingCart, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back! Manage your account</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
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
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                      >
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-white"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-white"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white w-24 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
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
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition"
                    >
                      <div className="text-6xl text-center mb-3">{item.image}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">${item.price}</p>
                      {item.inStock ? (
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
                            className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
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
                  ))}
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
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{order.id}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'Delivered'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Placed on {order.date} • {order.items} items</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tracking: {order.trackingNumber}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Est. Delivery: {order.estimatedDelivery}</p>
                        </div>
                        <div className="flex flex-col md:items-end gap-3">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.total}</p>
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
