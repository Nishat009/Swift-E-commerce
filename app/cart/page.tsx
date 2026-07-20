'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Minus, Plus, Trash2, ShoppingBag, Gift, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedItem {
  product: any;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  // Save for later states
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  
  // Coupon/Promo states
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number } | null>(null);
  
  // Shipping Estimator states
  const [shippingZip, setShippingZip] = useState('');
  const [estimatedShipping, setEstimatedShipping] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Remove confirmation modal states
  const [removingItemId, setRemovingItemId] = useState<string | number | null>(null);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

  // Load saved-for-later items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('save-for-later');
    if (stored) {
      setSavedItems(JSON.parse(stored));
    }
  }, []);

  const saveForLater = (product: any, quantity: number) => {
    const updated = [...savedItems, { product, quantity }];
    setSavedItems(updated);
    localStorage.setItem('save-for-later', JSON.stringify(updated));
    removeItem(product.id);
    toast.success(`"${product.title}" saved for later.`);
  };

  const moveToCart = async (product: any, quantity: number) => {
    await useCartStore.getState().addItem(product, quantity);
    const updated = savedItems.filter((item) => String(item.product.id) !== String(product.id));
    setSavedItems(updated);
    localStorage.setItem('save-for-later', JSON.stringify(updated));
    toast.success(`"${product.title}" moved to cart.`);
  };

  const removeSavedItem = (productId: string | number) => {
    const updated = savedItems.filter((item) => String(item.product.id) !== String(productId));
    setSavedItems(updated);
    localStorage.setItem('save-for-later', JSON.stringify(updated));
    toast.success('Item removed from saved list.');
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'SAVE20') {
      setActiveCoupon({ code: 'SAVE20', discount: 0.2 }); // 20% off
      toast.success('Coupon applied: 20% discount on products!');
      setCouponCode('');
    } else if (code === 'FREESHIP') {
      setActiveCoupon({ code: 'FREESHIP', discount: 0 }); // free shipping handled below
      toast.success('Coupon applied: Free Shipping!');
      setCouponCode('');
    } else {
      toast.error('Invalid coupon code. Try "SAVE20" or "FREESHIP".');
    }
  };

  const handleEstimateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingZip.trim()) return;
    setIsEstimating(true);
    setTimeout(() => {
      // Dummy shipping calculation logic
      const fee = Number(shippingZip) % 2 === 0 ? 5 : 12;
      setEstimatedShipping(fee);
      setIsEstimating(false);
      toast.success(`Shipping estimate calculated: $${fee.toFixed(2)}`);
    }, 1000);
  };

  const handleRemoveConfirm = () => {
    if (removingItemId) {
      removeItem(removingItemId);
      toast.success('Item removed from cart.');
      setRemovingItemId(null);
    }
  };

  const handleClearCartConfirm = async () => {
    await clearCart();
    toast.success('Cart cleared.');
    setIsClearCartConfirmOpen(false);
  };

  // Calculations
  const subtotal = getTotalPrice();
  const discountAmount = activeCoupon?.code === 'SAVE20' ? subtotal * activeCoupon.discount : 0;
  const taxedSubtotal = subtotal - discountAmount;
  const tax = taxedSubtotal * 0.1; // 10% tax
  
  let shippingFee = subtotal > 100 ? 0 : 10;
  if (activeCoupon?.code === 'FREESHIP') {
    shippingFee = 0;
  } else if (estimatedShipping !== null) {
    shippingFee = estimatedShipping;
  }
  
  const total = taxedSubtotal + tax + shippingFee;

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-gray-150/45 dark:border-gray-800 rounded-full inline-block mb-6">
          <ShoppingBag className="w-16 h-16 text-[#8b6f47] dark:text-[#c9a96b]" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-2 leading-tight">
          Your shopping cart is empty
        </h2>
        <p className="text-xs text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
          Looks like you haven&apos;t added anything to your cart yet. Explore our latest campaigns or clothing items.
        </p>
        <Link href="/products">
          <Button className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-8 shadow-md border-0 text-xs">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-8">
        <h1 className="text-3xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
          Shopping Cart
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Review, modify, or save items in your shopping bag. Free delivery on orders over $100.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.length === 0 ? (
            <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-dashed rounded-3xl text-center text-xs text-text-muted">
              Your active shopping bag is empty. Scroll down to see saved items.
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const discountedPrice = item.product.price * (1 - item.product.discountPercentage / 100);
                  const itemTotal = discountedPrice * item.quantity;

                  return (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] p-5 shadow-xs flex flex-col sm:flex-row gap-5 relative overflow-hidden"
                    >
                      {/* Product Thumbnail */}
                      <Link href={`/product/${item.product.id}`} className="relative w-full sm:w-28 h-28 flex-shrink-0 bg-gray-50 dark:bg-gray-950 border rounded-2xl overflow-hidden">
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          className="object-cover w-full h-full"
                        />
                      </Link>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between gap-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                              {item.product.brand}
                            </span>
                            <Link href={`/product/${item.product.id}`}>
                              <h3 className="text-sm font-bold text-gray-950 dark:text-white mt-1 hover:text-[#8b6f47] leading-tight">
                                {item.product.title}
                              </h3>
                            </Link>
                          </div>
                          
                          {/* Trash action */}
                          <button
                            onClick={() => setRemovingItemId(item.product.id)}
                            className="p-2 text-red-500 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 rounded-full transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Cost & Controls Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-50 dark:border-gray-850">
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3.5 text-xs text-gray-900 dark:text-white font-bold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500"
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price Display */}
                          <div className="flex items-center gap-4 text-right">
                            <div className="text-left sm:text-right">
                              <span className="block text-[8px] text-text-muted">Item Price</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">${discountedPrice.toFixed(0)}</span>
                            </div>
                            <div className="text-left sm:text-right border-l pl-4 border-gray-100 dark:border-gray-800">
                              <span className="block text-[8px] text-text-muted font-black uppercase">Subtotal</span>
                              <span className="text-sm font-black text-[#8b6f47] dark:text-[#c9a96b]">${itemTotal.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Save for Later trigger */}
                        <div className="pt-2">
                          <button
                            onClick={() => saveForLater(item.product, item.quantity)}
                            className="text-[10px] font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline"
                          >
                            Save for later
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Save For Later Section */}
          {savedItems.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Saved For Later ({savedItems.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="border border-gray-150/40 dark:border-gray-800 rounded-[28px] p-4 bg-white dark:bg-gray-900 flex gap-4 shadow-xs relative"
                  >
                    <div className="relative w-20 h-20 bg-gray-50 dark:bg-gray-950 border rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.product.thumbnail} alt={item.product.title} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.product.title}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">${item.product.price} • Qty: {item.quantity}</p>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => moveToCart(item.product, item.quantity)}
                          className="text-[10px] font-black text-[#8b6f47] dark:text-[#c9a96b] hover:underline"
                        >
                          Move to Bag
                        </button>
                        <button
                          onClick={() => removeSavedItem(item.product.id)}
                          className="text-[10px] font-black text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] p-6 shadow-xs space-y-6 sticky top-24">
            <h2 className="text-lg font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wider pb-2 border-b">
              Summary
            </h2>

            {/* Calculations Breakdown */}
            <div className="space-y-3.5 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              {activeCoupon && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({activeCoupon.code}):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-3.5 border-t border-gray-100 dark:border-gray-800 flex justify-between font-serif font-bold text-gray-905 dark:text-white text-base">
                <span>Grand Total:</span>
                <span className="text-[#8b6f47] dark:text-[#c9a96b]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted">Promo / Coupon Code</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter SAVE20 or FREESHIP"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#faf9f6] dark:bg-gray-950 border border-gray-250 dark:border-gray-850 px-3 py-1.5 rounded-xl text-xs uppercase"
                />
                <button
                  type="submit"
                  className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-xl font-bold px-4 text-[10px] border-0"
                >
                  Apply
                </button>
              </div>
            </form>

            {/* Shipping Estimator input */}
            <form onSubmit={handleEstimateShipping} className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted">Estimate Shipping Cost</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Zip Code"
                  value={shippingZip}
                  onChange={(e) => setShippingZip(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-[#faf9f6] dark:bg-gray-950 border border-gray-250 dark:border-gray-850 px-3 py-1.5 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  disabled={isEstimating}
                  className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-bold px-4 text-[10px] border-0"
                >
                  {isEstimating ? '...' : 'Estimate'}
                </button>
              </div>
            </form>

            {/* Sticky Actions */}
            {items.length > 0 && (
              <div className="space-y-3 pt-3 border-t">
                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold py-2.5 px-6 shadow-md text-xs"
                >
                  Proceed to Checkout
                </Button>
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full rounded-full text-xs font-bold py-2">
                    Continue Shopping
                  </Button>
                </Link>
                <button
                  onClick={() => setIsClearCartConfirmOpen(true)}
                  className="w-full text-center text-[10px] font-black text-red-500 hover:underline pt-2"
                >
                  Clear Shopping Bag
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Item Delete confirmation modal */}
      <ConfirmationModal
        isOpen={removingItemId !== null}
        onClose={() => setRemovingItemId(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Item from Cart"
        message="Are you sure you want to remove this item from your shopping cart? You can also save it for later to purchase on your next visit."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Clear Cart confirmation modal */}
      <ConfirmationModal
        isOpen={isClearCartConfirmOpen}
        onClose={() => setIsClearCartConfirmOpen(false)}
        onConfirm={handleClearCartConfirm}
        title="Empty Shopping Bag"
        message="Are you sure you want to completely empty your shopping cart? All current items in your bag will be removed."
        confirmText="Clear Cart"
        variant="danger"
      />
    </div>
  );
}
