'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderQuote } from '@/hooks/useOrderQuote';
import { getEffectivePrice } from '@/utils/productUtils';
import type { CartItem } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();
  const formatPrice = (amount: number) => {
    const converted = amount * currencyRate;
    return `${currencySymbol}${converted.toFixed(2)}`;
  };
  
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  // Saved for later: stored on the account when signed in (see cartStore)
  const savedItems = useCartStore((state) => state.savedItems);

  // Coupon/Promo states
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number; isFixed: boolean } | null>(null);
  const { quote, error: quoteError } = useOrderQuote(items, activeCoupon?.code);
  

  // Remove confirmation modal states
  const [removingItemId, setRemovingItemId] = useState<string | number | null>(null);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

  // Items older versions kept only in this browser move into the saved list once
  useEffect(() => {
    useCartStore.getState().adoptLegacySaved();
  }, []);

  const saveForLater = async (item: CartItem) => {
    try {
      await useCartStore.getState().saveForLater(item.product.id, item.selectedVariant?.id);
      toast.success(`"${item.product.title}" saved for later.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save the item for later.');
    }
  };

  const moveToCart = async (item: CartItem) => {
    try {
      await useCartStore.getState().moveSavedToCart(item.product.id, item.selectedVariant?.id);
      toast.success(`"${item.product.title}" moved to cart.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not move the item to your cart.');
    }
  };

  const removeSavedItem = async (item: CartItem) => {
    try {
      await useCartStore.getState().removeSaved(item.product.id, item.selectedVariant?.id);
      toast.success('Item removed from saved list.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not remove the saved item.');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await apiClient.get(`/coupons/${code}`);
      if (res.data?.success && res.data.data) {
        const coupon = res.data.data;
        const discountVal = coupon.percentage ? coupon.percentage / 100 : (coupon.amount || 0);
        setActiveCoupon({ code: coupon.code, discount: discountVal, isFixed: Boolean(coupon.amount) && !coupon.percentage });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('applied_coupon', coupon.code);
        }
        toast.success(`Coupon "${coupon.code}" applied!`);
        setCouponCode('');
      } else {
        toast.error('Invalid coupon code.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon code.');
    }
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

  // Calculations & Auto-Applied Promotions Rules Engine
  const subtotal = quote?.subtotal ?? getTotalPrice();
  
  // Same pricing rules the server applies when the order is placed
  const couponDiscount = activeCoupon
    ? Math.min(subtotal, activeCoupon.isFixed ? activeCoupon.discount : subtotal * activeCoupon.discount)
    : 0;
  const discountAmount = quote?.discount ?? couponDiscount;
  // $30 off orders of $300+ (same rule as the server)
  const promoDiscount = quote?.promoDiscount ?? (subtotal >= 300 ? Math.min(30, Math.max(0, subtotal - discountAmount)) : 0);

  const taxedSubtotal = Math.max(0, subtotal - discountAmount - promoDiscount);
  const tax = quote?.tax ?? taxedSubtotal * 0.1; // Guest estimate; signed-in quote comes from API.

  // Free shipping on orders of $100+, otherwise flat $10
  const shippingFee = quote?.shipping ?? (subtotal >= 100 ? 0 : 10);

  const total = quote?.total ?? taxedSubtotal + tax + shippingFee;


  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-24 text-center sm:px-6 lg:px-10">
        <ShoppingBag className="mx-auto mb-6 size-9 text-stone-300 dark:text-stone-600" strokeWidth={1.25} />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Your bag is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          Pieces you add will appear here.
        </p>
        <Link href="/products" className="mt-8 inline-block">
          <Button variant="outline" size="lg">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const quantityButton = 'flex size-9 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30';
  const textLink = 'cursor-pointer text-xs text-stone-500 underline underline-offset-4 transition-colors hover:text-ink';

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <div className="mb-10 border-b border-line pb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Shopping bag</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">Your bag</h1>
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          Review, modify, or save items in your bag. Free shipping on orders of $100 or more.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
        {/* Cart items */}
        <div className="space-y-12 lg:col-span-2">
          {items.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Your active shopping bag is empty. Scroll down to see saved items.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const discountedPrice = getEffectivePrice(item.product);
                  const itemTotal = discountedPrice * item.quantity;
                  const variantLabel = item.selectedVariant ? Object.values(item.selectedVariant.attributes || {}).join(' / ') : '';

                  return (
                    <motion.li
                      key={`${item.product.id}-${item.selectedVariant?.id || ''}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-4 overflow-hidden py-6 sm:gap-6"
                    >
                      <Link
                        href={`/product/${item.product.id}`}
                        className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-sm bg-surface-muted sm:w-28"
                      >
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          className="h-full w-full object-cover object-top"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{item.product.brand}</p>
                            <Link href={`/product/${item.product.id}`}>
                              <h3 className="mt-0.5 text-sm text-ink underline-offset-4 hover:underline sm:text-base">
                                {item.product.title}
                              </h3>
                            </Link>
                            {variantLabel && (
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{variantLabel}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-ink sm:text-base">{formatPrice(itemTotal)}</span>
                        </div>

                        {item.quantity > 1 && (
                          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{formatPrice(discountedPrice)} each</p>
                        )}

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-4">
                          <div className="inline-flex items-center rounded-full border border-line" role="group" aria-label={`Quantity of ${item.product.title}`}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                              className={quantityButton}
                              aria-label={item.quantity <= 1 ? `Remove ${item.product.title} from cart` : `Decrease quantity of ${item.product.title}`}
                            >
                              <Minus className="size-3" aria-hidden="true" />
                            </button>
                            <span className="min-w-8 text-center text-sm tabular-nums text-ink" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                              className={quantityButton}
                              disabled={item.quantity >= item.product.stock}
                              aria-label={`Increase quantity of ${item.product.title}`}
                            >
                              <Plus className="size-3" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <button type="button" onClick={() => saveForLater(item)} className={textLink}>
                              Save for later
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemovingItemId(item.product.id)}
                              className={textLink}
                              aria-label={`Remove ${item.product.title} from cart`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          {/* Saved for later */}
          {savedItems.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">
                Saved for later <span className="text-stone-400">({savedItems.length})</span>
              </h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {savedItems.map((item) => {
                  const unitPrice = getEffectivePrice(item.product);
                  const discounted = (item.product.discountPercentage || 0) > 0;
                  return (
                    <li key={`${item.product.id}-${item.selectedVariant?.id || ''}`} className="flex gap-4 py-5">
                      <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                        <img src={item.product.thumbnail} alt={item.product.title} className="h-full w-full object-cover object-top" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <h3 className="truncate text-sm text-ink">{item.product.title}</h3>
                          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                            <span className="font-medium tabular-nums text-ink">{formatPrice(unitPrice)}</span>
                            {discounted && <span className="ml-1.5 tabular-nums line-through">{formatPrice(item.product.price)}</span>}
                            {' '}· Qty {item.quantity}
                          </p>
                        </div>
                        <div className="mt-3 flex gap-4">
                          <button type="button" onClick={() => moveToCart(item)} className={textLink}>
                            Move to bag
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedItem(item)}
                            className={textLink}
                            aria-label={`Delete ${item.product.title} from saved items`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="space-y-6 rounded-lg border border-line p-6 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Summary</h2>

            <dl className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
              </div>

              {activeCoupon && discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt>Discount ({activeCoupon.code})</dt>
                  <dd className="tabular-nums text-ink">-{formatPrice(discountAmount)}</dd>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between">
                  <dt>Promotion ($300+)</dt>
                  <dd className="tabular-nums text-ink">-{formatPrice(promoDiscount)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt>Tax (10%)</dt>
                <dd className="tabular-nums text-ink">{formatPrice(tax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="tabular-nums text-ink">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-base font-medium text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>
            {quoteError && <p className="text-xs text-red-600 dark:text-red-400">{quoteError} The displayed amount is an estimate.</p>}

            <form onSubmit={handleApplyCoupon} className="space-y-2 border-t border-line pt-6">
              <label htmlFor="cart-coupon" className="block text-xs font-medium text-stone-600 dark:text-stone-300">Promo / coupon code</label>
              <div className="flex gap-2">
                <input
                  id="cart-coupon"
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-md border border-line bg-transparent px-3.5 text-sm uppercase text-ink placeholder:normal-case placeholder:text-stone-400 focus:border-ink focus:outline-none"
                />
                <Button type="submit" variant="outline" className="h-11">
                  Apply
                </Button>
              </div>
            </form>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-line pt-6">
                <Button onClick={() => router.push('/checkout')} size="lg" className="h-12 w-full">
                  Checkout
                </Button>
                <div className="flex items-center justify-between pt-1">
                  <Link href="/products" className={textLink}>
                    Continue shopping
                  </Link>
                  <button type="button" onClick={() => setIsClearCartConfirmOpen(true)} className={textLink}>
                    Clear bag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
