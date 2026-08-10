'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Product, Order, User } from '@/types';
import Loading from '@/components/ui/Loading';
import ProductTable from '@/components/product/ProductTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useLanguageStore } from '@/stores/languageStore';
import AIProductDescriptionGen from '@/features/ai/product-ai/AIProductDescriptionGen';
import AIImageEnhancer from '@/features/ai/product-ai/AIImageEnhancer';
import AIReviewAnalyzer from '@/features/ai/product-ai/AIReviewAnalyzer';
import AISalesAdvisor from '@/features/ai/product-ai/AISalesAdvisor';
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
  X,
  Star,
  Gift,
  Trophy,
  Heart,
  Clock,
  ShieldCheck,
  Globe
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
  const toast = useToast();
  const router = useRouter();

  // Navigation states
  const [adminTab, setAdminTab] = useState<'overview' | 'ai_suite' | 'products' | 'orders' | 'users' | 'newsletter' | 'reviews' | 'campaigns' | 'monitoring' | 'reports' | 'logs' | 'security' | 'currencies' | 'languages'>('overview');
  const [loadingData, setLoadingData] = useState(true);

  // Currency Manager states
  const [adminCurrencies, setAdminCurrencies] = useState<any[]>([]);
  const [showCreateCurrencyModal, setShowCreateCurrencyModal] = useState(false);
  const [showEditCurrencyModal, setShowEditCurrencyModal] = useState(false);
  const [selectedEditCurrency, setSelectedEditCurrency] = useState<any>(null);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [newCurrencyDefault, setNewCurrencyDefault] = useState(false);
  const [editCurrencySymbol, setEditCurrencySymbol] = useState('');
  const [editCurrencyRate, setEditCurrencyRate] = useState('');
  const [editCurrencyDefault, setEditCurrencyDefault] = useState(false);

  // Language Manager states
  const [adminLanguages, setAdminLanguages] = useState<any[]>([]);
  const [showCreateLanguageModal, setShowCreateLanguageModal] = useState(false);
  const [showEditLanguageModal, setShowEditLanguageModal] = useState(false);
  const [selectedEditLanguage, setSelectedEditLanguage] = useState<any>(null);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageFlag, setNewLanguageFlag] = useState('');
  const [newLanguageDefault, setNewLanguageDefault] = useState(false);
  const [newLanguageActive, setNewLanguageActive] = useState(true);
  const [editLanguageName, setEditLanguageName] = useState('');
  const [editLanguageFlag, setEditLanguageFlag] = useState('');
  const [editLanguageDefault, setEditLanguageDefault] = useState(false);
  const [editLanguageActive, setEditLanguageActive] = useState(true);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allNewsletters, setAllNewsletters] = useState<NewsletterSub[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<any>(null);
  // Enterprise states
  const [enterpriseLogs, setEnterpriseLogs] = useState<any[]>([]);
  const [enterpriseLogsPage, setEnterpriseLogsPage] = useState(1);
  const [enterpriseLogsTotalPages, setEnterpriseLogsTotalPages] = useState(1);
  const [monitoringStats, setMonitoringStats] = useState<any>(null);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState<any[]>([]);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [proofFileNames, setProofFileNames] = useState<Record<string, string>>({});
  const [searchLogsQuery, setSearchLogsQuery] = useState('');

  // User Session Inspection states
  const [selectedInspectUser, setSelectedInspectUser] = useState<User | null>(null);
  const [inspectCart, setInspectCart] = useState<any | null>(null);
  const [inspectWishlist, setInspectWishlist] = useState<any | null>(null);
  const [inspectOrders, setInspectOrders] = useState<Order[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  const handleInspectUserSession = async (targetUser: User) => {
    setSelectedInspectUser(targetUser);
    setLoadingInspect(true);
    setShowInspectModal(true);
    setInspectCart(null);
    setInspectWishlist(null);
    setInspectOrders([]);
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        apiClient.get(`/admin/users/${targetUser.id}/cart`),
        apiClient.get(`/admin/users/${targetUser.id}/wishlist`)
      ]);
      
      if (cartRes.data?.success) {
        setInspectCart(cartRes.data.data);
      }
      if (wishlistRes.data?.success) {
        setInspectWishlist(wishlistRes.data.data);
      }
      
      const userOrders = allOrders.filter(o => {
        const oUser = o.user as any;
        return oUser && (oUser._id === targetUser.id || oUser.id === targetUser.id);
      });
      setInspectOrders(userOrders);
    } catch (err) {
      console.error('Error inspecting user session:', err);
      toast.error('Failed to load user session data.');
    } finally {
      setLoadingInspect(false);
    }
  };

  // 2FA Setup states
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
      toast.error(err.response?.data?.message || 'Failed to initialize 2FA setup');
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
        toast.success('Two-Factor Authentication activated successfully!');
        if (user) {
          user.twoFactorEnabled = true;
        }
      }
    } catch (err: any) {
      setVerificationError(err.response?.data?.message || 'Invalid code. Verification failed.');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to deactivate 2FA? This lowers account security.')) return;
    setLoading2FA(true);
    try {
      const res = await apiClient.post('/auth/2fa/disable');
      if (res.data?.success) {
        toast.success('Two-Factor Authentication has been deactivated.');
        setIsSettingUp2FA(false);
        setRecoveryCodes([]);
        if (user) {
          user.twoFactorEnabled = false;
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  // Search/Filters states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');

  // Lucky Draw Modals states
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    terms: '',
    bannerImage: '',
    productTitle: '',
    productPrice: 15,
    productDescription: '',
    productImage: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
    prizeName: '',
    prizeDescription: '',
    prizeImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80',
    ticketLimit: 50,
    maxTicketsPerUser: 10,
    ticketsPerPurchase: 1,
    drawDate: '',
    visibility: 'public',
    status: 'active'
  });

  // Lottery Draw states
  const [drawingCampaign, setDrawingCampaign] = useState<any | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<any | null>(null);

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
      } else if (adminTab === 'reviews') {
        const res = await apiClient.get('/reviews');
        if (res.data?.success) {
          setAllReviews(res.data.data || []);
        }
            } else if (adminTab === 'campaigns') {
        const [campRes, analyticsRes] = await Promise.all([
          apiClient.get('/campaigns'),
          apiClient.get('/campaigns/admin/analytics').catch(() => ({ data: { success: false } }))
        ]);
        if (campRes.data?.success) {
          setAllCampaigns(campRes.data.data || []);
        }
        if (analyticsRes.data?.success) {
          setCampaignAnalytics(analyticsRes.data.data);
        }
      } else if (adminTab === 'logs') {
        const res = await apiClient.get(`/enterprise/logs?page=${enterpriseLogsPage}&limit=10`);
        if (res.data?.success) {
          setEnterpriseLogs(res.data.data || []);
          if (res.data.pagination) {
            setEnterpriseLogsTotalPages(res.data.pagination.pages || 1);
          }
        }
      } else if (adminTab === 'monitoring') {
        const res = await apiClient.get('/enterprise/monitoring-stats');
        if (res.data?.success) {
          setMonitoringStats(res.data.data);
        }
      } else if (adminTab === 'reports') {
        // Fetch general analytics
        const res = await apiClient.get('/campaigns/admin/analytics').catch(() => ({ data: { success: false } }));
        if (res.data?.success) {
          setCampaignAnalytics(res.data.data);
        }
      } else if (adminTab === 'currencies') {
        const res = await apiClient.get('/currencies');
        if (res.data?.success) {
          setAdminCurrencies(res.data.data || []);
        }
      } else if (adminTab === 'languages') {
        const res = await apiClient.get('/languages/admin/all');
        if (res.data?.success) {
          setAdminLanguages(res.data.data || []);
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
        toast.success(`Order status updated to "${status}" successfully.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // --- USER ROLE ACTIONS ---
  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    try {
      const res = await apiClient.put(`/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res.data?.success) {
        setAllUsers(allUsers.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
        toast.success(`User role updated to "${newRole}".`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      const res = await apiClient.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        setAllUsers(allUsers.filter((u) => u.id !== userId));
        toast.success('User account deleted.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // --- NEWSLETTER SUBSCRIPTION ACTIONS ---
  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Remove this email subscription?')) return;
    try {
      const res = await apiClient.delete(`/newsletter/subscriptions/${subId}`);
      if (res.data?.success) {
        setAllNewsletters(allNewsletters.filter((n) => n.id !== subId && n._id !== subId));
        toast.success('Subscription removed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete subscription.');
    }
  };

  // --- PRODUCT MANAGEMENT ACTIONS ---
  const handleOpenCreateProduct = () => {
    router.push('/dashboard/products/create');
  };

  const handleOpenEditProduct = (prod: Product) => {
    router.push(`/dashboard/products/${prod.id}/edit`);
  };

  const handleDeleteProduct = async (prodId: string | number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await apiClient.delete(`/products/${prodId}`);
      if (res.status === 200 || res.data?.success) {
        setAllProducts(allProducts.filter((p) => p.id !== prodId));
        toast.success('Product deleted successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
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
          toast.success('Product details updated.');
        }
      } else {
        // Create Product
        const res = await apiClient.post('/products', productForm);
        if (res.data?.success) {
          setAllProducts([res.data.data, ...allProducts]);
          toast.success('New product created successfully.');
        }
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product details.');
    }
  };

  const handleOpenEditCampaign = (camp: any) => {
    setEditingCampaign(camp);
    setCampaignForm({
      title: camp.title || '',
      description: camp.description || '',
      terms: camp.terms || '',
      bannerImage: camp.bannerImage || '',
      productTitle: camp.productTitle || '',
      productPrice: camp.productPrice || 15,
      productDescription: camp.productDescription || '',
      productImage: camp.productImage || '',
      prizeName: camp.prizeName || '',
      prizeDescription: camp.prizeDescription || '',
      prizeImage: camp.prizeImage || '',
      ticketLimit: camp.ticketLimit || 50,
      maxTicketsPerUser: camp.maxTicketsPerUser || 10,
      ticketsPerPurchase: camp.ticketsPerPurchase || 1,
      drawDate: camp.drawDate ? new Date(camp.drawDate).toISOString().split('T')[0] : '',
      visibility: camp.visibility || 'public',
      status: camp.status || 'active'
    });
    setIsCampaignModalOpen(true);
  };

  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      title: '', description: '', terms: '', bannerImage: '',
      productTitle: '', productPrice: 15, productDescription: '',
      productImage: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
      prizeName: '', prizeDescription: '',
      prizeImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80',
      ticketLimit: 50, maxTicketsPerUser: 10, ticketsPerPurchase: 1,
      drawDate: '', visibility: 'public', status: 'active'
    });
    setIsCampaignModalOpen(true);
  };

  const handleCampaignFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...campaignForm, drawDate: campaignForm.drawDate || null };
      if (editingCampaign) {
        const res = await apiClient.put(`/campaigns/admin/${editingCampaign.id}`, payload);
        if (res.data?.success) {
          setAllCampaigns(allCampaigns.map(c => c.id === editingCampaign.id ? res.data.data : c));
          toast.success('Campaign updated successfully!');
          setIsCampaignModalOpen(false);
        }
      } else {
        const res = await apiClient.post('/campaigns/admin/create', payload);
        if (res.data?.success) {
          setAllCampaigns([res.data.data, ...allCampaigns]);
          toast.success('Lucky Draw campaign published successfully!');
          setIsCampaignModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save campaign.');
    }
  };

    const fetchAuditTrail = async (entityType: string, entityId: string) => {
    try {
      const res = await apiClient.get(`/enterprise/audit/${entityType}/${entityId}`);
      if (res.data?.success) {
        setSelectedAuditTrail(res.data.data || []);
        setShowAuditTrailModal(true);
      }
    } catch (err: any) {
      toast.error('Failed to load audit trail history.');
    }
  };

  const handleUpdateCampaignStatus = async (campId: string, status: string) => {
    try {
      const res = await apiClient.put(`/campaigns/admin/${campId}/status`, { status });
      if (res.data?.success) {
        setAllCampaigns(allCampaigns.map(c => c.id === campId ? { ...c, status } : c));
        toast.success(`Campaign status updated to "${status}".`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update campaign status.');
    }
  };

  const handleConductDraw = async (camp: any) => {
    setDrawingCampaign(camp);
    setIsDrawing(true);
    setDrawnWinner(null);

    try {
      // Simulate frontend wheel spin animation for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const res = await apiClient.post(`/campaigns/admin/${camp.id}/draw`);
      if (res.data?.success) {
        const winner = res.data.data.campaign.winnerUser;
        const ticketNum = res.data.data.winningTicket.ticketNumber;
        setDrawnWinner({ name: winner.name, email: winner.email, ticketNumber: ticketNum });
        
        // Refresh campaigns
        setAllCampaigns(
          allCampaigns.map((c) => (c.id === camp.id ? res.data.data.campaign : c))
        );
      } else {
        alert(res.data?.message || 'Lottery draw failed.');
        setIsDrawing(false);
        setDrawingCampaign(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to conduct lottery draw.');
      setIsDrawing(false);
      setDrawingCampaign(null);
    }
  };

  // --- CURRENCY MANAGER ACTIONS ---
  const fetchCurrencies = async () => {
    try {
      const res = await apiClient.get('/currencies');
      if (res.data?.success) {
        setAdminCurrencies(res.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to reload currencies list.');
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/currencies', {
        code: newCurrencyCode.toUpperCase().trim(),
        symbol: newCurrencySymbol.trim(),
        rate: Number(newCurrencyRate),
        isDefault: newCurrencyDefault,
      });
      if (res.data?.success) {
        toast.success(`Currency ${newCurrencyCode} added successfully!`);
        fetchCurrencies();
        setNewCurrencyCode('');
        setNewCurrencySymbol('');
        setNewCurrencyRate('');
        setNewCurrencyDefault(false);
        setShowCreateCurrencyModal(false);
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add currency.');
    }
  };

  const handleUpdateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditCurrency) return;
    const cid = selectedEditCurrency.id || selectedEditCurrency._id;
    try {
      const res = await apiClient.put(`/currencies/${cid}`, {
        symbol: editCurrencySymbol.trim(),
        rate: Number(editCurrencyRate),
        isDefault: editCurrencyDefault,
      });
      if (res.data?.success) {
        toast.success(`Currency updated successfully!`);
        fetchCurrencies();
        setShowEditCurrencyModal(false);
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update currency.');
    }
  };

  const handleDeleteCurrency = async (currency: any) => {
    if (currency.isDefault) {
      toast.error('Cannot delete the default base currency.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the currency ${currency.code}?`)) return;
    const cid = currency.id || currency._id;
    try {
      const res = await apiClient.delete(`/currencies/${cid}`);
      if (res.data?.success) {
        toast.success(`Currency deleted successfully.`);
        fetchCurrencies();
        useCurrencyStore.getState().loadCurrencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete currency.');
    }
  };

  const handleOpenEditCurrency = (currency: any) => {
    setSelectedEditCurrency(currency);
    setEditCurrencySymbol(currency.symbol);
    setEditCurrencyRate(String(currency.rate));
    setEditCurrencyDefault(currency.isDefault);
    setShowEditCurrencyModal(true);
  };

  // --- LANGUAGE MANAGER ACTIONS ---
  const fetchLanguages = async () => {
    try {
      const res = await apiClient.get('/languages/admin/all');
      if (res.data?.success) {
        setAdminLanguages(res.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to reload languages list.');
    }
  };

  const handleCreateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/languages', {
        code: newLanguageCode.toLowerCase().trim(),
        name: newLanguageName.trim(),
        flag: newLanguageFlag.trim(),
        isDefault: newLanguageDefault,
        isActive: newLanguageActive,
      });
      if (res.data?.success) {
        toast.success(`Language ${newLanguageName} added successfully!`);
        fetchLanguages();
        setNewLanguageCode('');
        setNewLanguageName('');
        setNewLanguageFlag('');
        setNewLanguageDefault(false);
        setNewLanguageActive(true);
        setShowCreateLanguageModal(false);
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add language.');
    }
  };

  const handleUpdateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditLanguage) return;
    const lid = selectedEditLanguage.id || selectedEditLanguage._id;
    try {
      const res = await apiClient.put(`/languages/${lid}`, {
        name: editLanguageName.trim(),
        flag: editLanguageFlag.trim(),
        isDefault: editLanguageDefault,
        isActive: editLanguageActive,
      });
      if (res.data?.success) {
        toast.success(`Language updated successfully!`);
        fetchLanguages();
        setShowEditLanguageModal(false);
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update language.');
    }
  };

  const handleDeleteLanguage = async (language: any) => {
    if (language.isDefault) {
      toast.error('Cannot delete the default base language.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the language ${language.name}?`)) return;
    const lid = language.id || language._id;
    try {
      const res = await apiClient.delete(`/languages/${lid}`);
      if (res.data?.success) {
        toast.success(`Language deleted successfully.`);
        fetchLanguages();
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete language.');
    }
  };

  const handleOpenEditLanguage = (language: any) => {
    setSelectedEditLanguage(language);
    setEditLanguageName(language.name);
    setEditLanguageFlag(language.flag);
    setEditLanguageDefault(language.isDefault);
    setEditLanguageActive(language.isActive);
    setShowEditLanguageModal(true);
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
          <p className="text-sm text-gray-400 mt-2">
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
            <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium mb-1">
              <Link href="/profile" className="hover:text-gray-650 dark:hover:text-gray-200">Profile</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-red-500 font-bold">Admin Console</span>
            </div>
            <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-[#f5f1eb] tracking-tight">
              Management Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                <span className="text-sm font-black text-gray-800 dark:text-gray-250">Master Admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION TAB SWITCHER */}
        <div className="lg:w-1/4 flex flex-col gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'ai_suite', label: 'AI Commerce Suite', icon: Sparkles },
            { id: 'products', label: 'Products Catalog', icon: Shirt },
            { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            { id: 'users', label: 'User Accounts', icon: Users },
            { id: 'newsletter', label: 'Newsletter Subs', icon: Mail },
            { id: 'campaigns', label: 'Manage Campaigns', icon: Gift },
            { id: 'monitoring', label: 'System Monitoring', icon: TrendingUp },
            { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
            { id: 'logs', label: 'Action Audit Logs', icon: ShieldAlert },
            { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
            { id: 'currencies', label: 'Manage Currencies', icon: RefreshCw },
            { id: 'languages', label: 'Manage Languages', icon: Globe }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminTab(item.id as any)}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-[#8b6f47] dark:text-[#c9a96b] border-gray-200 dark:border-gray-800 shadow-sm scale-[1.01]'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-250 hover:bg-gray-55 dark:hover:bg-gray-800/50 border-transparent hover:translate-x-1'
                }`}
              >
                <span className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" /> {item.label}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`} />
              </button>
            );
          })}
          
          <hr className="my-2 border-gray-200 dark:border-gray-800" />
          <Button onClick={loadAdminData} variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
          </Button>
        </div>

        {/* WORKSPACE DETAILED VIEWS */}
        <div className="lg:w-3/4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          
          {loadingData ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#8b6f47]" />
              <span className="text-sm font-semibold">Gathering backend registers...</span>
            </div>
          ) : (
            <>
              {/* AI COMMERCE SUITE VIEW */}
              {adminTab === 'ai_suite' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        AI Commerce Platform Suite
                      </h2>
                      <p className="text-xs text-gray-500">
                        Manage automated AI product descriptions, studio image enhancers, review sentiment intelligence, and sales advisors.
                      </p>
                    </div>
                  </div>

                  <AISalesAdvisor />
                  <AIProductDescriptionGen />
                  <AIImageEnhancer />
                  <AIReviewAnalyzer />
                </div>
              )}

              {/* 1. OVERVIEW VIEW */}
              {adminTab === 'overview' && dashboard && (
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
              )}

              {/* 2. MANAGE PRODUCTS VIEW */}
              {adminTab === 'products' && (
                <ProductTable onProductChange={loadAdminData} />
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
                      className="w-full text-sm pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm text-left">
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
                      className="w-full text-sm pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm text-left">
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
                            <td className="p-3 text-right flex justify-end gap-2 items-center">
                              <Button
                                onClick={() => handleInspectUserSession(u)}
                                variant="outline"
                                size="sm"
                                className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-55 flex items-center gap-1"
                              >
                                <Search className="w-3 h-3" /> Inspect Session
                              </Button>
                              <Button
                                onClick={() => handleToggleUserRole(u)}
                                variant="outline"
                                size="sm"
                                className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-55"
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
                    <table className="w-full text-sm text-left">
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

              {/* 6. MANAGE REVIEWS VIEW */}
              {adminTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Product Reviews</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search reviews by customer name, comment, or product title..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="w-full text-sm pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Reviews Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Rating</th>
                          <th className="p-3">Comment</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allReviews
                          .filter((r) =>
                            (r.userName || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                            (r.review || r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                            (r.product?.title || '').toLowerCase().includes(reviewSearch.toLowerCase())
                          )
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-800 dark:text-gray-200">
                                <span className="block max-w-[150px] truncate">{r.product?.title || 'Unknown Product'}</span>
                              </td>
                              <td className="p-3">
                                <span className="block font-semibold text-gray-800 dark:text-gray-200">{r.userName || (r.user as any)?.name}</span>
                                <span className="block text-[10px] text-gray-400">{(r.user as any)?.email}</span>
                              </td>
                              <td className="p-3">
                                <span className="flex items-center text-yellow-500 font-bold gap-0.5">
                                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                  {r.rating}/5
                                </span>
                              </td>
                              <td className="p-3 max-w-[200px] truncate text-gray-650 dark:text-gray-300" title={r.review || r.comment}>
                                {r.review || r.comment}
                              </td>
                              <td className="p-3 text-gray-550">
                                {new Date(r.createdAt || r.date).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this review?')) return;
                                    try {
                                      const res = await apiClient.delete(`/reviews/${r.id}`);
                                      if (res.data?.success) {
                                        setAllReviews(allReviews.filter((review) => review.id !== r.id));
                                        toast.success('Review deleted successfully.');
                                      }
                                    } catch (err: any) {
                                      toast.error(err.response?.data?.message || 'Failed to delete review.');
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Delete Review"
                                >
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

              {/* 7. MANAGE CAMPAIGNS VIEW */}
              {adminTab === 'campaigns' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Prize Campaign Manager</h2>
                    <Button onClick={handleOpenCreateCampaign} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] hover:bg-[#725a38] text-white flex items-center gap-1.5 border-0">
                      <Plus className="w-4 h-4" /> Create Campaign
                    </Button>
                  </div>

                  {/* Campaign Analytics Cards */}
                  {campaignAnalytics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-[#8b6f47]/5 to-[#8b6f47]/10 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <span className="block text-[9px] text-gray-400 uppercase font-black">Campaign Revenue</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">${campaignAnalytics.overview.totalRevenue.toFixed(0)}</span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50/30 to-blue-50/60 dark:from-blue-950/15 dark:to-blue-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <span className="block text-[9px] text-gray-400 uppercase font-black">Tickets Issued</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.totalTickets}</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50/30 to-purple-50/60 dark:from-purple-950/15 dark:to-purple-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <span className="block text-[9px] text-gray-400 uppercase font-black">Unique Participants</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.uniqueParticipants}</span>
                      </div>
                      <div className="bg-gradient-to-br from-green-50/30 to-green-50/60 dark:from-emerald-950/15 dark:to-emerald-900/25 p-3.5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <span className="block text-[9px] text-gray-400 uppercase font-black">Active Campaigns</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">{campaignAnalytics.overview.activeCampaigns}</span>
                      </div>
                    </div>
                  )}

                  {/* Revenue Chart (CSS Bar Chart) */}
                  {campaignAnalytics?.revenueByCampaign?.length > 0 && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Revenue by Campaign</h4>
                      <div className="space-y-2">
                        {campaignAnalytics.revenueByCampaign.slice(0, 5).map((item: any, idx: number) => {
                          const maxRev = campaignAnalytics.revenueByCampaign[0]?.revenue || 1;
                          const pct = Math.round((item.revenue / maxRev) * 100);
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-gray-500 w-24 truncate">{item.campaignTitle}</span>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-gray-600 dark:text-gray-300 w-12 text-right">${item.revenue}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search campaigns by title or prize name..."
                      value={campaignSearch}
                      onChange={(e) => setCampaignSearch(e.target.value)}
                      className="w-full text-sm pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Campaigns Table */}
                  <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Campaign Prize</th>
                          <th className="p-3">Product Cost</th>
                          <th className="p-3">Sold / Limit</th>
                          <th className="p-3">Draw Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allCampaigns
                          .filter((c) =>
                            c.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                            c.prizeName.toLowerCase().includes(campaignSearch.toLowerCase())
                          )
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/40">
                              <td className="p-3">
                                <span className="block font-bold text-gray-800 dark:text-gray-200">{c.prizeName}</span>
                                <span className="block text-[10px] text-gray-400">{c.title}</span>
                              </td>
                              <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${c.productPrice.toFixed(2)}</td>
                              <td className="p-3">
                                <span className="font-mono">{c.ticketsSold}/{c.ticketLimit}</span>
                                <div className="w-16 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] rounded-full" style={{ width: `${Math.min(100, (c.ticketsSold / c.ticketLimit) * 100)}%` }} />
                                </div>
                              </td>
                              <td className="p-3 text-[10px] text-gray-500">
                                {c.drawDate ? new Date(c.drawDate).toLocaleDateString() : '—'}
                              </td>
                              <td className="p-3">
                                <select
                                  value={c.status}
                                  onChange={(e) => handleUpdateCampaignStatus(c.id, e.target.value)}
                                  className={`text-[9px] font-bold border rounded-lg px-1.5 py-0.5 bg-white dark:bg-gray-900 ${
                                    c.status === 'completed' ? 'text-yellow-700 border-yellow-300' :
                                    c.status === 'sold-out' ? 'text-red-700 border-red-300' :
                                    c.status === 'active' ? 'text-blue-700 border-blue-300' :
                                    c.status === 'paused' ? 'text-orange-700 border-orange-300' :
                                    c.status === 'archived' ? 'text-gray-500 border-gray-300' :
                                    'text-gray-500 border-gray-300'
                                  }`}
                                >
                                  <option value="draft">Draft</option>
                                  <option value="active">Active</option>
                                  <option value="paused">Paused</option>
                                  <option value="sold-out">Sold Out</option>
                                  <option value="completed">Completed</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                                                    <button onClick={() => fetchAuditTrail('Campaign', c.id)} className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg" title="Audit Trail">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleOpenEditCampaign(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg" title="Edit Campaign">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {c.status !== 'completed' && (
                                    <Button
                                      onClick={() => handleConductDraw(c)}
                                      size="sm"
                                      className="text-[8px] py-1 px-2 font-bold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black border-0 shadow-sm"
                                    >
                                      Draw 🎲
                                    </Button>
                                  )}
                                                                    {c.status === 'completed' && (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <span className="text-[9px] text-yellow-600 font-bold px-1">
                                        🏆 {c.winnerUser?.name || 'Winner'}
                                      </span>
                                      {proofFileNames[c.id] ? (
                                        <span className="text-[7.5px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-200/20 font-bold">
                                          📄 Proof: {proofFileNames[c.id]}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const proofInput = document.createElement('input');
                                            proofInput.type = 'file';
                                            proofInput.accept = 'image/*';
                                            proofInput.onchange = (e: any) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setProofFileNames(prev => ({ ...prev, [c.id]: file.name }));
                                                toast.success(`Successfully uploaded delivery proof validation file for drawing reward!`);
                                              }
                                            };
                                            proofInput.click();
                                          }}
                                          className="text-[8px] font-black text-blue-600 hover:underline hover:text-blue-700 uppercase"
                                        >
                                          Upload Proof
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 10. SECURITY & 2FA VIEW */}
              {adminTab === 'security' && (
                <div className="space-y-6 text-left animate-fade-in">
                  <div className="flex items-center mb-6 border-b pb-3.5 dark:border-gray-800">
                    <ShieldCheck className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b] mr-2" />
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Security & 2FA Setup</h2>
                  </div>

                  {!user?.twoFactorEnabled ? (
                    /* 2FA Disabled State */
                    <div className="space-y-6">
                      {!isSettingUp2FA ? (
                        <div className="space-y-4 max-w-xl">
                          <p className="text-xs text-gray-500 dark:text-gray-405 leading-relaxed">
                            Protect your administrative credentials with Two-Factor Authentication (2FA). By enabling 2FA, you will be required to enter a 6-digit verification code from your authenticator app (like Google Authenticator or Microsoft Authenticator) or a recovery code whenever you sign in.
                          </p>
                          <Button 
                            onClick={handleStart2FASetup} 
                            loading={loading2FA}
                            className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-xl font-bold px-6 border-0 shadow-md py-2.5 text-xs uppercase tracking-wider"
                          >
                            Enable 2FA Protection
                          </Button>
                        </div>
                      ) : (
                        /* 2FA Setup Flow */
                        <div className="space-y-6 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 bg-gray-50/50 dark:bg-gray-950/20 max-w-2xl">
                          <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">
                            Set Up Two-Factor Authentication
                          </h3>
                          
                          {recoveryCodes.length > 0 ? (
                            /* Step 2: Show recovery codes */
                            <div className="space-y-4">
                              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold leading-normal">
                                ✓ Two-Factor Authentication has been successfully enabled!
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                IMPORTANT: Save these recovery codes in a secure place. If you lose access to your authenticator app, you can use these codes to log back into your account. Each code can only be used once.
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-950 p-4 rounded-xl font-mono text-center text-xs font-bold text-gray-800 dark:text-gray-300 border dark:border-gray-800">
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
                                className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl px-6 font-bold py-2 text-xs"
                              >
                                Done & Close
                              </Button>
                            </div>
                          ) : (
                            /* Step 1: Scan QR and Verify */
                            <div className="space-y-6">
                              <div className="flex flex-col sm:flex-row gap-6 items-center">
                                {/* QR Code Container */}
                                {setupQrUrl && (
                                  <div className="p-3 bg-white border rounded-2xl shadow-sm flex-shrink-0">
                                    <img 
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(setupQrUrl)}`} 
                                      alt="2FA QR Code" 
                                      className="w-[160px] h-[160px]"
                                    />
                                  </div>
                                )}
                                
                                <div className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-left flex-1">
                                  <p className="font-bold text-gray-800 dark:text-gray-250 font-serif">Instructions:</p>
                                  <p>1. Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.).</p>
                                  <p>2. Choose "Scan QR Code" or add a new account.</p>
                                  <p>3. Scan the QR code, or enter this secret key manually:</p>
                                  <div className="p-2 bg-gray-100 dark:bg-gray-950 rounded-lg font-mono text-[11px] font-bold text-center text-gray-800 dark:text-gray-300 break-all select-all border border-gray-200 dark:border-gray-800">
                                    {setupSecret}
                                  </div>
                                </div>
                              </div>

                              {/* Verify Input */}
                              <div className="space-y-2.5 border-t border-gray-200 dark:border-gray-800 pt-4">
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">
                                  Enter 6-digit Verification Code
                                </label>
                                <div className="flex gap-4 items-end max-w-sm">
                                  <input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-center tracking-widest text-xs font-bold rounded-xl"
                                  />
                                  <Button 
                                    onClick={handleEnable2FA}
                                    loading={loading2FA}
                                    className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-950 rounded-xl font-bold px-5 py-2.5 text-xs"
                                  >
                                    Verify
                                  </Button>
                                </div>
                                {verificationError && (
                                  <p className="text-[10px] text-red-500 font-bold text-left">{verificationError}</p>
                                )}
                              </div>

                              <div className="text-left">
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 2FA Enabled State */
                    <div className="space-y-6 max-w-xl">
                      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                        <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-xs">Two-Factor Authentication is Active</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Your account has an extra layer of security validation active.</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <h3 className="font-serif text-base font-bold text-gray-800 dark:text-gray-200">
                          Deactivate Two-Factor Authentication
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          If you disable 2FA, you will no longer be prompted for a verification code when signing in, reducing your account security level.
                        </p>
                        <Button
                          onClick={handleDisable2FA}
                          loading={loading2FA}
                          className="bg-red-650 hover:bg-red-750 text-white rounded-xl px-5 py-2.5 font-bold text-xs border-0 uppercase tracking-wider"
                        >
                          Disable 2FA
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 11. MANAGE CURRENCIES VIEW */}
              {adminTab === 'currencies' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Dynamic Currencies (Store Localization)</h2>
                    <Button onClick={() => setShowCreateCurrencyModal(true)} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4" /> Add Currency
                    </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Code</th>
                          <th className="p-3">Symbol</th>
                          <th className="p-3">Rate (relative to USD)</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {adminCurrencies.map((curr) => (
                          <tr key={curr.id || curr._id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono font-bold text-gray-850 dark:text-white uppercase">{curr.code}</td>
                            <td className="p-3 text-lg font-bold text-gray-800 dark:text-gray-250 font-serif">{curr.symbol}</td>
                            <td className="p-3 font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b]">
                              1.00 USD = {curr.rate.toFixed(4)} {curr.code}
                            </td>
                            <td className="p-3">
                              {curr.isDefault ? (
                                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                  Base Currency
                                </span>
                              ) : (
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                  Secondary
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCurrency(curr)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer"
                                  title="Edit Currency Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {!curr.isDefault && (
                                  <button
                                    onClick={() => handleDeleteCurrency(curr)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                                    title="Delete Currency"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 12. MANAGE LANGUAGES VIEW */}
              {adminTab === 'languages' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Dynamic Languages (Store Localization)</h2>
                    <Button onClick={() => setShowCreateLanguageModal(true)} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4" /> Add Language
                    </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Flag</th>
                          <th className="p-3">Language Name</th>
                          <th className="p-3">Code</th>
                          <th className="p-3">Visibility status</th>
                          <th className="p-3">Default status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {adminLanguages.map((lang) => (
                          <tr key={lang.id || lang._id} className="hover:bg-gray-50/50">
                            <td className="p-3 text-2xl font-bold font-serif">{lang.flag}</td>
                            <td className="p-3 font-bold text-gray-800 dark:text-gray-250">{lang.name}</td>
                            <td className="p-3 font-mono font-bold text-gray-500 uppercase">{lang.code}</td>
                            <td className="p-3">
                              {lang.isActive ? (
                                <span className="bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                  Active (Visible)
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                  Hidden (Inactive)
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {lang.isDefault ? (
                                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                  Base Language
                                </span>
                              ) : (
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                  Secondary
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditLanguage(lang)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer"
                                  title="Edit Language details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {!lang.isDefault && (
                                  <button
                                    onClick={() => handleDeleteLanguage(lang)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                                    title="Delete Language"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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

      {/* AUDIT TRAIL LOG MODAL */}
      {showAuditTrailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-y-auto max-h-[80vh] shadow-2xl p-6 relative">
            <button onClick={() => setShowAuditTrailModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600" /> Administrative Audit Trail Logs
            </h3>

            <div className="space-y-4">
              {selectedAuditTrail.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  No configuration modifications recorded yet for this entity.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {selectedAuditTrail.map((trail, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 border-b pb-1 mb-2 dark:border-gray-800">
                        <span className="font-bold">By: {trail.changedBy?.name || 'Administrator'} ({trail.changedBy?.email})</span>
                        <span>{new Date(trail.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{trail.changeSummary}</p>
                      
                      {/* Before / After grid representation */}
                      <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t dark:border-gray-800 text-[10px]">
                        <div>
                          <span className="block font-bold text-red-500 uppercase tracking-widest text-[8px] mb-1">Previous Values:</span>
                          <pre className="p-2 bg-red-500/5 rounded border border-red-500/10 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                            {JSON.stringify(trail.previousState, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="block font-bold text-green-500 uppercase tracking-widest text-[8px] mb-1">Updated Values:</span>
                          <pre className="p-2 bg-green-500/5 rounded border border-green-500/10 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                            {JSON.stringify(trail.newState, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER SESSION INSPECTION MODAL */}
      {showInspectModal && selectedInspectUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-3xl overflow-y-auto max-h-[85vh] shadow-2xl p-6 relative">
            <button onClick={() => setShowInspectModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" /> Inspect Session: {selectedInspectUser.name}
            </h3>

            {loadingInspect ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#8b6f47]" />
                <span className="text-sm font-semibold text-gray-400">Loading user session data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Active Cart & Wishlist */}
                <div className="space-y-6">
                  {/* 1. Active Cart Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#8b6f47]" /> Active Shopping Cart
                    </h4>
                    {!inspectCart || inspectCart.products.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No items currently in cart.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {inspectCart.products.map((item: any) => (
                          <div key={item._id || item.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 font-medium">
                            <div className="truncate max-w-[150px] text-left">
                              <p className="font-bold text-gray-800 dark:text-gray-250 truncate">{item.product?.title}</p>
                              <p className="text-[10px] text-gray-400">{item.product?.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#8b6f47]">${item.product?.price}</p>
                              <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                          <span>Total Value:</span>
                          <span className="text-[#8b6f47]">${inspectCart.subtotal || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Wishlist Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" /> Current Wishlist Choice
                    </h4>
                    {!inspectWishlist || inspectWishlist.products.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No items currently in wishlist.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {inspectWishlist.products.map((item: any) => (
                          <div key={item._id || item.id} className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-[10px] text-left font-medium">
                            <p className="font-bold text-gray-800 dark:text-gray-250 truncate" title={item.title}>{item.title}</p>
                            <p className="font-bold text-[#8b6f47] mt-0.5">${item.price}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Customer Orders history */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" /> Placed Orders History
                  </h4>
                  {inspectOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No order placements recorded.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {inspectOrders.map((o) => (
                        <div key={o.id} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] space-y-1">
                          <div className="flex justify-between font-mono text-[9px] text-gray-400 border-b pb-1 dark:border-gray-800">
                            <span>#{o.id}</span>
                            <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold pt-1">
                            <span className="text-[#8b6f47] dark:text-[#c9a96b]">${o.total.toFixed(0)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                              o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                              o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>{o.orderStatus}</span>
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
      )}



      {/* CREATE/EDIT CAMPAIGN DIALOG MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl p-6 relative">
            
            <button onClick={() => setIsCampaignModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#8b6f47]" /> {editingCampaign ? 'Edit Campaign' : 'Create Lucky Draw Campaign'}
            </h3>

            <form onSubmit={handleCampaignFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Campaign Title</label>
                <Input type="text" placeholder="e.g., iPhone 16 Pro Campaign" value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} required className="w-full text-sm" />
              </div>

              {/* Campaign Config */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Draw Date</label>
                  <input type="date" value={campaignForm.drawDate} onChange={(e) => setCampaignForm({ ...campaignForm, drawDate: e.target.value })} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Max/User</label>
                  <Input type="number" value={campaignForm.maxTicketsPerUser} onChange={(e) => setCampaignForm({ ...campaignForm, maxTicketsPerUser: Number(e.target.value) })} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Visibility</label>
                  <select value={campaignForm.visibility} onChange={(e) => setCampaignForm({ ...campaignForm, visibility: e.target.value })} className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-2.5 focus:outline-none">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" placeholder="Campaign description..." />
              </div>

              {/* Product Section */}
              <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/30 dark:bg-gray-900/30 space-y-3">
                <span className="block text-[9px] font-black uppercase text-gray-400 tracking-wider">Target Product</span>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Title</label>
                  <Input type="text" placeholder="e.g. Swift Brass Gold Pen" value={campaignForm.productTitle} onChange={(e) => setCampaignForm({ ...campaignForm, productTitle: e.target.value })} required className="w-full text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Price ($)</label>
                    <Input type="number" value={campaignForm.productPrice} onChange={(e) => setCampaignForm({ ...campaignForm, productPrice: Number(e.target.value) })} required className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Ticket Limit</label>
                    <Input type="number" value={campaignForm.ticketLimit} onChange={(e) => setCampaignForm({ ...campaignForm, ticketLimit: Number(e.target.value) })} required className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Per Purchase</label>
                    <Input type="number" value={campaignForm.ticketsPerPurchase} onChange={(e) => setCampaignForm({ ...campaignForm, ticketsPerPurchase: Number(e.target.value) })} className="w-full text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Image URL</label>
                  <Input type="text" value={campaignForm.productImage} onChange={(e) => setCampaignForm({ ...campaignForm, productImage: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Product Description</label>
                  <textarea value={campaignForm.productDescription} onChange={(e) => setCampaignForm({ ...campaignForm, productDescription: e.target.value })} required rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
                </div>
              </div>

              {/* Prize Section */}
              <div className="border border-yellow-200/30 dark:border-yellow-800/20 p-4 rounded-2xl bg-yellow-50/10 dark:bg-yellow-950/5 space-y-3">
                <span className="block text-[9px] font-black uppercase text-yellow-600 tracking-wider">Grand Reward</span>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Name</label>
                  <Input type="text" placeholder="e.g. Suzuki GSX sports bike" value={campaignForm.prizeName} onChange={(e) => setCampaignForm({ ...campaignForm, prizeName: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Image URL</label>
                  <Input type="text" value={campaignForm.prizeImage} onChange={(e) => setCampaignForm({ ...campaignForm, prizeImage: e.target.value })} required className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Prize Description</label>
                  <textarea value={campaignForm.prizeDescription} onChange={(e) => setCampaignForm({ ...campaignForm, prizeDescription: e.target.value })} required rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Campaign Rules & Terms (optional)</label>
                <textarea value={campaignForm.terms} onChange={(e) => setCampaignForm({ ...campaignForm, terms: e.target.value })} rows={3} placeholder="Enter campaign rules, eligibility criteria, and terms of participation..." className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:outline-none bg-white dark:bg-gray-900" />
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 shadow-sm">
                {editingCampaign ? 'Update Campaign' : 'Publish Lucky Draw Campaign'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* LOTTERY DRAW WHEEL SPINNER ANIMATION OVERLAY */}
      {drawingCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-8 text-center space-y-6 relative">
            
            {isDrawing && (
              <div className="space-y-6 py-8">
                {/* Spinner */}
                <div className="relative w-24 h-24 mx-auto rounded-full border-4 border-dashed border-yellow-500 animate-spin flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-yellow-550 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-extrabold text-gray-900 dark:text-white">Lottery In Progress...</h3>
                  <p className="text-sm text-gray-450">Selecting random ticket from campaign database entries.</p>
                </div>

                {/* Spinning Ticket Code Indicator */}
                <div className="bg-gray-105 dark:bg-gray-950 p-3 rounded-2xl border font-mono font-bold text-sm tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                  SWIFT-TKT-{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>
            )}

            {drawnWinner && (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-950/40 rounded-full flex items-center justify-center mx-auto text-yellow-600">
                  <Trophy className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-yellow-600 font-black uppercase tracking-widest block">Winner Chosen!</span>
                  <h3 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white">{drawnWinner.name}</h3>
                  <p className="text-sm text-gray-450">Customer account: {drawnWinner.email}</p>
                </div>

                <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-300/30 text-center">
                  <span className="block text-[8px] text-gray-450 uppercase font-black tracking-wider mb-1">Winning Ticket Code</span>
                  <span className="font-mono text-lg font-bold text-[#8b6f47] dark:text-[#c9a96b] tracking-wider">
                    {drawnWinner.ticketNumber}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    setDrawingCampaign(null);
                    setDrawnWinner(null);
                    setIsDrawing(false);
                  }}
                  className="w-full text-sm font-bold py-2.5 rounded-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 shadow-sm"
                >
                  Close & Refresh Dashboard
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CREATE CURRENCY DIALOG MODAL */}
      {showCreateCurrencyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowCreateCurrencyModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8b6f47]" /> Add Dynamic Currency
            </h3>

            <form onSubmit={handleCreateCurrency} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency Code (ISO)</label>
                <Input
                  type="text"
                  placeholder="e.g. BDT"
                  maxLength={3}
                  value={newCurrencyCode}
                  onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                  required
                  className="w-full text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Symbol</label>
                <Input
                  type="text"
                  placeholder="e.g. ৳ or BDT"
                  value={newCurrencySymbol}
                  onChange={(e) => setNewCurrencySymbol(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (1.00 USD = X Currency)</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 118.0"
                  value={newCurrencyRate}
                  onChange={(e) => setNewCurrencyRate(e.target.value)}
                  required
                  className="w-full text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newCurrencyDefault"
                  checked={newCurrencyDefault}
                  onChange={(e) => setNewCurrencyDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newCurrencyDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Set as store base currency (USD must remain 1.0 if not base)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Create Currency
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CURRENCY DIALOG MODAL */}
      {showEditCurrencyModal && selectedEditCurrency && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowEditCurrencyModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#8b6f47]" /> Edit Currency: {selectedEditCurrency.code}
            </h3>

            <form onSubmit={handleUpdateCurrency} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency Code (ISO)</label>
                <Input
                  type="text"
                  value={selectedEditCurrency.code}
                  disabled
                  className="w-full text-sm font-mono font-bold bg-gray-50/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Symbol</label>
                <Input
                  type="text"
                  value={editCurrencySymbol}
                  onChange={(e) => setEditCurrencySymbol(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (1.00 USD = X Currency)</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editCurrencyRate}
                  onChange={(e) => setEditCurrencyRate(e.target.value)}
                  required
                  className="w-full text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editCurrencyDefault"
                  checked={editCurrencyDefault}
                  onChange={(e) => setEditCurrencyDefault(e.target.checked)}
                  disabled={selectedEditCurrency.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editCurrencyDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Set as store base currency
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Update Currency Rate
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LANGUAGE DIALOG MODAL */}
      {showCreateLanguageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowCreateLanguageModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8b6f47]" /> Add Dynamic Language
            </h3>

            <form onSubmit={handleCreateLanguage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Code (ISO 2-letter)</label>
                <Input
                  type="text"
                  placeholder="e.g. fr"
                  maxLength={2}
                  value={newLanguageCode}
                  onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                  required
                  className="w-full text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Name</label>
                <Input
                  type="text"
                  placeholder="e.g. French"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Flag Emoji</label>
                <Input
                  type="text"
                  placeholder="e.g. 🇫🇷"
                  value={newLanguageFlag}
                  onChange={(e) => setNewLanguageFlag(e.target.value)}
                  required
                  className="w-full text-sm text-center text-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newLanguageDefault"
                  checked={newLanguageDefault}
                  onChange={(e) => setNewLanguageDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newLanguageDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Set as store base language
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newLanguageActive"
                  checked={newLanguageActive}
                  onChange={(e) => setNewLanguageActive(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newLanguageActive" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Make active (visible in header switcher)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Create Language
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LANGUAGE DIALOG MODAL */}
      {showEditLanguageModal && selectedEditLanguage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowEditLanguageModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#8b6f47]" /> Edit Language: {selectedEditLanguage.code.toUpperCase()}
            </h3>

            <form onSubmit={handleUpdateLanguage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Code (ISO)</label>
                <Input
                  type="text"
                  value={selectedEditLanguage.code.toUpperCase()}
                  disabled
                  className="w-full text-sm font-mono font-bold bg-gray-50/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Name</label>
                <Input
                  type="text"
                  value={editLanguageName}
                  onChange={(e) => setEditLanguageName(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Flag Emoji</label>
                <Input
                  type="text"
                  value={editLanguageFlag}
                  onChange={(e) => setEditLanguageFlag(e.target.value)}
                  required
                  className="w-full text-sm text-center text-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editLanguageDefault"
                  checked={editLanguageDefault}
                  onChange={(e) => setEditLanguageDefault(e.target.checked)}
                  disabled={selectedEditLanguage.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editLanguageDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Set as store base language
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editLanguageActive"
                  checked={editLanguageActive}
                  onChange={(e) => setEditLanguageActive(e.target.checked)}
                  disabled={selectedEditLanguage.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editLanguageActive" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Make active (visible in header switcher)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Update Language Details
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
