'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { Product, Order, User } from '@/types';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ShieldAlert,
  BarChart3,
  Shirt,
  ShoppingBag,
  Users,
  Mail,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X
} from 'lucide-react';
import Link from 'next/link';

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

interface NewsletterSub {
  id: string;
  _id: string;
  email: string;
  subscribedAt: string;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation states
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'orders' | 'users' | 'newsletter'>('overview');
  const [loadingData, setLoadingData] = useState(true);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allNewsletters, setAllNewsletters] = useState<NewsletterSub[]>([]);

  // Search/Filters states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    brand: '',
    category: 'top',
    price: 0,
    description: '',
    stock: 10,
    discountPercentage: 0,
    thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'
  });

  // Verify Admin role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.role !== 'admin') {
        router.push('/profile'); // Redirect non-admins
      } else {
        loadAdminData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Fetch data depending on active tab
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab]);

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      if (adminTab === 'overview') {
        const res = await apiClient.get('/admin/dashboard');
        if (res.data?.success) {
          setDashboard(res.data.data);
        }
      } else if (adminTab === 'products') {
        const res = await apiClient.get('/products?limit=100');
        if (res.data?.products) {
          setAllProducts(res.data.products);
        }
      } else if (adminTab === 'orders') {
        const res = await apiClient.get('/orders/admin/all');
        if (res.data?.success) {
          setAllOrders(res.data.data);
        }
      } else if (adminTab === 'users') {
        const res = await apiClient.get('/admin/users');
        if (res.data?.success) {
          setAllUsers(res.data.data);
        }
      } else if (adminTab === 'newsletter') {
        const res = await apiClient.get('/newsletter/subscriptions');
        if (res.data?.success) {
          setAllNewsletters(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching admin dashboard content:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- ORDER STATUS ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiClient.put(`/orders/${orderId}/status`, { status });
      if (res.data?.success) {
        setAllOrders(allOrders.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o)));
        alert(`Order status updated to "${status}" successfully.`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // --- USER ROLE ACTIONS ---
  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    try {
      const res = await apiClient.put(`/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res.data?.success) {
        setAllUsers(allUsers.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
        alert(`User role updated to "${newRole}".`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      const res = await apiClient.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        setAllUsers(allUsers.filter((u) => u.id !== userId));
        alert('User account deleted.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // --- NEWSLETTER SUBSCRIPTION ACTIONS ---
  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Remove this email subscription?')) return;
    try {
      const res = await apiClient.delete(`/newsletter/subscriptions/${subId}`);
      if (res.data?.success) {
        setAllNewsletters(allNewsletters.filter((n) => n.id !== subId && n._id !== subId));
        alert('Subscription removed.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete subscription.');
    }
  };

  // --- PRODUCT MANAGEMENT ACTIONS ---
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      brand: '',
      category: 'top',
      price: 0,
      description: '',
      stock: 10,
      discountPercentage: 0,
      thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title,
      brand: prod.brand,
      category: prod.category,
      price: prod.price,
      description: prod.description,
      stock: prod.stock,
      discountPercentage: prod.discountPercentage || 0,
      thumbnail: prod.thumbnail
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (prodId: string | number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await apiClient.delete(`/products/${prodId}`);
      if (res.status === 200 || res.data?.success) {
        setAllProducts(allProducts.filter((p) => p.id !== prodId));
        alert('Product deleted successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Edit Product
        const res = await apiClient.put(`/products/${editingProduct.id}`, productForm);
        if (res.data?.success) {
          setAllProducts(allProducts.map((p) => (p.id === editingProduct.id ? res.data.data : p)));
          alert('Product details updated.');
        }
      } else {
        // Create Product
        const res = await apiClient.post('/products', productForm);
        if (res.data?.success) {
          setAllProducts([res.data.data, ...allProducts]);
          alert('New product created successfully.');
        }
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product details.');
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 p-8 rounded-3xl text-center max-w-sm shadow-xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-gray-800">403 Access Forbidden</h2>
          <p className="text-xs text-gray-400 mt-2">
            You do not possess the required administrator credentials to access this dashboard.
          </p>
          <Button onClick={() => router.push('/')} className="mt-6 w-full">Return home</Button>
        </div>
      </div>
    );
  }

  // Filter lists
  const filteredProducts = allProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = allOrders.filter(
    (o) =>
      String(o.id).includes(orderSearch) ||
      (o.user as any)?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.user as any)?.email?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-gray-950 flex flex-col">
      
      {/* Studio Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-50/10 via-cream/30 to-[#8b6f47]/5 py-6 border-b border-gray-250/50 dark:border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
              <Link href="/profile" className="hover:text-gray-650 dark:hover:text-gray-200">Profile</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-red-500 font-bold">Admin Console</span>
            </div>
            <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-[#f5f1eb] tracking-tight">
              Management Dashboard
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Store overview, catalog modifications, orders updates, client accounts, and subscriptions control.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-2 px-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold">Role Authority</span>
                <span className="text-xs font-black text-gray-800 dark:text-gray-250">Master Admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION TAB SWITCHER */}
        <div className="lg:w-1/4 flex flex-col gap-2.5">
          <button
            onClick={() => setAdminTab('overview')}
            className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
              adminTab === 'overview'
                ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Dashboard Overview
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
          
          <button
            onClick={() => setAdminTab('products')}
            className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
              adminTab === 'products'
                ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Shirt className="w-4 h-4" /> Manage Products
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setAdminTab('orders')}
            className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
              adminTab === 'orders'
                ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Manage Orders
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
              adminTab === 'users'
                ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Customer Accounts
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setAdminTab('newsletter')}
            className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
              adminTab === 'newsletter'
                ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Newsletter Subs
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <hr className="my-4 border-gray-200 dark:border-gray-800" />
          <Button onClick={loadAdminData} variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
          </Button>
        </div>

        {/* WORKSPACE DETAILED VIEWS */}
        <div className="lg:w-3/4 bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          
          {loadingData ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#8b6f47]" />
              <span className="text-xs font-semibold">Gathering backend registers...</span>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW VIEW */}
              {adminTab === 'overview' && dashboard && (
                <div className="space-y-8">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 border-b pb-2">Dashboard Overview</h2>
                  
                  {/* Grid cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-[#8b6f47]/5 to-[#8b6f47]/10 p-4 border border-gray-100 dark:border-gray-900 rounded-2xl">
                      <span className="block text-[10px] text-gray-400 uppercase font-black">Gross Sales Revenue</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">${dashboard.stats.totalSales.toFixed(0)}</span>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50/20 to-blue-50/50 p-4 border border-gray-100 dark:border-gray-900 rounded-2xl">
                      <span className="block text-[10px] text-gray-400 uppercase font-black">Total Placed Orders</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.ordersCount}</span>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50/20 to-purple-50/50 p-4 border border-gray-100 dark:border-gray-900 rounded-2xl">
                      <span className="block text-[10px] text-gray-400 uppercase font-black">Unique Customers</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.customersCount}</span>
                    </div>
                    <div className="bg-gradient-to-br from-green-50/20 to-green-50/50 p-4 border border-gray-100 dark:border-gray-900 rounded-2xl">
                      <span className="block text-[10px] text-gray-400 uppercase font-black">Active Products</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{dashboard.stats.productsCount}</span>
                    </div>
                  </div>

                  {/* Stock Alert */}
                  {dashboard.lowStockProducts.length > 0 && (
                    <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/55 rounded-2xl p-4 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Inventory Alert: Low Stock Levels detected</h4>
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
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Sales Orders</h3>
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-xs text-left">
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
              )}

              {/* 2. MANAGE PRODUCTS VIEW */}
              {adminTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Product Inventory</h2>
                    <Button onClick={handleOpenCreateProduct} className="text-xs py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Add Product
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search products by title, brand, category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full text-xs pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Products Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Title</th>
                          <th className="p-3">Brand</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800 dark:text-gray-200 max-w-[150px] truncate">{p.title}</td>
                            <td className="p-3 capitalize">{p.brand}</td>
                            <td className="p-3 capitalize">{p.category}</td>
                            <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${p.price}</td>
                            <td className="p-3 font-mono">{p.stock} units</td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              <button onClick={() => handleOpenEditProduct(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit Product">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Product">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. MANAGE ORDERS VIEW */}
              {adminTab === 'orders' && (
                <div className="space-y-4">
                  <div className="border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Placed Customer Orders</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search orders by customer name, email, or order ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full text-xs pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Cost</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono text-gray-500 text-[10px] truncate max-w-[80px]">{o.id}</td>
                            <td className="p-3">
                              <span className="block font-bold text-gray-800 dark:text-gray-200">{(o.user as any)?.name || 'Guest'}</span>
                              <span className="block text-[10px] text-gray-400">{(o.user as any)?.email}</span>
                            </td>
                            <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${o.total.toFixed(0)}</td>
                            <td className="p-3 uppercase font-bold text-gray-550 text-[10px]">{o.paymentMethod}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={o.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(o.id!, e.target.value)}
                                className="text-[10px] font-bold border rounded-lg px-2 py-1 bg-white dark:bg-gray-900"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. CUSTOMER ACCOUNTS VIEW */}
              {adminTab === 'users' && (
                <div className="space-y-4">
                  <div className="border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Registered Accounts</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search accounts by name or email address..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full text-xs pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Access Level</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{u.name}</td>
                            <td className="p-3 font-mono">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              <Button
                                onClick={() => handleToggleUserRole(u)}
                                variant="outline"
                                size="sm"
                                className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-50"
                              >
                                {u.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                              </Button>
                              <button onClick={() => handleDeleteUser(u.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete User Account">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. NEWSLETTER REGISTER VIEW */}
              {adminTab === 'newsletter' && (
                <div className="space-y-4">
                  <div className="border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Newsletter Subscribers</h2>
                  </div>

                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Subscription Date</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allNewsletters.map((n) => (
                          <tr key={n.id || n._id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">{n.email}</td>
                            <td className="p-3 text-gray-500">{new Date(n.subscribedAt).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteSubscription(n.id || n._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Remove subscription">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}

        </div>

      </main>

      {/* CREATE/EDIT PRODUCT DIALOG MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            
            <button onClick={() => setIsProductModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">
              {editingProduct ? 'Modify Product Specifications' : 'Publish New Product'}
            </h3>

            <form onSubmit={handleProductFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Product Title</label>
                <Input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  required
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Brand Name</label>
                  <Input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    required
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Material Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full text-xs border border-gray-200 bg-white rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="top">Tops</option>
                    <option value="pants">Pants</option>
                    <option value="dress">Dresses</option>
                    <option value="jacket">Jackets</option>
                    <option value="shoes">Shoes</option>
                    <option value="hat">Hats</option>
                    <option value="bag">Bags</option>
                    <option value="glasses">Glasses</option>
                    <option value="jewelry">Jewelry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price ($)</label>
                  <Input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    required
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Discount %</label>
                  <Input
                    type="number"
                    value={productForm.discountPercentage}
                    onChange={(e) => setProductForm({ ...productForm, discountPercentage: Number(e.target.value) })}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stock Count</label>
                  <Input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    required
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  required
                  rows={2}
                  className="w-full text-xs border border-gray-250 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Thumbnail Image URL</label>
                <Input
                  type="text"
                  value={productForm.thumbnail}
                  onChange={(e) => setProductForm({ ...productForm, thumbnail: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <Button type="submit" className="w-full text-xs py-2.5 font-bold rounded-xl mt-4">
                {editingProduct ? 'Update Specifications' : 'Publish Product'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
