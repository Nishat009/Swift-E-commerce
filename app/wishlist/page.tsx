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

  useEffect(() => {
    fetchWishlist();
  }, []);

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
    `px-3.5 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${active
      ? 'bg-ink text-paper border-ink'
      : 'text-stone-600 dark:text-stone-300 border-line hover:border-ink'}`;
  const miniAlert = (on: boolean) =>
    `inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${on ? 'text-ink' : 'text-stone-400 dark:text-stone-500'} hover:text-ink`;

  return (
    <AccountLayout activeTabName="/wishlist">
      <div className="space-y-8">

        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">
              My Wishlist
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-xl">
              Products you have saved for later. Organise them into collections and choose which alerts you get.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {items.length > 0 && (
              <Button onClick={toggleSharing} size="sm" variant="outline">
                {share.enabled ? <><Link2Off className="w-3.5 h-3.5" /> Stop sharing</> : <><Share2 className="w-3.5 h-3.5" /> Share wishlist</>}
              </Button>
            )}
            {visibleItems.length > 0 && (
              <Button onClick={handleMoveAllToCart} size="sm">
                <ShoppingCart className="w-3.5 h-3.5" /> Move All to Cart
              </Button>
            )}
          </div>
        </div>

        {share.enabled && share.path && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm rounded-lg border border-line bg-surface-muted p-4">
            <span className="text-stone-600 dark:text-stone-300">Anyone with this link can view your wishlist:</span>
            <button onClick={copyShareLink} className="text-left text-xs text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink break-all cursor-pointer">
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
                    <button onClick={() => renameCollection(c)} title="Rename collection" aria-label="Rename collection" className="p-1 text-stone-500 hover:text-ink cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCollection(c)} title="Delete collection" aria-label="Delete collection" className="p-1 text-stone-500 hover:text-red-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </span>
            ))}
            {showNewCollection ? (
              <form onSubmit={createCollection} className="inline-flex items-center gap-2">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={60}
                  placeholder="Collection name"
                  className="h-8 px-3 text-xs rounded-md border border-line bg-transparent text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none"
                />
                <button type="submit" className="px-3.5 py-1.5 rounded-full text-xs bg-ink text-paper hover:bg-ink/85 cursor-pointer">Add</button>
                <button type="button" onClick={() => setShowNewCollection(false)} aria-label="Cancel" className="p-1 text-stone-500 hover:text-ink cursor-pointer"><X className="w-3.5 h-3.5" /></button>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
          </div>
        ) : loadError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">We could not load your wishlist right now.</p>
            <Button onClick={fetchWishlist} variant="outline">Try again</Button>
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
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-12">
            This collection is empty. Use the collection menu on any saved product to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {visibleItems.map((product) => {
              const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
              const outOfStock = (product.stock ?? 0) <= 0;
              const pref = alerts[String(product.id)] || { priceDrop: true, backInStock: true };

              return (
                <div key={product.id} className="flex flex-col min-w-0 group">

                  {/* Thumbnail */}
                  <div className="relative w-full aspect-[3/4] bg-surface-muted rounded-sm overflow-hidden">
                    <Link href={'/product/' + product.id}>
                      <img
                        src={product.thumbnail || product.image}
                        alt={product.title}
                        className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03] ${outOfStock ? 'opacity-60' : ''}`}
                      />
                    </Link>

                    {product.discountPercentage > 0 && (
                      <span className="absolute top-2 left-2 bg-paper text-ink px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums">
                        -{product.discountPercentage}%
                      </span>
                    )}

                    <button
                      onClick={() => setRemovingProductId(product.id)}
                      className="absolute top-2 right-2 bg-paper/90 text-stone-600 hover:text-red-600 p-2 rounded-full transition-colors cursor-pointer"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Text details */}
                  <div className="mt-3 flex-1 min-w-0">
                    {product.brand && (
                      <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 truncate">
                        {product.brand}
                      </span>
                    )}
                    <Link href={'/product/' + product.id}>
                      <h4 className="mt-1 font-sans text-sm text-ink truncate hover:underline underline-offset-4">
                        {product.title}
                      </h4>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1 tabular-nums">
                      <span className="text-sm font-medium text-ink">
                        ${discountedPrice.toFixed(0)}
                      </span>
                      {product.discountPercentage > 0 && (
                        <span className="text-xs text-stone-400 line-through">
                          ${product.price.toFixed(0)}
                        </span>
                      )}
                      {outOfStock && <span className="text-xs text-red-700 dark:text-red-400">Out of stock</span>}
                    </div>

                    {/* Alert toggles + collection picker */}
                    <div className="flex items-center gap-x-3 gap-y-1.5 pt-3 flex-wrap">
                      <button
                        onClick={() => toggleAlert(product, 'priceDrop')}
                        title={pref.priceDrop ? 'Price-drop alert on' : 'Price-drop alert off'}
                        aria-pressed={pref.priceDrop}
                        className={miniAlert(pref.priceDrop)}
                      >
                        {pref.priceDrop ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />} Price drop
                      </button>
                      <button
                        onClick={() => toggleAlert(product, 'backInStock')}
                        title={pref.backInStock ? 'Back-in-stock alert on' : 'Back-in-stock alert off'}
                        aria-pressed={pref.backInStock}
                        className={miniAlert(pref.backInStock)}
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
                          className="h-7 px-2 rounded-md text-[11px] border border-line bg-transparent text-stone-600 dark:text-stone-300 max-w-full focus:border-ink focus:outline-none"
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
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      onClick={() => handleMoveToCart(product)}
                      disabled={outOfStock}
                      size="sm"
                      className="w-full"
                    >
                      Move to Cart
                    </Button>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={outOfStock}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Add to Cart
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
