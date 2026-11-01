'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { garmentKind } from '@/stores/fittingStore';
import { useAuth } from '@/context/AuthContext';
import { fetchProductById, fetchProducts } from '@/lib/api';
import apiClient from '@/lib/apiClient';
import { Product, ProductVariantOption, ProductReview } from '@/types';
import { normalizeProduct, calculateTotalStock } from '@/utils/productUtils';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import Accordion from '@/components/ui/Accordion';
import RatingStars from '@/components/ui/RatingStars';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Modal from '@/components/ui/Modal';
import ImageGallery from '@/components/product/ImageGallery';
import VariantSelector from '@/components/product/VariantSelector';
import ReviewSection from '@/components/product/ReviewSection';
import MobileStickyCart from '@/components/product/MobileStickyCart';
import BackInStockForm from '@/components/product/BackInStockForm';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw, Gift, ArrowRight, Sparkles, ChevronRight, Ruler, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

import dynamic from 'next/dynamic';
// The try-on modal carries the 3D studio (three.js); load it only when a shopper opens it
const TryOnModal = dynamic(() => import('@/features/ai/avatar/TryOnModal'), { ssr: false });
import CompleteOutfitBuilder from '@/features/ai/product-ai/CompleteOutfitBuilder';
import AIBadge from '@/components/ui/AIBadge';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate, format: formatCurrency } = useCurrencyStore();

  const [rawProduct, setRawProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  // Selected Variant Options State map: { 'Size': option, 'Color': option }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariantOption>>({});

  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Sizing Advisor and bundle states
  const [isSizeQuizOpen, setIsSizeQuizOpen] = useState(false);
  const [quizHeight, setQuizHeight] = useState('');
  const [quizWeight, setQuizWeight] = useState('');
  const [quizFit, setQuizFit] = useState('regular');
  const [quizRecommendation, setQuizRecommendation] = useState<string | null>(null);

  const calculateSizeQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Number(quizHeight);
    const w = Number(quizWeight);
    if (!h || !w) return;

    let points = 3; // default M
    if (h < 165) points = 1;
    else if (h < 172) points = 2;
    else if (h < 180) points = 3;
    else if (h < 188) points = 4;
    else if (h < 196) points = 5;
    else points = 6;

    if (w < 55) points -= 1;
    else if (w >= 85 && w < 100) points += 1;
    else if (w >= 100) points += 2;

    if (quizFit === 'tight') points -= 1;
    else if (quizFit === 'loose') points += 1;

    const sizes = ['XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const finalIndex = Math.max(0, Math.min(sizes.length - 1, points));
    const size = sizes[finalIndex];
    const matchPercent = Math.min(99, Math.floor(85 + Math.random() * 14));

    setQuizRecommendation(size);
  };

  const applyRecommendedSize = (sizeVal: string) => {
    if (!product || !product.variants) return;
    const sizeGroup = product.variants.find((g) => g.name === 'Size');
    if (sizeGroup) {
      const option = sizeGroup.options.find(
        (opt) =>
          opt.value.toUpperCase().startsWith(sizeVal.toUpperCase()) ||
          sizeVal.toUpperCase().startsWith(opt.value.toUpperCase())
      );
      if (option) {
        handleVariantSelect('Size', option);
        toast.success(`Fit Quiz recommendation applied: Selected Size ${option.value}!`);
        setIsSizeQuizOpen(false);
        setQuizRecommendation(null);
        setQuizHeight('');
        setQuizWeight('');
      } else {
        toast.error(`Sizing recommended ${sizeVal}, but it is currently unavailable for this item.`);
      }
    }
  };


  // loadProduct stores the product already normalized
  const product = rawProduct;

  const [checkedBundleIds, setCheckedBundleIds] = useState<string[]>([]);
  useEffect(() => {
    if (product && relatedProducts.length > 0) {
      setCheckedBundleIds([String(product.id), ...relatedProducts.slice(0, 2).map((p) => String(p.id))]);
    }
  }, [product, relatedProducts]);

  useEffect(() => {
    if (product) {
      try {
        const stored = localStorage.getItem('recently-viewed');
        const previous: Product[] = stored ? JSON.parse(stored) : [];
        const list = [product, ...previous.filter((p) => String(p.id) !== String(product.id))].slice(0, 4);
        localStorage.setItem('recently-viewed', JSON.stringify(list));
        setRecentlyViewed(list.filter((p) => String(p.id) !== String(product.id)));
      } catch (e) {
        console.error('Error handling recently viewed:', e);
      }
    }
  }, [product]);

  // Set default initial variant options when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const defaults: Record<string, ProductVariantOption> = {};
      product.variants.forEach((group) => {
        if (group.options && group.options.length > 0) {
          defaults[group.name] = group.options[0];
        }
      });
      setSelectedVariants(defaults);
    }
  }, [product]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const prod = await fetchProductById(productId);
      const normalized = normalizeProduct(prod);
      setRawProduct(normalized);

      // Load related products, campaigns, and reviews in parallel
      const [related, campaignsRes, reviewsResponse] = await Promise.all([
        fetchProducts({ category: normalized.category, limit: 5 }).catch(() => ({ products: [], total: 0, skip: 0, limit: 5 })),
        apiClient.get('/campaigns').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get(`/reviews/product/${productId}`).catch(() => ({ data: { data: [] } }))
      ]);

      if (related?.products) {
        setRelatedProducts(
          related.products.map(normalizeProduct).filter((p) => String(p.id) !== String(normalized.id)).slice(0, 3)
        );
      }

      if (campaignsRes.data?.success) {
        const matchingCampaign = campaignsRes.data.data.find(
          (c: any) => c.status === 'active' && c.productTitle.toLowerCase() === normalized.title.toLowerCase()
        );
        setActiveCampaign(matchingCampaign || null);
      } else {
        setActiveCampaign(null);
      }

      const fetchedReviews = reviewsResponse.data?.data || [];
      setReviews(fetchedReviews.length > 0 ? fetchedReviews : normalized.reviews || []);
    } catch (err) {
      setError('Failed to load product details. Please try again later.');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Current price: base price plus the selected variants' price deltas (a cheap number, no memo needed)
  const calculatedPrice = product
    ? Object.values(selectedVariants).reduce((sum, opt) => sum + (opt.priceDelta || 0), product.price)
    : 0;

  // Available stock for the current selection
  const selectedOptionsList = Object.values(selectedVariants);
  const currentStock = !product
    ? 0
    : selectedOptionsList.length > 0
      ? selectedOptionsList[0].stock
      : product.totalStock || product.stock;

  // Determine active variant image override if any
  const activeVariantImage = useMemo(() => {
    for (const opt of Object.values(selectedVariants)) {
      if (opt.image) return opt.image;
    }
    return null;
  }, [selectedVariants]);

  const activeVariantSummary = useMemo(() => {
    return Object.values(selectedVariants)
      .map((opt) => opt.value)
      .join(' / ');
  }, [selectedVariants]);

  const handleVariantSelect = (groupName: string, option: ProductVariantOption) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [groupName]: option,
    }));
  };

  const handleAddToCart = async () => {
    if (product) {
      const customProductPayload = {
        ...product,
        price: calculatedPrice,
        stock: currentStock,
      };
      const primaryVariant = Object.values(selectedVariants)[0];
      const variantPayload = primaryVariant ? {
        id: primaryVariant.id || `${product.id}-${activeVariantSummary}`,
        sku: primaryVariant.sku || `${product.sku || product.SKU || 'SKU'}-${activeVariantSummary}`,
        price: calculatedPrice,
        stock: currentStock,
        attributes: selectedVariants as any,
      } : undefined;
      try {
        await addItem(customProductPayload, quantity, variantPayload as any);
        toast.success(`Added ${quantity} x "${product.title}" (${activeVariantSummary || 'Standard'}) to cart!`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Could not add this item to your cart. Please try again.');
      }
    }
  };

  const isTryOnable = product ? garmentKind(product) !== null : false;

  const handleTryOn = () => {
    if (product) {
      router.push(`/dressing-room?product=${product.id}`);
    }
  };

  const wishlistIds = useWishlistStore((state) => state.ids);
  const loadWishlist = useWishlistStore((state) => state.load);
  const isWishlisted = product ? wishlistIds.includes(String(product.id)) : false;

  useEffect(() => {
    if (user) loadWishlist(user.id);
  }, [user, loadWishlist]);

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.info('Please log in to add products to your wishlist.');
      router.push('/auth/login?redirect=' + encodeURIComponent('/product/' + productId));
      return;
    }
    if (!product) return;
    try {
      if (isWishlisted) {
        await useWishlistStore.getState().remove(product.id);
        toast.success(`${product.title} was removed from your wishlist.`);
      } else {
        await useWishlistStore.getState().add(product.id);
        toast.success(`${product.title} has been added to your wishlist.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update wishlist.');
      useWishlistStore.getState().load(user.id, true);
    }
  };

  const handleReviewSubmit = async (newRating: number, comment: string, images?: string[]) => {
    if (!product) return;
    if (!user) {
      toast.info('Please log in to write a review.');
      router.push('/auth/login?redirect=' + encodeURIComponent('/product/' + productId));
      return;
    }
    try {
      const response = await apiClient.post('/reviews', {
        product: product.id,
        rating: newRating,
        review: comment,
        images: images || [],
      });

      if (response.data?.success) {
        const createdReview = response.data.data;
        setReviews([createdReview, ...reviews]);
        toast.success('Thank you! Your product review has been submitted successfully.');
      }
    } catch (err: any) {
      console.error('Review submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl text-ink">This piece isn&apos;t available</h1>
        <p className="text-sm text-stone-500">{error || 'Product not found'}</p>
        <Button onClick={() => router.push('/products')}>
          Continue shopping
        </Button>
      </div>
    );
  }

  const discountedPrice = calculatedPrice * (1 - (product.discountPercentage || 0) / 100);

  // Dynamic SEO JSON-LD Product Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    sku: `SKU-${product.id}`,
    mpn: `MPN-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'SwiftCart',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: discountedPrice.toFixed(2),
      priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : '',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: reviews.length || 1,
    },
  };

  const reviewTotal = reviews.length;
  const bundleItems = [product, ...relatedProducts.slice(0, 2).filter((p) => checkedBundleIds.includes(String(p.id)))];
  const bundleTotal = bundleItems.reduce((sum, p) => sum + (p.id === product.id ? discountedPrice : p.price * (1 - (p.discountPercentage || 0) / 100)), 0);
  const sectionTitle = 'font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl';

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 py-5 text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
        <Link href="/products" className="hover:text-ink">Shop</Link>
        <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
        <Link href={`/products?category=${product.category}`} className="capitalize hover:text-ink">{product.category}</Link>
        <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
        <span className="max-w-[16rem] truncate text-ink">{product.title}</span>
      </nav>

      {/* Main product layout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16"
      >
        {/* Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery
            images={product.images}
            title={product.title}
            activeVariantImage={activeVariantImage}
          />
        </div>

        {/* Purchase panel */}
        <div className="lg:col-span-5">
          <div className="space-y-7 lg:sticky lg:top-28">
            {/* Active Lucky Draw Campaign banner */}
            {activeCampaign && (
              <Link
                href={`/campaigns/${activeCampaign.id}`}
                className="group flex items-center gap-3 rounded-md bg-surface-muted px-4 py-3 text-sm transition-colors hover:bg-stone-200/70 dark:hover:bg-white/10"
              >
                <Gift className="size-4 shrink-0 text-[#8b6f47] dark:text-[#c9a96b]" />
                <span className="flex-1 text-stone-700 dark:text-stone-300">
                  Buy this piece for a free entry to win <span className="font-medium text-ink">{activeCampaign.prizeName}</span>
                </span>
                <ArrowRight className="size-4 text-stone-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}

            {/* Title, price, rating */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{product.brand}</span>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-ink sm:text-4xl">
                {product.title}
              </h1>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1">
                <span className={`text-xl font-medium tabular-nums ${product.discountPercentage > 0 ? 'text-[#9b2c2c] dark:text-[#f0a3a3]' : 'text-ink'}`}>
                  {formatCurrency(discountedPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-sm tabular-nums text-stone-400 line-through">{formatCurrency(calculatedPrice)}</span>
                    <span className="text-xs font-medium text-[#9b2c2c] dark:text-[#f0a3a3]">-{product.discountPercentage}%</span>
                  </>
                )}
              </div>
              <p className="text-xs text-stone-500">Tax and shipping are calculated at checkout.</p>

              <a href="#reviews" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-ink dark:text-stone-400">
                {reviewTotal > 0 ? (
                  <>
                    <RatingStars rating={product.rating} size="sm" />
                    <span className="underline underline-offset-4">{reviewTotal} review{reviewTotal === 1 ? '' : 's'}</span>
                  </>
                ) : (
                  <span className="underline underline-offset-4">No reviews yet. Be the first to write one.</span>
                )}
              </a>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 border-t border-line pt-6">
                <VariantSelector
                  variants={product.variants}
                  selectedOptions={selectedVariants}
                  onOptionSelect={handleVariantSelect}
                />
                {product.variants.some((v) => v.name === 'Size') && (
                  <button
                    type="button"
                    onClick={() => setIsSizeQuizOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 underline underline-offset-4 hover:text-ink dark:text-stone-400 cursor-pointer"
                  >
                    <Ruler className="size-3.5" /> Not sure? Find your size
                  </button>
                )}
              </div>
            )}

            {/* Purchase actions */}
            <div className="space-y-3 border-t border-line pt-6">
              <p className="flex items-center gap-2 text-sm">
                <span className={`size-1.5 rounded-full ${currentStock === 0 ? 'bg-red-500' : currentStock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-stone-700 dark:text-stone-300">
                  {currentStock === 0 ? 'Out of stock' : currentStock <= 5 ? `Only ${currentStock} left` : 'In stock, ready to ship'}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.max(1, currentStock)}
                  disabled={currentStock === 0}
                  size="lg"
                />
                <Button
                  disabled={currentStock === 0}
                  onClick={handleAddToCart}
                  size="lg"
                  className="h-12 flex-1"
                >
                  <ShoppingBag className="size-4" />
                  {currentStock === 0 ? 'Out of stock' : 'Add to bag'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setIsTryOnModalOpen(true)} className="h-12 flex-1">
                  <Sparkles className="size-4" />
                  Try on with AI
                </Button>
                <button
                  onClick={handleAddToWishlist}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-ink cursor-pointer"
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  aria-pressed={isWishlisted}
                >
                  <Heart className={`size-[18px] ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {isTryOnable && (
                <button
                  type="button"
                  onClick={handleTryOn}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 underline underline-offset-4 hover:text-ink dark:text-stone-400 cursor-pointer"
                >
                  Open in the 3D dressing room <ArrowRight className="size-3" />
                </button>
              )}

              {currentStock === 0 && (
                <div className="space-y-2 rounded-md bg-surface-muted p-4">
                  <p className="text-sm font-medium text-ink">Get notified when it&apos;s back</p>
                  <p className="text-xs leading-relaxed text-stone-500">
                    Leave your email and we&apos;ll let you know as soon as this piece is available again.
                  </p>
                  <BackInStockForm productId={String(product.id)} />
                </div>
              )}
            </div>

            {/* Service promises */}
            <ul className="space-y-2.5 border-t border-line pt-6 text-sm text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 size-4 shrink-0 text-stone-400" />
                <span>
                  {product.shippingInfo?.freeShipping ? 'Free shipping' : 'Fast shipping'}
                  {product.shippingInfo?.estimate && <span className="text-stone-400"> · {product.shippingInfo.estimate}</span>}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-stone-400" />
                <span>{product.shippingInfo?.returnPolicy || '30-day returns'}</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-stone-400" />
                <span>Authenticity guaranteed, secure checkout</span>
              </li>
            </ul>

            {/* Details */}
            <div className="border-t border-line">
              <Accordion title="Description" defaultOpen>
                <p>{product.description}</p>
              </Accordion>

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <Accordion title="Details & composition">
                  <dl className="divide-y divide-line">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between gap-4 py-2">
                        <dt className="text-stone-500">{key}</dt>
                        <dd className="text-right text-ink">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </Accordion>
              )}

              <Accordion title="Shipping & returns">
                <p><span className="text-ink">Delivery:</span> {product.shippingInfo?.estimate || 'Standard 2-4 business days'}</p>
                <p><span className="text-ink">Returns:</span> {product.shippingInfo?.returnPolicy || '30-day hassle-free returns'}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Frequently Bought Together */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 space-y-8">
          <div>
            <h2 className={sectionTitle}>Complete the look</h2>
            <p className="mt-2 text-sm text-stone-500">Pieces that pair well with this one. Add them to your bag together.</p>
          </div>

          <div className="flex flex-col gap-8 border-y border-line py-8 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
                  <Image src={product.thumbnail} alt={product.title} fill sizes="72px" className="object-cover object-top" />
                </div>
                <div className="w-36">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400">This item</p>
                  <h4 className="font-sans text-sm text-ink line-clamp-2">{product.title}</h4>
                  <p className="text-sm tabular-nums text-stone-600 dark:text-stone-400">{formatCurrency(discountedPrice)}</p>
                </div>
              </div>

              {relatedProducts.slice(0, 2).map((p) => {
                const isChecked = checkedBundleIds.includes(String(p.id));
                const priceVal = p.price * (1 - (p.discountPercentage || 0) / 100);
                return (
                  <React.Fragment key={p.id}>
                    <Plus className="size-4 text-stone-300 dark:text-stone-600" />
                    <label className={`flex cursor-pointer items-center gap-3 select-none transition-opacity ${isChecked ? '' : 'opacity-50 hover:opacity-80'}`}>
                      <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
                        <Image src={p.thumbnail} alt={p.title} fill sizes="72px" className="object-cover object-top" />
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setCheckedBundleIds((prev) =>
                              prev.includes(String(p.id))
                                ? prev.filter((id) => id !== String(p.id))
                                : [...prev, String(p.id)]
                            );
                          }}
                          className="absolute left-1.5 top-1.5 size-4 accent-stone-900 dark:accent-stone-100"
                          aria-label={`Include ${p.title}`}
                        />
                      </div>
                      <div className="w-36">
                        <h4 className="font-sans text-sm text-ink line-clamp-2">{p.title}</h4>
                        <p className="text-sm tabular-nums text-stone-600 dark:text-stone-400">{formatCurrency(priceVal)}</p>
                      </div>
                    </label>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="space-y-3 lg:w-64 lg:border-l lg:border-line lg:pl-8">
              <div>
                <p className="text-xs text-stone-500">Total for {bundleItems.length} {bundleItems.length === 1 ? 'piece' : 'pieces'}</p>
                <p className="text-xl font-medium tabular-nums text-ink">{formatCurrency(bundleTotal)}</p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await Promise.all(bundleItems.map((p) => addItem(p, 1)));
                    toast.success(bundleItems.length === 1 ? 'Added to your bag.' : `Added ${bundleItems.length} pieces to your bag.`);
                  } catch {
                    toast.error('Failed to add bundle to cart.');
                  }
                }}
                className="w-full"
              >
                Add {bundleItems.length === 1 ? 'to bag' : `all ${bundleItems.length} to bag`}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* AI Complete Outfit Builder Section */}
      <section className="mt-24">
        <CompleteOutfitBuilder baseProduct={product} />
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="mt-24 scroll-mt-28 border-t border-line pt-12">
        <h2 className={`${sectionTitle} mb-8`}>Reviews</h2>
        <ReviewSection
          productId={product.id}
          rating={product.rating}
          reviewCount={reviews.length}
          ratingDistribution={product.ratingDistribution}
          reviews={reviews}
          onSubmitReview={handleReviewSubmit}
        />
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 space-y-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className={sectionTitle}>You may also like</h2>
            <Link href={`/products?category=${product.category}`} className="text-sm text-ink underline underline-offset-4">
              Shop {product.category}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((relatedProduct, idx) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="mt-24 space-y-8">
          <h2 className={sectionTitle}>Recently viewed</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {recentlyViewed.slice(0, 4).map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Size advisor */}
      <Modal
        isOpen={isSizeQuizOpen}
        onClose={() => {
          setIsSizeQuizOpen(false);
          setQuizRecommendation(null);
        }}
        title="Find your size"
        size="md"
      >
        <div className="space-y-5 text-left">
          <p className="text-sm text-stone-500">
            Tell us a little about yourself and we&apos;ll suggest a size.
          </p>

          {!quizRecommendation ? (
            <form onSubmit={calculateSizeQuiz} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-stone-600 dark:text-stone-300">Height (cm)</span>
                  <input
                    type="number"
                    required
                    min="100"
                    max="250"
                    placeholder="e.g. 175"
                    value={quizHeight}
                    onChange={(e) => setQuizHeight(e.target.value)}
                    className="h-11 w-full rounded-md border border-line bg-transparent px-3 text-sm text-ink outline-none focus:border-ink"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-stone-600 dark:text-stone-300">Weight (kg)</span>
                  <input
                    type="number"
                    required
                    min="30"
                    max="200"
                    placeholder="e.g. 70"
                    value={quizWeight}
                    onChange={(e) => setQuizWeight(e.target.value)}
                    className="h-11 w-full rounded-md border border-line bg-transparent px-3 text-sm text-ink outline-none focus:border-ink"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-stone-600 dark:text-stone-300">How do you like it to fit?</span>
                <div className="grid grid-cols-3 gap-2">
                  {['tight', 'regular', 'loose'].map((fitOpt) => (
                    <button
                      key={fitOpt}
                      type="button"
                      onClick={() => setQuizFit(fitOpt)}
                      aria-pressed={quizFit === fitOpt}
                      className={`h-10 rounded-md border text-sm capitalize transition-colors cursor-pointer ${
                        quizFit === fitOpt ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink'
                      }`}
                    >
                      {fitOpt}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Suggest my size
              </Button>
            </form>
          ) : (
            <div className="space-y-5 py-4 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">We suggest</p>
                <p className="mt-1 font-serif text-5xl text-ink">{quizRecommendation}</p>
              </div>
              <p className="text-sm text-stone-500">
                Based on a height of {quizHeight} cm, a weight of {quizWeight} kg and a {quizFit} fit.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuizRecommendation(null)} className="flex-1">
                  Start over
                </Button>
                <Button onClick={() => applyRecommendedSize(quizRecommendation)} className="flex-1">
                  Select size {quizRecommendation}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Floating Mobile Sticky Cart Bar */}
      <MobileStickyCart
        title={product.title}
        price={calculatedPrice}
        salePrice={product.discountPercentage ? discountedPrice : undefined}
        activeVariantSummary={activeVariantSummary}
        isOutOfStock={currentStock === 0}
        onAddToCart={handleAddToCart}
      />

      {/* AI Virtual Try-On Modal */}
      {product && isTryOnModalOpen && (
        <TryOnModal
          isOpen={isTryOnModalOpen}
          onClose={() => setIsTryOnModalOpen(false)}
          product={product}
        />
      )}
    </div>
  );
}
