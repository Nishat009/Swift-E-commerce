'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import { useCurrencyStore } from '@/stores/currencyStore';
import Button from '@/components/ui/Button';
import {
  ShoppingBag,
  Sparkles,
  Eye,
  Check,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Layers,
  Heart,
  ChevronRight,
  ShieldCheck,
  Tag,
  UserCheck
} from 'lucide-react';

export type DressRoomViewMode = 'product' | 'model';

interface DressRoomViewerProps {
  product: Product;
  onProductChange?: (product: Product) => void;
  className?: string;
  showDetails?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ViewSelector Subcomponent: [ Product ] [ Model ] Toggle
// ─────────────────────────────────────────────────────────────────────────────
export function ViewSelector({
  viewMode,
  onViewChange,
  hasModelImage,
}: {
  viewMode: DressRoomViewMode;
  onViewChange: (mode: DressRoomViewMode) => void;
  hasModelImage: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-stone-100/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs">
      <div className="flex items-center gap-1.5 w-full sm:w-auto">
        {/* Product Toggle Button */}
        <button
          type="button"
          onClick={() => onViewChange('product')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
            viewMode === 'product'
              ? 'bg-white dark:bg-zinc-800 text-[#8b6f47] dark:text-[#c9a96b] shadow-md scale-[1.02] border border-stone-200/60 dark:border-zinc-700'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/50'
          }`}
          aria-pressed={viewMode === 'product'}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Product View</span>
          {viewMode === 'product' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" />
          )}
        </button>

        {/* Model Toggle Button */}
        <button
          type="button"
          disabled={!hasModelImage}
          onClick={() => hasModelImage && onViewChange('model')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
            !hasModelImage
              ? 'opacity-40 bg-transparent text-zinc-400 cursor-not-allowed'
              : viewMode === 'model'
              ? 'bg-white dark:bg-zinc-800 text-[#8b6f47] dark:text-[#c9a96b] shadow-md scale-[1.02] border border-stone-200/60 dark:border-zinc-700 cursor-pointer'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/50 cursor-pointer'
          }`}
          aria-pressed={viewMode === 'model'}
          title={hasModelImage ? 'View model wearing this item' : 'Model preview is not available for this product'}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Model Preview</span>
          {hasModelImage && viewMode === 'model' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" />
          )}
        </button>
      </div>

      {/* Mode Status Pill */}
      <div className="flex items-center gap-2 text-[11px] px-3 py-1 rounded-full font-medium">
        {hasModelImage ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {viewMode === 'model' ? 'Displaying Model Look' : 'Model View Available'}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] italic">
            Model preview not available
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ProductView Subcomponent: Standard Product Flat-lay / Gallery
// ─────────────────────────────────────────────────────────────────────────────
export function ProductView({
  product,
  isZoomed,
  setIsZoomed,
  zoomPosition,
  setZoomPosition
}: {
  product: Product;
  isZoomed: boolean;
  setIsZoomed: (z: boolean) => void;
  zoomPosition: { x: number; y: number };
  setZoomPosition: (pos: { x: number; y: number }) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const productImageUrl =
    product.productImage ||
    product.thumbnail ||
    (product.images && product.images[0]) ||
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-stone-50 via-white to-stone-100/60 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border border-stone-200/70 dark:border-zinc-800 group shadow-inner">
      {/* Background Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,111,71,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Image Container with Lens Zoom */}
      <div
        className="relative w-full h-full max-w-[460px] max-h-[580px] cursor-zoom-in flex items-center justify-center p-6"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8b6f47] dark:text-[#c9a96b]" />
            <span className="text-[11px] text-zinc-400 font-medium">Loading garment render...</span>
          </div>
        )}

