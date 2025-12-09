'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Package, MapPin, Heart, LogOut, Edit2, ShoppingBag, Award, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders' | 'addresses' | 'wishlist'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  });

  const userStats = [
    { label: 'Total Orders', value: '24', icon: ShoppingBag, color: 'blue' },
    { label: 'Wishlist Items', value: '12', icon: Heart, color: 'red' },
    { label: 'Points', value: '2,450', icon: Award, color: 'yellow' },
    { label: 'Member Since', value: '2 years', icon: TrendingUp, color: 'green' },
  ];

  const recentOrders = [
    { id: '#ORD001', date: '2025-12-08', total: '$299.99', status: 'Delivered', items: 3 },
    { id: '#ORD002', date: '2025-12-05', total: '$149.50', status: 'Processing', items: 2 },
    { id: '#ORD003', date: '2025-11-28', total: '$89.99', status: 'Delivered', items: 1 },
  ];

  const addresses = [
    { type: 'Home', address: '123 Main St, New York, NY 10001', default: true },
    { type: 'Office', address: '456 Business Ave, New York, NY 10002', default: false },
  ];

  const wishlistItems = [
    { id: 1, name: 'Premium Wireless Headphones', price: '$199.99', image: '🎧' },
    { id: 2, name: 'Smart Watch Series 5', price: '$299.99', image: '⌚' },
    { id: 3, name: 'USB-C Hub Pro', price: '$49.99', image: '🔌' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile updated:', formData);
    setIsEditing(false);
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
                  {addresses.map((addr, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{addr.type}</h3>
                            {addr.default && <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">Default</span>}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">{addr.address}</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition">
                      <div className="text-5xl mb-3">{item.image}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">{item.price}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">Add to Cart</Button>
                        <Button variant="outline" size="sm" className="flex-1">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

