'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useCompareStore } from '@/stores/compareStore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCurrencyStore } from '@/stores/currencyStore';
import { garmentKind } from '@/stores/fittingStore';
import Modal from './Modal';
import Button from './Button';
import HighlightText from './HighlightText';
import { ShoppingBag, Heart, Star, Eye, Scale, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// Uploaded/local images are served by the API host; skip the Next optimizer for them
const isLocalImage = (src?: string) => !!src && /^(https?:\/\/(localhost|127\.0\.0\.1)|\/uploads)/.test(src);

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
  searchQuery?: string;
}

export default function ProductCard({ product, viewMode = 'grid', index = 0, searchQuery }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuth();
  const router = useRouter();
  const wishlistIds = useWishlistStore((state) => state.ids);
  const loadWishlist = useWishlistStore((state) => state.load);
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();

  const formatPrice = (amount: number) => {
    const converted = amount * currencyRate;
    return `${currencySymbol}${converted.toFixed(2)}`;
  };

  const discountedPrice = product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Compare Store
  const { toggleCompare, isInCompare } = useCompareStore();
  const isCompared = isInCompare(product.id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      toggleCompare(product);
      toast.info(`Removed "${product.title}" from comparison`);
    } else {
      const added = toggleCompare(product);
      if (added) {
        toast.info(`Added "${product.title}" to comparison`);
      } else {
        toast.error('Maximum 3 products can be compared at a time.');
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadWishlist(user.id);
      setIsWishlisted(wishlistIds.includes(String(product.id)));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product.id, wishlistIds, loadWishlist]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product);
      toast.success(`Added "${product.title}" to bag.`);
    } catch (err) {
      toast.error('Failed to add item to bag.');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please log in to save items to your wishlist.');
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await useWishlistStore.getState().remove(product.id);
        toast.success('Removed from wishlist.');
      } else {
        await useWishlistStore.getState().add(product.id);
        toast.success('Saved to wishlist.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update wishlist.');
      useWishlistStore.getState().load(user.id, true);
    } finally {
      setWishlistLoading(false);
    }
  };

  const realReviewCount = Number(product.reviewCount ?? (product as any).totalReviews ?? 0) || 0;
  const hasReviews = realReviewCount > 0 && (product.rating || 0) > 0;
  const mainImage = product.thumbnail || (product.images && product.images[0]) || '';
  const displayImage = product.modelWearingImage || product.productImage || product.thumbnail || (product.images && product.images[0]) || '';
  // Second shot shown on hover, when the product has one
  const hoverImage = [product.productImage, ...(product.images || []), product.thumbnail].find((src) => src && src !== displayImage) || '';
  const soldOut = product.stock === 0;
  const canTryOn = Boolean(garmentKind(product));

  // Extract color swatches from variants or specifications
  const colorVariant = product.variants?.find(v => v.name.toLowerCase().includes('color'));
  const colorOptions = colorVariant?.options || [];
  const primaryColorHex = product.specifications?.Color?.startsWith('#') ? product.specifications.Color : null;
  const materialTag = product.specifications?.Material?.split(',')[0] || product.specifications?.Fabric?.split(',')[0] || `${product.category} collection`;

  // At most two quiet badges: the discount (or New / Bestseller) and a stock note
  const badges = product.badges || [];
  const leadBadge = product.discountPercentage > 0
    ? `-${product.discountPercentage}%`
    : badges.includes('New') ? 'New' : badges.includes('Bestseller') ? 'Bestseller' : null;
  const stockBadge = soldOut ? 'Sold out' : product.stock <= 5 ? 'Low stock' : null;

  const priceRow = (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`text-sm font-medium tabular-nums ${product.discountPercentage > 0 ? 'text-[#9b2c2c] dark:text-[#f0a3a3]' : 'text-ink'}`}>
        {formatPrice(discountedPrice)}
      </span>
      {product.discountPercentage > 0 && (
        <span className="text-xs tabular-nums text-stone-400 line-through">{formatPrice(product.price)}</span>
      )}
      {hasReviews && (
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-stone-500">
          <Star className="size-3 fill-current text-stone-800 dark:text-stone-200" />
          {product.rating.toFixed(1)}
        </span>
      )}
    </div>
  );

  // List View Mode
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
        className="group flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center"
      >
        <Link href={`/product/${product.id}`} className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-sm bg-stone-100 sm:w-40 dark:bg-stone-900">
          <Image
            src={mainImage}
            unoptimized={isLocalImage(mainImage)}
            alt={product.title}
            fill
            sizes="160px"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {leadBadge && (
            <span className="absolute left-2 top-2 bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink">{leadBadge}</span>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
            {product.brand || 'Swift Atelier'} <span className="mx-1 text-stone-300 dark:text-stone-700">/</span> {product.category}
          </p>
          <Link href={`/product/${product.id}`}>
            <h3 className="font-sans text-base font-medium text-ink hover:underline underline-offset-4 line-clamp-1">
              <HighlightText text={product.title} query={searchQuery} />
            </h3>
          </Link>
          <p className="text-sm leading-relaxed text-stone-500 line-clamp-2 dark:text-stone-400">
            <HighlightText text={product.description || ''} query={searchQuery} />
          </p>
          <div className="max-w-xs pt-1">{priceRow}</div>
        </div>

        <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
          <button
            onClick={handleAddToCart}
            disabled={soldOut}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-paper transition-opacity hover:opacity-85 disabled:opacity-40 sm:flex-none cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            {soldOut ? 'Sold out' : 'Add to bag'}
          </button>
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink cursor-pointer"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`size-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span className="sm:hidden lg:inline">{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid view: editorial card, image first and quiet type underneath
  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ delay: (index % 4) * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="group relative flex flex-col"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
          <Link href={`/product/${product.id}`} className="absolute inset-0 block" aria-label={product.title}>
            <Image
              src={displayImage}
              unoptimized={isLocalImage(displayImage)}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-top transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.03] ${hoverImage ? 'pointer-fine:group-hover:opacity-0' : ''}`}
              priority={index < 4}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                unoptimized={isLocalImage(hoverImage)}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="hidden object-cover object-top opacity-0 transition-opacity duration-700 ease-out pointer-fine:block group-hover:opacity-100"
              />
            )}
            {soldOut && <div className="absolute inset-0 bg-paper/40" />}
          </Link>

          {(leadBadge || stockBadge) && (
            <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
              {leadBadge && (
                <span className={`px-2 py-1 text-[10px] font-medium uppercase leading-none tracking-[0.12em] ${product.discountPercentage > 0 ? 'bg-[#9b2c2c] text-white' : 'bg-paper text-ink'}`}>
                  {leadBadge}
                </span>
              )}
              {stockBadge && (
                <span className="bg-paper/90 px-2 py-1 text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-stone-600 dark:text-stone-300">
                  {stockBadge}
                </span>
              )}
            </div>
          )}

          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="flex size-8 items-center justify-center rounded-full bg-paper/85 text-ink backdrop-blur-sm transition-colors hover:bg-paper cursor-pointer"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              title={isWishlisted ? 'Saved' : 'Save'}
            >
              <Heart className={`size-[15px] ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleCompareToggle}
              className={`flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer ${
                isCompared
                  ? 'bg-ink text-paper'
                  : 'bg-paper/85 text-ink hover:bg-paper pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100'
              }`}
              aria-label={isCompared ? 'Remove from comparison' : 'Compare'}
              title={isCompared ? 'Remove from comparison' : 'Compare'}
            >
              <Scale className="size-[15px]" />
            </button>
          </div>

          {/* Desktop: actions slide up on hover */}
          <div className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-2 gap-1.5 opacity-0 transition-all duration-300 pointer-fine:flex group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="flex h-10 flex-1 items-center justify-center gap-2 bg-paper/95 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink backdrop-blur-sm transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {soldOut ? 'Sold out' : <><Plus className="size-3.5" /> Add to bag</>}
            </button>
            {canTryOn && (
              <Link
                href={`/dressing-room?product=${product.id}`}
                className="flex size-10 items-center justify-center bg-paper/95 text-ink backdrop-blur-sm transition-colors hover:bg-ink hover:text-paper"
                aria-label="Try on in the 3D dressing room"
                title="Try on in 3D"
              >
                <Sparkles className="size-4" />
              </Link>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="flex size-10 items-center justify-center bg-paper/95 text-ink backdrop-blur-sm transition-colors hover:bg-ink hover:text-paper cursor-pointer"
              aria-label="Quick view"
              title="Quick view"
            >
              <Eye className="size-4" />
            </button>
          </div>

          {/* Touch: one quick-add button */}
          {!soldOut && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur-sm pointer-fine:hidden cursor-pointer"
              aria-label="Add to bag"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>

        <div className="space-y-1 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
              {product.brand || 'Swift Atelier'}
            </p>
            {colorOptions.length > 0 ? (
              <div className="flex shrink-0 items-center gap-1">
                {colorOptions.slice(0, 4).map((opt) => (
                  <span
                    key={opt.id}
                    title={opt.value}
                    className="size-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                    style={{ backgroundColor: opt.colorHex || '#d4cbbe' }}
                  />
                ))}
                {colorOptions.length > 4 && <span className="text-[10px] text-stone-400">+{colorOptions.length - 4}</span>}
              </div>
            ) : primaryColorHex ? (
              <span className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20" style={{ backgroundColor: primaryColorHex }} />
            ) : null}
          </div>
          <h3 className="font-sans text-sm font-normal leading-snug text-ink line-clamp-1">
            <Link href={`/product/${product.id}`} className="hover:underline underline-offset-4">
              <HighlightText text={product.title} query={searchQuery} />
            </Link>
          </h3>
          {priceRow}
        </div>
      </motion.article>

      {/* Quick View Modal (Only mounted on demand) */}
      {isQuickViewOpen && (
        <Modal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          size="2xl"
        >
          <div className="grid grid-cols-1 items-start gap-8 p-1 text-left sm:p-4 md:grid-cols-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
              <Image
                src={displayImage || mainImage}
                unoptimized={isLocalImage(displayImage || mainImage)}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover object-top"
              />
              {leadBadge && (
                <span className={`absolute left-3 top-3 px-2 py-1 text-[10px] font-medium uppercase leading-none tracking-[0.12em] ${product.discountPercentage > 0 ? 'bg-[#9b2c2c] text-white' : 'bg-paper text-ink'}`}>
                  {leadBadge}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 md:py-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                  {product.brand || 'Swift Atelier'} <span className="mx-1 text-stone-300 dark:text-stone-700">/</span> {product.category}
                </p>
                <h3 className="font-serif text-2xl font-medium leading-tight text-ink sm:text-3xl">{product.title}</h3>
                <p className="text-sm text-stone-500">{materialTag}</p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className={`text-xl font-medium tabular-nums ${product.discountPercentage > 0 ? 'text-[#9b2c2c] dark:text-[#f0a3a3]' : 'text-ink'}`}>
                  {formatPrice(discountedPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-sm tabular-nums text-stone-400 line-through">{formatPrice(product.price)}</span>
                    <span className="text-xs font-medium text-[#9b2c2c] dark:text-[#f0a3a3]">Save {product.discountPercentage}%</span>
                  </>
                )}
              </div>

              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-5">{product.description}</p>

              {colorOptions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-stone-700 dark:text-stone-300">Colours</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {colorOptions.map((opt) => (
                      <span key={opt.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-stone-700 dark:text-stone-300">
                        <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: opt.colorHex || '#d4cbbe' }} />
                        {opt.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                {hasReviews && (
                  <>
                    <span className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300">
                      <Star className="size-3.5 fill-current" /> {product.rating.toFixed(1)}
                    </span>
                    <span className="text-stone-400">({realReviewCount} review{realReviewCount === 1 ? '' : 's'})</span>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                  </>
                )}
                <span className={product.stock > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}>
                  {product.stock > 0 ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In stock') : 'Sold out'}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                <Button onClick={handleAddToCart} disabled={soldOut} size="lg" className="flex-1">
                  <ShoppingBag className="size-4" />
                  Add to bag
                </Button>
                <Link href={`/product/${product.id}`} onClick={() => setIsQuickViewOpen(false)} className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    Full details <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
