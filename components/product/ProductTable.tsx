'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Star,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Zap
} from 'lucide-react';

interface ProductTableProps {
  onProductChange?: () => void;
}

export default function ProductTable({ onProductChange }: ProductTableProps) {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'title' | 'price' | 'stock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Quick Edit State
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [quickStock, setQuickStock] = useState<number>(0);
  const [quickStatus, setQuickStatus] = useState<string>('published');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products?all=true&limit=100');
      if (res.data?.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      toast.error('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map((p) => String(p.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'archive') => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product.');
      return;
    }
    if (!confirm(`Are you sure you want to bulk ${action} ${selectedIds.length} selected items?`)) return;

    try {
      const res = await apiClient.post('/products/bulk', { productIds: selectedIds, action });
      if (res.data?.success) {
        toast.success(`Successfully executed ${action} action on ${selectedIds.length} items.`);
        setSelectedIds([]);
        loadProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk operation failed.');
    }
  };

  const handleDuplicate = async (id: string | number) => {
    try {
      const res = await apiClient.post(`/products/${id}/duplicate`);
      if (res.data?.success) {
        toast.success('Product duplicated as Draft!');
        loadProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err: any) {
      toast.error('Failed to duplicate product.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiClient.delete(`/products/${id}`);
      if (res.data?.success || res.status === 200) {
        toast.success('Product removed.');
        loadProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err: any) {
      toast.error('Failed to delete product.');
    }
  };

  const handleOpenQuickEdit = (p: Product) => {
    setQuickEditProduct(p);
    setQuickPrice(p.price);
    setQuickStock(p.stock);
    setQuickStatus(p.status || 'published');
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditProduct) return;
    try {
      const res = await apiClient.put(`/products/${quickEditProduct.id}`, {
        price: Number(quickPrice),
        stock: Number(quickStock),
        status: quickStatus
      });
      if (res.data?.success) {
        toast.success('Quick Edit saved!');
        setQuickEditProduct(null);
        loadProducts();
      }
    } catch (err: any) {
      toast.error('Failed to update product.');
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Title', 'SKU', 'Brand', 'Category', 'Price', 'Stock', 'Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.sku || p.SKU || '',
      p.brand,
      p.category,
      p.price,
      p.stock,
      p.status || 'published'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `swiftcart_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export downloaded successfully!');
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        await apiClient.post('/products', item);
      }
      toast.success(`Successfully imported ${items.length} products!`);
      setIsImportModalOpen(false);
      setImportJsonText('');
      loadProducts();
    } catch (err) {
      toast.error('Invalid JSON format. Please check payload.');
    }
  };

  // Search & Sorting filter logic
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || p.SKU || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || (p.status || 'published') === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] || 0;
      let valB = b[sortField] || 0;
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6">
      
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wide">
            Product Inventory Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage catalog items, pricing, inventory stock, and bulk operations.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" size="sm" className="rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-gray-500" /> Import JSON
          </Button>
          <Link href="/dashboard/products/create">
            <Button size="sm" className="rounded-xl text-xs font-bold bg-[#8b6f47] hover:bg-[#725a38] text-white flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Create Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search by title, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 rounded-xl"
          />
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2 font-bold focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="clothing">Clothing</option>
            <option value="top">Tops</option>
            <option value="pants">Pants</option>
            <option value="shoes">Shoes</option>
            <option value="accessories">Accessories</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2 font-bold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div className="bg-[#8b6f47]/10 border border-[#8b6f47]/20 p-3 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-bold text-[#8b6f47]">
            {selectedIds.length} items selected
          </span>
          <div className="flex gap-2">
            <Button onClick={() => handleBulkAction('publish')} size="sm" className="text-[10px] py-1 px-3 bg-emerald-600 text-white rounded-lg font-bold">
              Bulk Publish
            </Button>
            <Button onClick={() => handleBulkAction('archive')} size="sm" className="text-[10px] py-1 px-3 bg-amber-600 text-white rounded-lg font-bold">
              Bulk Archive
            </Button>
            <Button onClick={() => handleBulkAction('delete')} size="sm" className="text-[10px] py-1 px-3 bg-red-600 text-white rounded-lg font-bold">
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto border rounded-2xl dark:border-gray-800 max-h-[600px] overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  className="rounded text-[#8b6f47]"
                />
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3 cursor-pointer" onClick={() => { setSortField('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Price <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3 cursor-pointer" onClick={() => { setSortField('stock'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Stock <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3">Rating</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-400 font-bold">
                  Loading catalog inventory...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-400">
                  No products matched the current search filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(String(p.id));
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(String(p.id))}
                        className="rounded text-[#8b6f47]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail} alt={p.title} className="w-10 h-10 object-cover rounded-xl border border-gray-150 dark:border-gray-800" />
                        <div className="min-w-0 max-w-[200px]">
                          <Link href={`/product/${p.id}`} className="font-bold text-gray-900 dark:text-white truncate block hover:underline">
                            {p.title}
                          </Link>
                          <span className="text-[10px] text-gray-400 capitalize">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-500 text-[10px]">{p.sku || p.SKU || 'N/A'}</td>
                    <td className="p-3 capitalize font-medium">{p.category}</td>
                    <td className="p-3 font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">${p.price}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        p.stock <= 0 ? 'bg-red-100 text-red-700' :
                        p.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 font-bold text-yellow-600">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {p.rating}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        p.status === 'published' || !p.status ? 'bg-green-100 text-green-800' :
                        p.status === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status || 'published'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1 items-center">
                        <button
                          onClick={() => handleOpenQuickEdit(p)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Quick Edit Stock/Price"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/dashboard/products/${p.id}/edit`}>
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Full Edit Page">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <Modal isOpen={!!quickEditProduct} onClose={() => setQuickEditProduct(null)} title={`Quick Edit: ${quickEditProduct.title}`}>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Selling Price ($)</label>
              <Input type="number" value={quickPrice} onChange={(e) => setQuickPrice(Number(e.target.value))} className="w-full text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Stock Quantity</label>
              <Input type="number" value={quickStock} onChange={(e) => setQuickStock(Number(e.target.value))} className="w-full text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Status</label>
              <select value={quickStatus} onChange={(e) => setQuickStatus(e.target.value)} className="w-full text-xs border rounded-xl p-2.5 font-bold">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button onClick={handleSaveQuickEdit} className="w-full bg-[#8b6f47] text-white font-bold py-2.5 rounded-xl">
              Save Quick Changes
            </Button>
          </div>
        </Modal>
      )}

      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Products Payload (JSON)">
          <div className="space-y-4 pt-2">
            <textarea
              rows={8}
              placeholder='Paste JSON array of products: [{"title": "Shirt", "price": 49, "stock": 20, ...}]'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full text-xs font-mono border rounded-xl p-3 focus:outline-none"
            />
            <Button onClick={handleImportJson} className="w-full bg-[#8b6f47] text-white font-bold py-2.5 rounded-xl">
              Import Catalog Payload
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
}
