'use client';

import React, { useState, useEffect } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useToast } from '@/context/ToastContext';
import { useCartStore } from '@/stores/cartStore';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import { Heart, ShoppingCart, Trash2, Share2, Bell, Tag, ArrowRight, FolderPlus } from 'lucide-react';
import Image from 'next/image';

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const addItem = useCartStore((state) => state.addItem);

  // Collections & Filters
  const [activeCollection, setActiveCollection] = useState('all');
  const [priceDropAlerts, setPriceDropAlerts] = useState<Record<string, boolean>>({});
  const [backInStockAlerts, setBackInStockAlerts] = useState<Record<string, boolean>>({});

  // Remove confirmation modal states
  const [removingProductId, setRemovingProductId] = useState<string | number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/wishlist');
      if (response.data?.success) {
        setItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
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
    try {
      await Promise.all(items.map((p) => addItem(p, 1)));
      toast.success(`Moved all ${items.length} wishlist items to your bag!`);
    } catch (err) {
      toast.error('Failed to move all items to cart.');
    }
  };

  const handleShareWishlist = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/wishlist?share=user_saved_collection`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Shareable Wishlist link copied to clipboard!');
    }
  };

  const togglePriceDropAlert = (id: string | number) => {
    const sId = String(id);
    const updated = !priceDropAlerts[sId];
    setPriceDropAlerts({ ...priceDropAlerts, [sId]: updated });
    if (updated) {
      toast.success('Price Drop alert activated! We will email you when price drops.');
    } else {
      toast.info('Price Drop alert deactivated.');
    }
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
              Organize favorite items into collections, set price drop alerts, and share your wishlist.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleShareWishlist}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Wishlist
            </Button>
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

        {/* Wishlist Folders / Collections Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', name: 'All Favorites' },
            { id: 'summer', name: 'Summer Closet' },
            { id: 'work', name: 'Workplace Outfits' },
          ].map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeCollection === col.id
                  ? 'bg-[#8b6f47] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-3 h-3" /> {col.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
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
              const isAlertActive = priceDropAlerts[String(product.id)];

              return (
                <div
                  key={product.id}
                  className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] bg-white dark:bg-gray-900 overflow-hidden p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[420px] relative group"
                >
                  
                  {/* Thumbnail Image Container */}
                  <div className="relative w-full h-44 bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <span className="absolute bottom-3 left-3 bg-red-650 text-white font-bold px-2 py-0.5 rounded-lg text-[9px] shadow-sm">
                        -{product.discountPercentage}%
                      </span>
                    )}

                    {/* Price Drop Alert Trigger */}
                    <button
                      onClick={() => togglePriceDropAlert(product.id)}
                      className={`absolute top-3 left-3 p-2 rounded-full shadow-md transition-colors border ${
                        isAlertActive
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white/80 dark:bg-gray-900/80 text-gray-500 hover:text-amber-500 border-gray-200/50'
                      }`}
                      title="Price Drop Alert"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>

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
                    <h4 className="font-serif text-sm font-bold text-gray-950 dark:text-white truncate leading-tight">
                      {product.title}
                    </h4>
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
                      variant="outline"
                      className="flex-1 rounded-full text-[10px] font-bold py-2 flex items-center justify-center gap-1 border-gray-300"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleMoveToCart(product)}
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
