'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Package, MapPin, Heart, LogOut, Edit2, ShoppingBag, Award, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product, Order, Address } from '@/types';
import Loading from '@/components/ui/Loading';

export default function DashboardPage() {
  const { user, logout, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders' | 'addresses' | 'wishlist'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      const defaultAddr = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: defaultAddr?.street || '',
        city: defaultAddr?.city || '',
        state: defaultAddr?.state || '',
        zipCode: defaultAddr?.zipCode || '',
        password: '',
        confirmPassword: ''
      });
      loadProfileData();
    }
  }, [user, authLoading]);

  const loadProfileData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([loadWishlist(), loadOrders()]);
    } catch (err) {
      console.error('Error loading profile tabs:', err);
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

  const userStats = [
    { label: 'Total Orders', value: String(orders.length), icon: ShoppingBag, color: 'blue' },
    { label: 'Wishlist Items', value: String(wishlistItems.length), icon: Heart, color: 'red' },
    { label: 'Points', value: '150', icon: Award, color: 'yellow' },
    { 
      label: 'Member Since', 
      value: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : new Date().getFullYear().toString(), 
      icon: TrendingUp, 
      color: 'green' 
    },
  ];

  const recentOrders = orders.slice(0, 3).map(order => ({
    id: order.orderNumber || order.id,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
    total: `$${order.total.toFixed(2)}`,
    status: order.orderStatus || 'Pending',
    items: order.products ? order.products.reduce((acc, p) => acc + p.quantity, 0) : 0
  }));

  const userAddresses: Address[] = user?.addresses || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await updateProfile(
        formData.name,
        formData.email,
        formData.phone,
        formData.password || undefined
      );
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {formData.name}</p>
            </div>
            <Button variant="outline" className="w-full md:w-auto flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {userStats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              };
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
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
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
              <div className="space-y-2">
                {['overview', 'profile', 'orders', 'addresses', 'wishlist'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition capitalize ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{formData.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{formData.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Member since Jan 2023</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="City"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="State"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Zip Code"
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      disabled={!isEditing}
                      className="md:col-span-2"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-3">
                      <Button type="submit">Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Orders</h2>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{order.id}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.date} • {order.items} items</p>
                        </div>
                        <div className="flex flex-col md:items-end gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{order.total}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Addresses</h2>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Add Address
                  </Button>
                </div>
                <div className="space-y-4">
                  {userAddresses.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No addresses saved yet.</p>
                  ) : (
                    userAddresses.map((addr, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {addr.isDefault ? 'Default Address' : `Address ${index + 1}`}
                              </h3>
                              {addr.isDefault && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                              {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist</h2>
                {wishlistItems.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No items in your wishlist yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition flex flex-col justify-between">
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
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => addItem(item, 1)}
                            size="sm" 
                            className="flex-1"
                          >
                            Add to Cart
                          </Button>
                          <Button 
                            onClick={() => removeFromWishlist(item.id)}
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