        {imageError ? (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-semibold">Image render unavailable</p>
          </div>
        ) : (
          <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden">
            <Image
              src={productImageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`object-contain transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={
                isZoomed
                  ? {
                      transform: 'scale(2.2)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : { transform: 'scale(1)' }
              }
            />
          </div>
        )}
      </div>

      {/* Badges Overlay (Top Left & Top Right) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-[#8b6f47] dark:text-[#c9a96b] border border-stone-200 dark:border-zinc-700 shadow-sm">
          Standard Product View
        </span>
        {product.brand && (
          <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase px-1">
            {product.brand}
          </span>
        )}
      </div>

      {/* Zoom Helper Pill */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 dark:border-zinc-800 text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3 h-3 text-[#8b6f47]" />
        <span>Hover to Inspect Weave</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ModelView Subcomponent: Dedicated Model-Wearing Image Display
// ─────────────────────────────────────────────────────────────────────────────
export function ModelView({
  product,
  isZoomed,
  setIsZoomed,
  zoomPosition,
  setZoomPosition
}: {
  product: Product;
  isZoomed: boolean;
  setIsZoomed: (z: boolean) => void;
  zoomPosition: { x: number; y: number };
  setZoomPosition: (pos: { x: number; y: number }) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const modelImageUrl = product.modelWearingImage;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (!modelImageUrl) {
    return (
      <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center p-8 rounded-3xl bg-stone-50 dark:bg-zinc-950 border border-dashed border-stone-200 dark:border-zinc-800 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Info className="w-7 h-7" />
        </div>
        <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Model Preview Unavailable
        </h4>
        <p className="text-xs text-zinc-500 max-w-sm">
          A dedicated model-wearing photograph has not been uploaded for &quot;{product.title}&quot; yet. Switch back to Product View to inspect the standard product images.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] flex items-center justify-center overflow-hidden rounded-3xl bg-zinc-950 text-white border border-stone-200/50 dark:border-zinc-800 group shadow-2xl">
      {/* Main Image Container */}
      <div
        className="relative w-full h-full min-h-[400px] sm:min-h-[500px] cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-zinc-950">
            <RefreshCw className="w-6 h-6 animate-spin text-[#c9a96b]" />
            <span className="text-[11px] text-zinc-400 font-medium">Loading editorial model look...</span>
          </div>
        )}

        {imageError ? (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-semibold">Model render unavailable</p>
          </div>
        ) : (
          <Image
            src={modelImageUrl}
            alt={`Model wearing ${product.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`object-cover object-top transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
            }`}
            style={
              isZoomed
                ? {
                    transform: 'scale(2.2)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : {}
            }
          />
        )}

        {/* Subtle Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Badges Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
        <span className="px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/70 backdrop-blur-md text-[#c9a96b] border border-[#c9a96b]/30 shadow-lg flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#c9a96b]" />
          Model Wearing Look
        </span>
        <span className="text-[10px] text-zinc-300 font-medium backdrop-blur-xs px-2 py-0.5 rounded bg-black/40 w-max">
          Styled with {product.title}
        </span>
      </div>

      {/* Model Spec Pill Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a96b]">
            Editorial Drape & Fit
          </p>
          <p className="text-xs font-semibold line-clamp-1">
            Real Model Fit Preview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-gray-200 font-medium">
            Category: {product.category}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ProductData Subcomponent: Pricing, Specifications & Add to Cart
// ─────────────────────────────────────────────────────────────────────────────
export function ProductData({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();

  const [selectedSize, setSelectedSize] = useState<string>('M');

  const displayPrice = (product.price * (1 - (product.discountPercentage || 0) / 100)) * currencyRate;
  const originalDisplayPrice = (product.originalPrice || product.price) * currencyRate;

  const handleAddToCart = () => {
    addItem(product, 1);
    toast.success(`Added "${product.title}" to cart!`);
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-6 p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-sm">
      <div className="space-y-4">
        
        {/* Brand & Category Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
            {product.brand || 'Swift Signature'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize">
            {product.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
          {product.title}
        </h2>

        {/* Price Row */}
        <div className="flex items-baseline gap-3 pt-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">
            {currencySymbol}{displayPrice.toFixed(2)}
          </span>
          {product.discountPercentage > 0 && (
            <>
              <span className="text-sm text-zinc-400 line-through">
                {currencySymbol}{originalDisplayPrice.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                {product.discountPercentage}% OFF
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
          {product.description}
        </p>

        {/* Specifications & Fit Attributes */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
              <div
                key={key}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800 text-left"
              >
                <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                  {key}
                </span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Available Sizes Picker */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Select Size
          </label>
          <div className="flex items-center gap-2">
            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSize === size
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md scale-105'
                    : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-stone-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-4 border-t border-stone-150 dark:border-zinc-800">
        <Button
          onClick={handleAddToCart}
          className="w-full py-4 rounded-full bg-[#8b6f47] hover:bg-[#6b5435] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-0"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Cart • {currencySymbol}{displayPrice.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Main Modular DressRoomViewer Container
// ─────────────────────────────────────────────────────────────────────────────
export default function DressRoomViewer({
  product,
  onProductChange,
  className = '',
  showDetails = true
}: DressRoomViewerProps) {
  // State 1: Default view mode is always "product"
  const [viewMode, setViewMode] = useState<DressRoomViewMode>('product');
  
  // State 2: Zoom position & interactive preview states
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Whenever the active product changes, reset viewMode to default "product"
  useEffect(() => {
    setViewMode('product');
    setIsZoomed(false);
  }, [product.id]);

  const hasModelImage = Boolean(
    product.modelWearingImage && product.modelWearingImage.trim().length > 0
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header View Selector Toggle Bar */}
      <ViewSelector
        viewMode={viewMode}
        onViewChange={(mode) => setViewMode(mode)}
        hasModelImage={hasModelImage}
      />

      {/* 2. Visual Canvas & Product Info Grid */}
      <div className={`grid grid-cols-1 ${showDetails ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Visual Stage (Product Image or Model Wearing Image) */}
        <div className={showDetails ? 'lg:col-span-7' : 'w-full'}>
          {viewMode === 'product' ? (
            <ProductView
              product={product}
              isZoomed={isZoomed}
              setIsZoomed={setIsZoomed}
              zoomPosition={zoomPosition}
              setZoomPosition={setZoomPosition}
            />
          ) : (
            <ModelView
              product={product}
              isZoomed={isZoomed}
              setIsZoomed={setIsZoomed}
              zoomPosition={zoomPosition}
              setZoomPosition={setZoomPosition}
            />
          )}
        </div>

        {/* Product Details & Purchase Actions */}
        {showDetails && (
          <div className="lg:col-span-5 h-full">
            <ProductData product={product} />
          </div>
        )}
      </div>
    </div>
  );
}
