'use client';

import React, { useState, useEffect } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useToast } from '@/context/ToastContext';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import { Heart, ShoppingCart, Trash2, Bell, BellOff, PackageCheck, Share2, Link2Off, FolderPlus, Pencil, X } from 'lucide-react';
import Link from 'next/link';

type Collection = { id: string; name: string; productIds: string[] };
type AlertPrefs = Record<string, { priceDrop: boolean; backInStock: boolean }>;
type WishlistDetails = {
  products: Product[];
  collections: Collection[];
  alerts: AlertPrefs;
  share: { enabled: boolean; path: string | null };
};

const ALL = 'all';

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [alerts, setAlerts] = useState<AlertPrefs>({});
  const [share, setShare] = useState<WishlistDetails['share']>({ enabled: false, path: null });
  const [activeCollection, setActiveCollection] = useState<string>(ALL);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const addItem = useCartStore((state) => state.addItem);

  const [loadError, setLoadError] = useState(false);

  // Remove confirmation modal states
  const [removingProductId, setRemovingProductId] = useState<string | number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Keep the shared wishlist store (hearts on product cards) in sync with this page
  useEffect(() => {
    if (!loading && !loadError) {
      useWishlistStore.setState({ ids: items.map((p) => String(p.id)) });
    }
  }, [items, loading, loadError]);

  const applyDetails = (details: WishlistDetails) => {
    setItems(Array.isArray(details.products) ? details.products : []);
    setCollections(details.collections || []);
    setAlerts(details.alerts || {});
    setShare(details.share || { enabled: false, path: null });
    if (activeCollection !== ALL && !(details.collections || []).some((c) => c.id === activeCollection)) {
      setActiveCollection(ALL);
    }
  };

  const fetchWishlist = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiClient.get('/wishlist/details');
      if (response.data?.success) applyDetails(response.data.data);
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setLoadError(true);
      toast.error('Failed to load wishlist items.');
    } finally {
      setLoading(false);
    }
  };

  // Mutations that return the full wishlist details
  const updateDetails = async (request: Promise<any>, successMessage?: string) => {
    try {
      const response = await request;
      if (response.data?.success) {
        applyDetails(response.data.data);
        if (successMessage) toast.success(successMessage);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingProductId) return;
    setIsRemoving(true);
    try {
      const response = await apiClient.delete(`/wishlist/${removingProductId}`);
      if (response.data?.success) {
        await fetchWishlist();
        toast.success('Product removed from wishlist.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove item from wishlist.');
    } finally {
      setIsRemoving(false);
      setRemovingProductId(null);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
      toast.success(`Added "${product.title}" to your cart.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add product to cart.');
    }
  };

  const handleMoveToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
      await apiClient.delete(`/wishlist/${product.id}`);
      await fetchWishlist();
      toast.success(`Moved "${product.title}" to cart!`);
    } catch (err: any) {
      toast.error('Failed to move item to cart.');
    }
  };

  const visibleItems = activeCollection === ALL
    ? items
    : items.filter((p) => collections.find((c) => c.id === activeCollection)?.productIds.includes(String(p.id)));

  const handleMoveAllToCart = async () => {
    if (visibleItems.length === 0) return;
    let moved = 0;
    let skipped = 0;
    // Sequential on purpose: one cart write at a time
    for (const p of visibleItems) {
      if ((p.stock ?? 0) <= 0) {
        skipped++;
        continue;
      }
      try {
        await addItem(p, 1);
        await apiClient.delete('/wishlist/' + p.id);
        moved++;
      } catch (err) {
        skipped++;
      }
    }
    await fetchWishlist();
    if (moved > 0) toast.success(`Moved ${moved} item${moved > 1 ? 's' : ''} to your cart.`);
    if (skipped > 0) toast.error(`${skipped} item${skipped > 1 ? 's' : ''} could not be moved (out of stock or unavailable).`);
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    await updateDetails(apiClient.post('/wishlist/collections', { name: newCollectionName.trim() }), 'Collection created.');
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  const renameCollection = async (collection: Collection) => {
    const name = window.prompt('Rename collection', collection.name);
    if (!name || name.trim() === collection.name) return;
    await updateDetails(apiClient.put(`/wishlist/collections/${collection.id}`, { name: name.trim() }), 'Collection renamed.');
  };

  const deleteCollection = async (collection: Collection) => {
    if (!window.confirm(`Delete the "${collection.name}" collection? The products stay in your wishlist.`)) return;
    await updateDetails(apiClient.delete(`/wishlist/collections/${collection.id}`), 'Collection deleted.');
  };

  const setProductCollection = async (product: Product, collectionId: string, add: boolean) => {
    await updateDetails(
      apiClient.put(`/wishlist/collections/${collectionId}/products`, { productId: String(product.id), action: add ? 'add' : 'remove' }),
    );
  };

  const toggleAlert = async (product: Product, kind: 'priceDrop' | 'backInStock') => {
    const current = alerts[String(product.id)]?.[kind] ?? true;
    await updateDetails(
      apiClient.put(`/wishlist/alerts/${product.id}`, { [kind]: !current }),
      `${kind === 'priceDrop' ? 'Price-drop' : 'Back-in-stock'} alert ${current ? 'turned off' : 'turned on'}.`,
    );
  };

  const toggleSharing = async () => {
    try {
      const response = await apiClient.post('/wishlist/share', { enabled: !share.enabled });
      const next = response.data.data as WishlistDetails['share'];
      setShare(next);
      if (next.enabled && next.path) {
        const url = `${window.location.origin}${next.path}`;
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success('Share link copied to your clipboard.');
      } else {
        toast.success('Sharing turned off. The old link no longer works.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update sharing.');
    }
  };

  const copyShareLink = async () => {
    if (!share.path) return;
    await navigator.clipboard?.writeText(`${window.location.origin}${share.path}`).catch(() => {});
    toast.success('Share link copied.');
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${active
      ? 'bg-[#8b6f47] text-white border-[#8b6f47]'
      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#8b6f47]'}`;

  return (
    <AccountLayout activeTabName="/wishlist">
      <div className="space-y-6">

        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
              My Wishlist Collections
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Products you have saved for later. Organise them into collections and choose which alerts you get.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {items.length > 0 && (
              <Button
                onClick={toggleSharing}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {share.enabled ? <><Link2Off className="w-3.5 h-3.5" /> Stop sharing</> : <><Share2 className="w-3.5 h-3.5" /> Share wishlist</>}
              </Button>
            )}
            {visibleItems.length > 0 && (
              <Button
                onClick={handleMoveAllToCart}
                size="sm"
                className="rounded-xl text-xs font-bold bg-[#8b6f47] hover:bg-[#725a38] text-white flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Move All to Cart
              </Button>
            )}
          </div>
        </div>

        {share.enabled && share.path && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-3">
            <span className="font-bold text-gray-800 dark:text-gray-200">Anyone with this link can view your wishlist:</span>
            <button onClick={copyShareLink} className="text-left font-mono text-[11px] text-[#8b6f47] dark:text-[#c9a96b] underline break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}${share.path}` : share.path}
            </button>
          </div>
        )}

        {/* Collection tabs */}
        {!loading && !loadError && items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveCollection(ALL)} className={tabClass(activeCollection === ALL)}>
              All saved ({items.length})
            </button>
            {collections.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1">
                <button onClick={() => setActiveCollection(c.id)} className={tabClass(activeCollection === c.id)}>
                  {c.name} ({c.productIds.length})
                </button>
                {activeCollection === c.id && (
                  <>
                    <button onClick={() => renameCollection(c)} title="Rename collection" className="p-1 text-gray-500 hover:text-[#8b6f47]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCollection(c)} title="Delete collection" className="p-1 text-gray-500 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </span>
            ))}
            {showNewCollection ? (
              <form onSubmit={createCollection} className="inline-flex items-center gap-1">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={60}
                  placeholder="Collection name"
                  className="px-3 py-1.5 text-[11px] rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                />
                <button type="submit" className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#8b6f47] text-white">Add</button>
                <button type="button" onClick={() => setShowNewCollection(false)} className="p-1 text-gray-500"><X className="w-3.5 h-3.5" /></button>
              </form>
            ) : (
              <button onClick={() => setShowNewCollection(true)} className={`${tabClass(false)} inline-flex items-center gap-1`}>
                <FolderPlus className="w-3.5 h-3.5" /> New collection
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
          </div>
        ) : loadError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-text-muted">We could not load your wishlist right now.</p>
            <Button onClick={fetchWishlist} variant="outline" className="rounded-full text-xs font-bold px-6">Try again</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Wishlist is empty"
            description="You have not saved any products to your wishlist yet. Browse our collections to add items!"
            actionText="Browse Shop"
            actionLink="/products"
          />
        ) : visibleItems.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            This collection is empty. Use the collection menu on any saved product to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((product) => {
              const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
              const outOfStock = (product.stock ?? 0) <= 0;
              const pref = alerts[String(product.id)] || { priceDrop: true, backInStock: true };

              return (
                <div
                  key={product.id}
                  className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] bg-white dark:bg-gray-900 overflow-hidden p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[460px] relative group"
                >

                  {/* Thumbnail Image Container */}
                  <div className="relative w-full h-44 bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border">
                    <Link href={'/product/' + product.id}>
                      <img
                        src={product.thumbnail || product.image}
                        alt={product.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <span className="absolute bottom-3 left-3 bg-red-650 text-white font-bold px-2 py-0.5 rounded-lg text-[9px] shadow-sm">
                        -{product.discountPercentage}%
                      </span>
                    )}

                    {/* Delete action button */}
                    <button
                      onClick={() => setRemovingProductId(product.id)}
                      className="absolute top-3 right-3 bg-white/80 dark:bg-gray-900/80 hover:bg-red-500 hover:text-white backdrop-blur-md text-gray-500 p-2 rounded-full shadow-md transition-colors border border-gray-200/50 dark:border-gray-800"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Text details */}
                  <div className="mt-4 flex-1 space-y-1.5 min-w-0">
                    <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                      {product.brand}
                    </span>
                    <Link href={'/product/' + product.id}>
                      <h4 className="font-serif text-sm font-bold text-gray-950 dark:text-white truncate leading-tight hover:underline">
                        {product.title}
                      </h4>
                    </Link>
                    {outOfStock && <span className="text-[10px] font-bold text-red-600">Out of stock</span>}
                    <p className="text-[10px] text-text-muted line-clamp-1 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-black text-[#8b6f47] dark:text-[#c9a96b]">
                        ${discountedPrice.toFixed(0)}
                      </span>
                      {product.discountPercentage > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ${product.price.toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Alert toggles + collection picker */}
                    <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                      <button
                        onClick={() => toggleAlert(product, 'priceDrop')}
                        title={pref.priceDrop ? 'Price-drop alert on' : 'Price-drop alert off'}
                        aria-pressed={pref.priceDrop}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border ${pref.priceDrop ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 text-gray-400 dark:border-gray-700'}`}
                      >
                        {pref.priceDrop ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />} Price drop
                      </button>
                      <button
                        onClick={() => toggleAlert(product, 'backInStock')}
                        title={pref.backInStock ? 'Back-in-stock alert on' : 'Back-in-stock alert off'}
                        aria-pressed={pref.backInStock}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border ${pref.backInStock ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 text-gray-400 dark:border-gray-700'}`}
                      >
                        <PackageCheck className="w-3 h-3" /> Restock
                      </button>
                      {collections.length > 0 && (
                        <select
                          aria-label="Collections"
                          value=""
                          onChange={(e) => {
                            const [action, id] = e.target.value.split(':');
                            if (id) setProductCollection(product, id, action === 'add');
                          }}
                          className="px-2 py-1 rounded-full text-[9px] font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 max-w-[130px]"
                        >
                          <option value="">Collections…</option>
                          {collections.map((c) => {
                            const inIt = c.productIds.includes(String(product.id));
                            return (
                              <option key={c.id} value={`${inIt ? 'remove' : 'add'}:${c.id}`}>
                                {inIt ? `✓ ${c.name} (remove)` : `Add to ${c.name}`}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart / Move to Cart CTAs */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={outOfStock}
                      variant="outline"
                      className="flex-1 rounded-full text-[10px] font-bold py-2 flex items-center justify-center gap-1 border-gray-300"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleMoveToCart(product)}
                      disabled={outOfStock}
                      className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white font-bold py-2 rounded-full text-[10px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      Move to Cart
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmationModal
        isOpen={removingProductId !== null}
        onClose={() => setRemovingProductId(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Saved Item"
        message="Are you sure you want to remove this product from your wishlist? You will have to re-add it from the product listings later."
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </AccountLayout>
  );
}
