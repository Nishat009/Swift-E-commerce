'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Matches the API's pricing rules (backend/src/services/orderQuote.js); checkout shows the exact quote
const FREE_SHIPPING_MIN = 100;

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    const onKey = (e: KeyboardEvent) => isOpen && e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1;
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : 10;
  const total = subtotal + tax + shipping;
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-stone-950/40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <h2 className="font-sans text-sm font-medium text-ink">
                Shopping bag <span className="text-stone-400">({getTotalItems})</span>
              </h2>
              <button
                onClick={onClose}
                className="-mr-2 flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                aria-label="Close bag"
              >
                <X className="size-5" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="border-b border-line px-5 py-4">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {shipping === 0
                    ? 'Your order ships free.'
                    : `You're $${(FREE_SHIPPING_MIN - subtotal).toFixed(2)} away from free shipping.`}
                </p>
                <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag className="mb-5 size-8 text-stone-300 dark:text-stone-600" strokeWidth={1.25} />
                  <h3 className="font-serif text-2xl text-ink">Your bag is empty</h3>
                  <p className="mt-2 text-sm text-stone-500">
                    Pieces you add will appear here.
                  </p>
                  <Link href="/products" onClick={onClose} className="mt-6">
                    <Button variant="outline">Continue shopping</Button>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((item) => {
                    const discountedPrice =
                      item.product.price * (1 - item.product.discountPercentage / 100);
                    const itemTotal = discountedPrice * item.quantity;

                    return (
                      <motion.li
                        key={item.product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 py-5"
                      >
                        <Link
                          href={`/product/${item.product.id}`}
                          onClick={onClose}
                          className="relative h-28 w-[84px] shrink-0 overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900"
                        >
                          <Image
                            src={item.product.thumbnail}
                            alt={item.product.title}
                            fill
                            sizes="84px"
                            className="object-cover object-top"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{item.product.brand}</p>
                              <Link href={`/product/${item.product.id}`} onClick={onClose} className="block">
                                <h3 className="font-sans text-sm text-ink line-clamp-2 hover:underline underline-offset-4">
                                  {item.product.title}
                                </h3>
                              </Link>
                            </div>
                            <span className="shrink-0 text-sm tabular-nums text-ink">${itemTotal.toFixed(2)}</span>
                          </div>
                          {item.quantity > 1 && (
                            <p className="mt-1 text-xs text-stone-500">${discountedPrice.toFixed(2)} each</p>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="inline-flex items-center rounded-full border border-line">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="min-w-6 text-center text-sm tabular-nums text-ink">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-white/10 cursor-pointer"
                                disabled={item.quantity >= item.product.stock}
                                aria-label="Increase quantity"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-xs text-stone-500 underline underline-offset-4 transition-colors hover:text-ink cursor-pointer"
                              aria-label={`Remove ${item.product.title}`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer with Summary */}
            {items.length > 0 && (
              <div className="space-y-4 border-t border-line px-5 py-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">${subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <dt>Estimated tax</dt>
                    <dd className="tabular-nums">${tax.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <dt>Shipping</dt>
                    <dd className="tabular-nums">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-3 text-base font-medium text-ink">
                    <dt>Estimated total</dt>
                    <dd className="tabular-nums">${total.toFixed(2)}</dd>
                  </div>
                </dl>
                <div className="space-y-2">
                  <Button onClick={handleCheckout} size="lg" className="h-12 w-full">
                    Checkout
                  </Button>
                  <Link href="/cart" onClick={onClose} className="block text-center text-xs text-stone-600 underline underline-offset-4 hover:text-ink dark:text-stone-400">
                    View full bag
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
