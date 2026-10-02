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
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);
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

  const fetchWishlist = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiClient.get('/wishlist');
      if (response.data?.success) {
        setItems(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setLoadError(true);
      toast.error('Failed to load wishlist items.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingProductId) return;
    setIsRemoving(true);
    try {
      const response = await apiClient.delete(`/wishlist/${removingProductId}`);
      if (response.data?.success) {
        setItems(response.data.data);
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
      const response = await apiClient.delete(`/wishlist/${product.id}`);
      if (response.data?.success) {
        setItems(response.data.data);
        toast.success(`Moved "${product.title}" to cart!`);
      }
    } catch (err: any) {
      toast.error('Failed to move item to cart.');
    }
  };

  const handleMoveAllToCart = async () => {
    if (items.length === 0) return;
    let moved = 0;
    let skipped = 0;
    // Sequential on purpose: parallel cart writes can overwrite each other on the server
    for (const p of items) {
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
              Products you have saved for later.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {items.length > 0 && (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((product) => {
              const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
              const outOfStock = (product.stock ?? 0) <= 0;

              return (
                <div
                  key={product.id}
                  className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] bg-white dark:bg-gray-900 overflow-hidden p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[420px] relative group"
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
