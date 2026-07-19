'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Package, MapPin, Heart, LogOut, Edit2, ShoppingBag, Award, Clock, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product, Order, Address } from '@/types';
import Loading from '@/components/ui/Loading';

export default function DashboardPage() {
  const { user, logout, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'orders' | 'addresses' | 'wishlist'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // 2FA Security setup states
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading2FA, setLoading2FA] = useState(false);

  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    setVerificationError('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      if (res.data?.success) {
        setSetupSecret(res.data.data.secret);
        setSetupQrUrl(res.data.data.otpauthUrl);
        setIsSettingUp2FA(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Verification code is required');
      return;
    }
    setLoading2FA(true);
    setVerificationError('');
    try {
      const res = await apiClient.post('/auth/2fa/enable', { code: verificationCode });
      if (res.data?.success) {
        setRecoveryCodes(res.data.data.recoveryCodes || []);
        if (user) {
          user.twoFactorEnabled = true;
        }
      }
    } catch (err: any) {
      console.error(err);
      setVerificationError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    setLoading2FA(true);
    try {
      const res = await apiClient.post('/auth/2fa/disable');
      if (res.data?.success) {
        if (user) {
          user.twoFactorEnabled = false;
        }
        setIsSettingUp2FA(false);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

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
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
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
                {['overview', 'profile', 'security', 'orders', 'addresses', 'wishlist'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 capitalize flex items-center gap-2 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] text-white shadow-md shadow-[#8b6f47]/20 scale-[1.02]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60 hover:text-[#8b6f47] dark:hover:text-[#c9a96b] hover:translate-x-1.5'
                    }`}
                  >
                    {tab === 'security' ? 'Security & 2FA' : tab}
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

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center mb-6">
                  <Award className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b] mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & 2FA</h2>
                </div>

                {!user?.twoFactorEnabled ? (
                  /* 2FA Disabled State */
                  <div className="space-y-6">
                    {!isSettingUp2FA ? (
                      <div className="space-y-4">
                        <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
                          Protect your account with Two-Factor Authentication (2FA). By enabling 2FA, you will be required to enter a 6-digit verification code from your authenticator app (like Google Authenticator or Microsoft Authenticator) or a recovery code whenever you sign in.
                        </p>
                        <Button 
                          onClick={handleStart2FASetup} 
                          loading={loading2FA}
                          className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 border-0 shadow-md"
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    ) : (
                      /* 2FA Setup Flow */
                      <div className="space-y-6 border border-zinc-150 dark:border-zinc-700 rounded-2xl p-5 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                          Set Up Two-Factor Authentication
                        </h3>
                        
                        {recoveryCodes.length > 0 ? (
                          /* Step 2: Show recovery codes */
                          <div className="space-y-4">
                            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold leading-normal">
                              ✓ Two-Factor Authentication has been successfully enabled!
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              IMPORTANT: Save these recovery codes in a secure place. If you lose access to your authenticator app, you can use these codes to log back into your account. Each code can only be used once.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-100 dark:bg-zinc-950 p-4 rounded-xl font-mono text-center text-sm font-bold text-zinc-750 dark:text-zinc-300">
                              {recoveryCodes.map((code, idx) => (
                                <div key={idx} className="tracking-wider">{code}</div>
                              ))}
                            </div>
                            <Button 
                              onClick={() => {
                                setIsSettingUp2FA(false);
                                setRecoveryCodes([]);
                                router.refresh();
                              }}
                              className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full px-6 font-bold"
                            >
                              Done & Close
                            </Button>
                          </div>
                        ) : (
                          /* Step 1: Scan QR and Verify */
                          <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                              {/* QR Code Container */}
                              {setupQrUrl && (
                                <div className="p-3 bg-white border rounded-2xl shadow-sm flex-shrink-0">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupQrUrl)}`} 
                                    alt="2FA QR Code" 
                                    className="w-[180px] h-[180px]"
                                  />
                                </div>
                              )}
                              
                              <div className="space-y-3 text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 font-serif">Instructions:</p>
                                <p>1. Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.).</p>
                                <p>2. Choose "Scan QR Code" or add a new account.</p>
                                <p>3. Scan the QR code, or enter this secret key manually:</p>
                                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg font-mono text-[11px] font-bold text-center text-zinc-800 dark:text-zinc-300 break-all select-all border border-zinc-200/60 dark:border-zinc-800">
                                  {setupSecret}
                                </div>
                              </div>
                            </div>

                            {/* Verify Input */}
                            <div className="space-y-2.5 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                              <label className="block text-xs font-bold text-zinc-750 dark:text-zinc-300 uppercase tracking-wide">
                                Enter 6-digit Verification Code
                              </label>
                              <div className="flex gap-4 items-end max-w-sm">
                                <input
                                  type="text"
                                  placeholder="000000"
                                  maxLength={6}
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-center tracking-widest text-sm font-bold rounded-xl"
                                />
                                <Button 
                                  onClick={handleEnable2FA}
                                  loading={loading2FA}
                                  className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 rounded-full font-bold px-5"
                                >
                                  Verify
                                </Button>
                              </div>
                              {verificationError && (
                                <p className="text-[10px] text-red-500 font-bold">{verificationError}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSettingUp2FA(false);
                                setVerificationCode('');
                                setVerificationError('');
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                            >
                              Cancel Setup
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2FA Enabled State */
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                      <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Two-Factor Authentication is Active</p>
                        <p className="text-[11px] opacity-90 mt-0.5">Your account has an extra layer of security validation active.</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="font-serif text-base font-bold text-gray-800 dark:text-gray-200">
                        Deactivate Two-Factor Authentication
                      </h3>
                      <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                        If you disable 2FA, you will no longer be prompted for a verification code when signing in, reducing your account security level.
                      </p>
                      <Button
                        onClick={handleDisable2FA}
                        loading={loading2FA}
                        className="bg-red-650 hover:bg-red-700 text-white rounded-full px-6 border-0 shadow-sm font-bold text-xs"
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                )}
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

