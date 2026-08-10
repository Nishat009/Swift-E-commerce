'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { productService, GetProductsParams } from '@/services/productService';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
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
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Archive,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  Sparkles,
  Tag
} from 'lucide-react';

interface ProductTableProps {
  onProductChange?: () => void;
}

export default function ProductTable({ onProductChange }: ProductTableProps) {
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Data & Pagination state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Summary state
  const [summary, setSummary] = useState({
    totalProducts: 0,
    publishedCount: 0,
    draftCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  // Query & Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [newArrivalOnly, setNewArrivalOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [sortBy, setSortBy] = useState<GetProductsParams['sortBy']>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Table selection & bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | number | null>(null);

  // Delete confirmation modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Options lists for filter dropdowns
  const categoriesList = ['Clothing', 'Top', 'Bottom', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Sofa', 'Chair', 'Table'];
  const brandsList = ['SwiftCart Signature', 'FurniturePro', 'WoodCraft', 'MarbleHome', 'AuraWear', 'NordicStyle', 'UrbanDenim'];

  useEffect(() => {
    loadProducts();
  }, [
    page,
    limit,
    search,
    categoryFilter,
    brandFilter,
    statusFilter,
    stockStatusFilter,
    minPrice,
    maxPrice,
    featuredOnly,
    newArrivalOnly,
    bestsellerOnly,
    sortBy,
  ]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({
        search,
        category: categoryFilter,
        brand: brandFilter,
        status: statusFilter,
        stockStatus: stockStatusFilter,
        minPrice,
        maxPrice,
        featured: featuredOnly,
        newArrival: newArrivalOnly,
        bestseller: bestsellerOnly,
        sortBy,
        page,
        limit,
      });

      setProducts(res.products);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setSummary(res.summary);
    } catch (err) {
      toast.error('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setStatusFilter('all');
    setStockStatusFilter('all');
    setMinPrice(0);
    setMaxPrice(10000);
    setFeaturedOnly(false);
    setNewArrivalOnly(false);
    setBestsellerOnly(false);
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    categoryFilter !== 'all' ||
    brandFilter !== 'all' ||
    statusFilter !== 'all' ||
    stockStatusFilter !== 'all' ||
    minPrice > 0 ||
    maxPrice < 10000 ||
    featuredOnly ||
    newArrivalOnly ||
    bestsellerOnly;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => String(p.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string | number) => {
    const sId = String(id);
    if (selectedIds.includes(sId)) {
      setSelectedIds(selectedIds.filter((item) => item !== sId));
    } else {
      setSelectedIds([...selectedIds, sId]);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'archive') => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product.');
      return;
    }
    if (!confirm(`Are you sure you want to bulk ${action} ${selectedIds.length} selected items?`)) return;

    try {
      await productService.bulkAction(action, selectedIds);
      toast.success(`Successfully executed bulk ${action} on ${selectedIds.length} items.`);
      setSelectedIds([]);
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err: any) {
      toast.error('Bulk operation failed.');
    }
  };

  const handleDuplicate = async (id: string | number) => {
    try {
      const duplicated = await productService.duplicateProduct(id);
      if (duplicated) {
        toast.success(`Product duplicated as Draft! (SKU: ${duplicated.sku})`);
        loadProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err) {
      toast.error('Failed to duplicate product.');
    }
  };

  const handleArchive = async (p: Product) => {
    try {
      const newStatus = p.status === 'archived' ? 'published' : 'archived';
      await productService.updateProduct(p.id, { status: newStatus });
      toast.success(`Product "${p.title}" is now ${newStatus}.`);
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const confirmDelete = (id: string | number) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await productService.deleteProduct(deleteTargetId);
      toast.success('Product deleted successfully.');
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const handleExport = () => {
    productService.exportProducts(products);
    toast.success('Exporting product catalog...');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      toast.error('Please paste valid JSON product array.');
      return;
    }
    try {
      const imported = productService.importProducts(importJsonText);
      toast.success(`Successfully imported ${imported.length} product records.`);
      setIsImportModalOpen(false);
      setImportJsonText('');
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err: any) {
      toast.error(err.message || 'Import failed. Check JSON format.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-gray-150/60 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b]" />
            Products
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Manage your store products, inventory, pricing, and catalog information.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850"
          >
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span>Import</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span>Export</span>
          </Button>

          <Link href="/dashboard/products/create">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Products */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Total Products</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-gray-900 dark:text-white mt-3">
            {summary.totalProducts}
          </p>
        </div>

        {/* Published */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Published</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-3">
            {summary.publishedCount}
          </p>
        </div>

        {/* Drafts */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-3">
            {summary.draftCount}
          </p>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-orange-600 dark:text-orange-400 mt-3">
            {summary.lowStockCount}
          </p>
        </div>

        {/* Out of Stock */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Out of Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-rose-600 dark:text-rose-400 mt-3">
            {summary.outOfStockCount}
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Filters Trigger, Sort & Bulk Actions */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search product, SKU, brand, tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-[#8b6f47]/30 text-gray-900 dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter & Sort Options */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-between md:justify-end">
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                hasActiveFilters
                  ? 'border-[#8b6f47] text-[#8b6f47] dark:text-[#c9a96b] bg-[#8b6f47]/10'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]"></span>
              )}
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#8b6f47]/30"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
                <option value="popular">Most Popular</option>
                <option value="stock-asc">Stock: Low → High</option>
              </select>
            </div>

            {/* Page Size */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Expandable Filter Drawer Panel */}
        {showFilterDrawer && (
          <div className="pt-4 mt-3 border-t border-gray-150 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            
            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Brand
              </label>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              >
                <option value="all">All Brands</option>
                {brandsList.map((b) => (
                  <option key={b} value={b.toLowerCase()}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Publish Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Stock Status
              </label>
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 flex-wrap pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Featured Only</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newArrivalOnly}
                  onChange={(e) => setNewArrivalOnly(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>New Arrival</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bestsellerOnly}
                  onChange={(e) => setBestsellerOnly(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Bestseller</span>
              </label>
            </div>

            {/* Reset Filters */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#8b6f47] dark:text-[#c9a96b] hover:underline font-bold"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4 animate-in fade-in">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              {selectedIds.length} items selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Bulk Publish
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Bulk Archive
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#8b6f47]" />
            <p className="text-xs font-medium">Loading products catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center text-gray-400">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-serif">
                No products found
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Try changing your search keywords or filter settings.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="rounded-xl"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === products.length && products.length > 0}
                      className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                    />
                  </th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                {products.map((p) => {
                  const isSelected = selectedIds.includes(String(p.id));
                  const discountPct = p.discountPercentage || (p.originalPrice && p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
                  const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-gray-850/40 transition-colors ${
                        isSelected ? 'bg-[#8b6f47]/5 dark:bg-[#8b6f47]/10' : ''
                      }`}
                    >
                      {/* Select */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                        />
                      </td>

                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                            alt={p.title}
                            className="w-11 h-11 rounded-xl object-cover border border-gray-200/60 dark:border-gray-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/products/${p.id}`}
                              className="font-bold text-gray-900 dark:text-white hover:text-[#8b6f47] dark:hover:text-[#c9a96b] truncate block font-serif text-sm"
                            >
                              {p.title || p.name}
                            </Link>
                            <p className="text-[10px] text-text-muted truncate mt-0.5">
                              {p.brand || 'SwiftCart Signature'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                        {p.sku || p.SKU || 'N/A'}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium capitalize">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-baseline gap-1.5">
                          <span>${p.price}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-[10px] text-text-muted line-through">
                              ${p.originalPrice}
                            </span>
                          )}
                        </div>
                        {discountPct > 0 && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                            {discountPct}% OFF
                          </span>
                        )}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            In Stock ({p.stock})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.status === 'draft' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Draft
                          </span>
                        ) : p.status === 'archived' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                            Archived
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                            Published
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Quick View Link */}
                          <Link
                            href={`/dashboard/products/${p.id}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="View product detail management page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick Edit Link */}
                          <Link
                            href={`/dashboard/products/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#8b6f47] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Action Dropdown Toggle */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveActionMenuId(activeActionMenuId === p.id ? null : p.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {activeActionMenuId === p.id && (
                              <div
                                className="absolute right-0 top-8 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-150 dark:border-gray-800 py-1.5 z-30 text-left"
                                onMouseLeave={() => setActiveActionMenuId(null)}
                              >
                                <Link
                                  href={`/dashboard/products/${p.id}`}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                                  <span>View Details</span>
                                </Link>

                                <Link
                                  href={`/dashboard/products/${p.id}/edit`}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#8b6f47]" />
                                  <span>Edit Product</span>
                                </Link>

                                <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleDuplicate(p.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Duplicate</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleArchive(p);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{p.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
                                </button>

                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

                                <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    confirmDelete(p.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Product</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {products.length > 0 && (
          <div className="p-4 bg-gray-50/70 dark:bg-gray-850/50 border-t border-gray-150 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <div>
              Showing <span className="font-bold text-gray-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.min(page * limit, total)}
              </span>{' '}
              of <span className="font-bold text-gray-900 dark:text-white">{total}</span> products
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-gray-900 dark:text-white px-2">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Delete Product?"
        message="This action cannot be undone. Permanent deletion will remove the product, inventory records, and images from the catalog."
        confirmText="Delete Product"
        variant="danger"
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Products Catalog"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Paste product JSON data array to bulk import into your store catalog.
          </p>
          <textarea
            rows={8}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="[ { &quot;title&quot;: &quot;Sample Product&quot;, &quot;price&quot;: 49.99, &quot;category&quot;: &quot;Clothing&quot; } ]"
            className="w-full p-3 font-mono text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#8b6f47]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportSubmit}
              className="rounded-xl bg-[#8b6f47] text-white"
            >
              Import Data
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
