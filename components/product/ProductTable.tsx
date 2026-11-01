'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { productService, GetProductsParams } from '@/services/productService';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { AdminButton, AdminEmpty, Pill, table } from '@/components/admin/AdminUI';
import { cn } from '@/lib/utils';
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
  MoreVertical,
  Archive,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';

interface ProductTableProps {
  onProductChange?: () => void;
}

const fieldClass =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const selectFieldClass =
  'h-9 cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-sm text-stone-900 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark] ' +
  'bg-no-repeat bg-[right_0.65rem_center] bg-[length:1rem_1rem] ' +
  'bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%239ca3af%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)]';
const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const checkboxClass = 'size-4 cursor-pointer rounded accent-[#8b6f47] dark:[color-scheme:dark]';
const iconButtonClass =
  'inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-white cursor-pointer';
const menuItemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-white/[0.05] cursor-pointer';

const money = (n: unknown) => `$${(Number(n) || 0).toFixed(2)}`;

function SummaryStat({ label, value, tone, className }: { label: string; value: number; tone?: 'warning' | 'danger'; className?: string }) {
  return (
    <div className={cn('bg-surface px-3 py-3 sm:px-4', className)}>
      <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
        {tone && <span className={cn('size-1.5 rounded-full', tone === 'danger' ? 'bg-red-500' : 'bg-amber-500')} aria-hidden />}
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function ProductTable({ onProductChange }: ProductTableProps) {
  const toast = useToast();

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
  // (loaded from the database, never hard-coded)
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [brandsList, setBrandsList] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories', { params: { all: true } }),
          apiClient.get('/products', { params: { all: true, limit: 500 } }),
        ]);
        if (cancelled) return;
        setCategoriesList((catRes.data?.data || []).map((c: any) => c.name));
        const brands = new Set<string>();
        (prodRes.data?.products || []).forEach((p: any) => p.brand && brands.add(p.brand));
        setBrandsList(Array.from(brands).sort((a, b) => a.localeCompare(b)));
      } catch {
        // filter lists stay empty; the product list itself reports its own errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

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
      toast.error(err?.message || 'Bulk operation failed.');
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate product.');
    }
  };

  const handleArchive = async (p: Product) => {
    try {
      const newStatus = p.status === 'archived' ? 'published' : 'archived';
      await productService.updateProduct(p.id, { status: newStatus });
      toast.success(`Product "${p.title}" is now ${newStatus}.`);
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
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
      toast.success('Product removed from the store (archived, past orders keep their history).');
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product.');
    }
  };

  const handleExport = () => {
    productService.exportProducts(products);
    toast.success('Exporting product catalog...');
  };

  const handleImportSubmit = async () => {
    if (!importJsonText.trim()) {
      toast.error('Please paste a JSON array or CSV text.');
      return;
    }
    try {
      const result = await productService.importProducts(importJsonText);
      if (result.failed.length > 0) {
        toast.error(`Imported ${result.created}, failed ${result.failed.length}: ${result.failed[0].title} - ${result.failed[0].message}`);
      } else {
        toast.success(`Successfully imported ${result.created} product records.`);
      }
      if (result.created > 0) {
        setIsImportModalOpen(false);
        setImportJsonText('');
      }
      loadProducts();
      if (onProductChange) onProductChange();
    } catch (err: any) {
      toast.error(err.message || 'Import failed. Check the JSON / CSV format.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
        <SummaryStat label="Total products" value={summary.totalProducts} />
        <SummaryStat label="Published" value={summary.publishedCount} />
        <SummaryStat label="Drafts" value={summary.draftCount} />
        <SummaryStat label="Low stock" value={summary.lowStockCount} tone={summary.lowStockCount > 0 ? 'warning' : undefined} />
        <SummaryStat label="Out of stock" value={summary.outOfStockCount} tone={summary.outOfStockCount > 0 ? 'danger' : undefined} className="col-span-2 sm:col-span-1" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search name, SKU, brand or tag"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(fieldClass, 'pl-9 pr-8')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2">
            <AdminButton
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              aria-expanded={showFilterDrawer}
              className={cn(showFilterDrawer && 'bg-stone-50 dark:bg-white/[0.06]')}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters && <span className="size-1.5 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" aria-label="Filters active" />}
            </AdminButton>

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={selectFieldClass}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="popular">Most popular</option>
                <option value="stock-asc">Stock: low to high</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminButton onClick={() => setIsImportModalOpen(true)} title="Import products from JSON or CSV">
            <Upload className="size-4" /> Import
          </AdminButton>
          <AdminButton onClick={handleExport} title="Download the products on this page as a JSON file">
            <Download className="size-4" /> Export
          </AdminButton>
          <Link href="/dashboard/products/create" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6f47]/40">
            <AdminButton variant="primary" tabIndex={-1}>
              <Plus className="size-4" /> Add product
            </AdminButton>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilterDrawer && (
        <div className="rounded-lg border border-line bg-stone-50/60 p-4 dark:bg-white/[0.02]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="pt-category" className={labelClass}>Category</label>
              <select
                id="pt-category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(selectFieldClass, 'w-full')}
              >
                <option value="all">All categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pt-brand" className={labelClass}>Brand</label>
              <select
                id="pt-brand"
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(selectFieldClass, 'w-full')}
              >
                <option value="all">All brands</option>
                {brandsList.map((b) => (
                  <option key={b} value={b.toLowerCase()}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pt-status" className={labelClass}>Publish status</label>
              <select
                id="pt-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(selectFieldClass, 'w-full')}
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="pt-stock" className={labelClass}>Stock level</label>
              <select
                id="pt-stock"
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(selectFieldClass, 'w-full')}
              >
                <option value="all">All stock levels</option>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className={checkboxClass}
                />
                Featured only
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={newArrivalOnly}
                  onChange={(e) => setNewArrivalOnly(e.target.checked)}
                  className={checkboxClass}
                />
                New arrivals
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={bestsellerOnly}
                  onChange={(e) => setBestsellerOnly(e.target.checked)}
                  className={checkboxClass}
                />
                Bestsellers
              </label>
            </div>
            <AdminButton size="sm" variant="ghost" onClick={handleClearFilters}>
              Clear all filters
            </AdminButton>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#8b6f47]/25 bg-[#8b6f47]/[0.06] px-3 py-2 dark:border-[#c9a96b]/25 dark:bg-[#c9a96b]/[0.06]">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {selectedIds.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton size="sm" onClick={() => handleBulkAction('publish')}>
              Publish
            </AdminButton>
            <AdminButton size="sm" onClick={() => handleBulkAction('archive')}>
              <Archive className="size-3.5" /> Archive
            </AdminButton>
            <AdminButton size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="size-3.5" /> Delete
            </AdminButton>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={cn(table.wrap, 'relative')}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-stone-500 dark:text-stone-400" role="status">
            <RefreshCw className="size-4 animate-spin" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <AdminEmpty
            icon={Package}
            title="No products found"
            description={hasActiveFilters ? 'Try a different search or clear the filters.' : 'Products you add will appear here.'}
            action={
              hasActiveFilters ? (
                <AdminButton size="sm" onClick={handleClearFilters}>
                  Clear filters
                </AdminButton>
              ) : undefined
            }
          />
        ) : (
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={cn(table.th, 'w-10 pr-0')}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === products.length && products.length > 0}
                    className={checkboxClass}
                    aria-label="Select all products on this page"
                  />
                </th>
                <th className={table.th}>Product</th>
                <th className={table.th}>Category</th>
                <th className={cn(table.th, 'text-right')}>Price</th>
                <th className={table.th}>Stock</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Created</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {products.map((p, rowIndex) => {
                const isSelected = selectedIds.includes(String(p.id));
                const discountPct = p.discountPercentage || (p.originalPrice && p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
                const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);
                const isOutOfStock = p.stock <= 0;
                const hasOriginal = Number(p.originalPrice) > 0 && Number(p.originalPrice) > Number(p.price);
                const openUpward = products.length > 3 && rowIndex >= products.length - 2;

                return (
                  <tr
                    key={p.id}
                    className={cn(table.tr, isSelected && 'bg-[#8b6f47]/[0.05] dark:bg-[#c9a96b]/[0.06]')}
                  >
                    <td className={cn(table.td, 'pr-0')}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(p.id)}
                        className={checkboxClass}
                        aria-label={`Select ${p.title || p.name}`}
                      />
                    </td>

                    <td className={table.td}>
                      <div className="flex min-w-[220px] items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.thumbnail || p.images?.[0] || ''}
                          alt=""
                          className="size-10 shrink-0 rounded-md border border-line bg-stone-100 object-cover dark:bg-white/5"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/products/${p.id}`}
                            className="block max-w-[300px] truncate font-medium text-stone-900 hover:text-[#8b6f47] dark:text-stone-100 dark:hover:text-[#c9a96b]"
                          >
                            {p.title || p.name}
                          </Link>
                          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                            {p.brand || '-'} · <span className="font-mono">{p.sku || p.SKU || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className={cn(table.td, 'whitespace-nowrap capitalize text-stone-700 dark:text-stone-300')}>
                      {p.category}
                    </td>

                    <td className={cn(table.td, 'whitespace-nowrap text-right tabular-nums')}>
                      <span className="font-medium text-stone-900 dark:text-white">{money(p.price)}</span>
                      {(hasOriginal || discountPct > 0) && (
                        <span className="block text-xs">
                          {hasOriginal && <span className="text-stone-400 line-through">{money(p.originalPrice)}</span>}
                          {discountPct > 0 && <span className="ml-1.5 font-medium text-red-600 first:ml-0 dark:text-red-400">-{discountPct}%</span>}
                        </span>
                      )}
                    </td>

                    <td className={table.td}>
                      {isOutOfStock ? (
                        <Pill tone="danger" dot>Out of stock</Pill>
                      ) : isLowStock ? (
                        <Pill tone="warning" dot>Low stock · <span className="tabular-nums">{p.stock}</span></Pill>
                      ) : (
                        <Pill tone="success" dot>In stock · <span className="tabular-nums">{p.stock}</span></Pill>
                      )}
                    </td>

                    <td className={table.td}>
                      {p.status === 'draft' ? (
                        <Pill tone="neutral">Draft</Pill>
                      ) : p.status === 'archived' ? (
                        <Pill tone="violet">Archived</Pill>
                      ) : (
                        <Pill tone="success">Published</Pill>
                      )}
                    </td>

                    <td className={cn(table.td, 'whitespace-nowrap text-xs text-stone-500 dark:text-stone-400')}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>

                    <td className={cn(table.td, 'text-right')}>
                      <div className="flex items-center justify-end gap-0.5">
                        <Link href={`/dashboard/products/${p.id}`} className={iconButtonClass} title="View product details" aria-label="View product details">
                          <Eye className="size-4" />
                        </Link>
                        <Link href={`/dashboard/products/${p.id}/edit`} className={iconButtonClass} title="Edit product" aria-label="Edit product">
                          <Edit2 className="size-4" />
                        </Link>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveActionMenuId(activeActionMenuId === p.id ? null : p.id)}
                            className={cn(iconButtonClass, activeActionMenuId === p.id && 'bg-stone-100 text-stone-900 dark:bg-white/[0.06] dark:text-white')}
                            aria-label="More actions"
                            aria-haspopup="menu"
                            aria-expanded={activeActionMenuId === p.id}
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {activeActionMenuId === p.id && (
                            <div
                              role="menu"
                              className={cn(
                                'absolute right-0 z-30 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 text-left shadow-lg',
                                openUpward ? 'bottom-9' : 'top-9'
                              )}
                              onMouseLeave={() => setActiveActionMenuId(null)}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  handleDuplicate(p.id);
                                }}
                                className={menuItemClass}
                              >
                                <Copy className="size-4 text-stone-400" />
                                Duplicate
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  handleArchive(p);
                                }}
                                className={menuItemClass}
                              >
                                <Archive className="size-4 text-stone-400" />
                                {p.status === 'archived' ? 'Unarchive' : 'Archive'}
                              </button>
                              <div className="my-1 border-t border-line" />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  confirmDelete(p.id);
                                }}
                                className={cn(menuItemClass, 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30')}
                              >
                                <Trash2 className="size-4" />
                                Delete product
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
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 sm:flex-row">
          <p className="tabular-nums">
            Showing <span className="font-medium text-stone-900 dark:text-white">{(page - 1) * limit + 1}</span>
            {'–'}
            <span className="font-medium text-stone-900 dark:text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-stone-900 dark:text-white">{total}</span> products
          </p>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="sr-only">Products per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className={cn(selectFieldClass, 'h-8 text-xs')}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </label>
            <AdminButton size="sm" className="w-8 px-0" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </AdminButton>
            <span className="px-1 tabular-nums text-stone-700 dark:text-stone-300">
              Page {page} of {totalPages}
            </span>
            <AdminButton size="sm" className="w-8 px-0" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </AdminButton>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Delete this product?"
        message="It is removed from the store and archived. Past orders keep their history."
        confirmText="Delete product"
        variant="danger"
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import products"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Paste a JSON array or CSV (first row = field names, e.g. title,description,category,brand,price,stock,images). Separate multiple images or tags with &quot;|&quot;. Products without a status are imported as drafts.
          </p>
          <div>
            <label htmlFor="pt-import" className={labelClass}>JSON or CSV</label>
            <textarea
              id="pt-import"
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="[ { &quot;title&quot;: &quot;Sample Product&quot;, &quot;price&quot;: 49.99, &quot;category&quot;: &quot;Clothing&quot; } ]"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <AdminButton onClick={() => setIsImportModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={handleImportSubmit}>
              <Upload className="size-4" /> Import
            </AdminButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
