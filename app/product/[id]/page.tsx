'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAuth } from '@/context/AuthContext';
import { fetchProductById, fetchProducts } from '@/lib/api';
import apiClient from '@/lib/apiClient';
import { Product, ProductVariantOption, ProductReview } from '@/types';
import { normalizeProduct, calculateTotalStock } from '@/utils/productUtils';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Badge from '@/components/ui/Badge';
import Accordion from '@/components/ui/Accordion';
import RatingStars from '@/components/ui/RatingStars';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Modal from '@/components/ui/Modal';
import ImageGallery from '@/components/product/ImageGallery';
import VariantSelector from '@/components/product/VariantSelector';
import ReviewSection from '@/components/product/ReviewSection';
import MobileStickyCart from '@/components/product/MobileStickyCart';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCw, Gift, ArrowRight, Sparkles, FileText, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const toast = useToast();

  const [rawProduct, setRawProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  // Selected Variant Options State map: { 'Size': option, 'Color': option }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariantOption>>({});

  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const tryOnItem = useAvatarStore((state) => state.tryOnItem);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Time remaining and delivery date estimator states
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [deliveryDates, setDeliveryDates] = useState({ standard: '', express: '' });

  useEffect(() => {
    const calculateTimeAndDates = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(17, 0, 0, 0); // 5:00 PM cutoff

      let targetDate = cutoff;
      if (now.getTime() > cutoff.getTime()) {
        targetDate = new Date(cutoff.getTime() + 24 * 60 * 60 * 1000);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });

      // Calculate Delivery Dates (skipping Sunday)
      const addBusinessDays = (startDate: Date, days: number) => {
        let result = new Date(startDate);
        let added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          if (result.getDay() !== 0) { // Skip Sunday
            added++;
          }
        }
        return result;
      };

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      const standardDate = addBusinessDays(now, now.getTime() > cutoff.getTime() ? 4 : 3);
      const expressDate = addBusinessDays(now, now.getTime() > cutoff.getTime() ? 2 : 1);

      setDeliveryDates({
        standard: standardDate.toLocaleDateString('en-US', options),
        express: expressDate.toLocaleDateString('en-US', options),
      });
    };

    calculateTimeAndDates();
    const interval = setInterval(calculateTimeAndDates, 1000);
    return () => clearInterval(interval);
  }, []);

  // Normalize product payload cleanly
  const product = useMemo(() => {
    return rawProduct ? normalizeProduct(rawProduct) : null;
  }, [rawProduct]);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (product) {
      try {
        const stored = localStorage.getItem('recently-viewed');
        let list: Product[] = stored ? JSON.parse(stored) : [];
        list = list.filter((p) => String(p.id) !== String(product.id));
        list.unshift(product);
        list = list.slice(0, 4);
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

  // Calculate current price (incorporating variant price delta if any)
  const calculatedPrice = useMemo(() => {
    if (!product) return 0;
    let base = product.price;
    Object.values(selectedVariants).forEach((opt) => {
      if (opt.priceDelta) base += opt.priceDelta;
    });
    return base;
  }, [product, selectedVariants]);

  // Calculate available stock for current selection
  const currentStock = useMemo(() => {
    if (!product) return 0;
    const selectedOptionsList = Object.values(selectedVariants);
    if (selectedOptionsList.length > 0) {
      return selectedOptionsList[0].stock;
    }
    return product.totalStock || product.stock;
  }, [product, selectedVariants]);

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

  const handleAddToCart = () => {
    if (product) {
      const customProductPayload = {
        ...product,
        price: calculatedPrice,
        stock: currentStock,
      };
      addItem(customProductPayload, quantity);
      toast.success(`Added ${quantity} x "${product.title}" (${activeVariantSummary || 'Standard'}) to cart!`);
    }
  };

  const isTryOnable = product
    ? ['top', 'pants', 'dress', 'jacket', 'shoes', 'hat', 'bag', 'jewelry', 'glasses'].includes(product.category.toLowerCase())
    : false;

  const handleTryOn = () => {
    if (product) {
      tryOnItem(product);
      router.push('/dressing-room');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.info('Please log in to add products to your wishlist.');
      router.push('/auth/login');
      return;
    }
    try {
      const response = await apiClient.post('/wishlist', { productId: product?.id });
      if (response.data?.success) {
        toast.success(`${product?.title} has been added to your wishlist successfully!`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add item to wishlist.';
      toast.error(msg);
    }
  };

  const handleReviewSubmit = async (newRating: number, comment: string) => {
    if (!product) return;
    try {
      const response = await apiClient.post('/reviews', {
        product: product.id,
        rating: newRating,
        review: comment,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-bold text-sm">{error || 'Product not found'}</p>
        <Button onClick={() => router.push('/products')} className="bg-[#8b6f47] text-white rounded-full text-xs font-bold px-6 py-2">
          Back to Shop Catalog
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category, href: `/products?category=${product.category}` },
          { label: product.title },
        ]}
      />

      {/* Main Product Details Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery & Zoom */}
        <div className="lg:col-span-7">
          <ImageGallery
            images={product.images}
            title={product.title}
            activeVariantImage={activeVariantImage}
          />
        </div>

        {/* Right Column: Product Meta & Purchase Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Lucky Draw Campaign banner */}
          {activeCampaign && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Gift className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                      Active Prize Campaign
                    </span>
                    <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 font-medium">
                      Purchase this product to get a free entry to win:{' '}
                      <span className="font-serif font-bold text-[#8b6f47] dark:text-[#c9a96b]">
                        {activeCampaign.prizeName}
                      </span>!
                    </p>
                  </div>
                </div>

                <Link href={`/campaigns/${activeCampaign.id}`}>
                  <Button variant="outline" className="text-[10px] py-1 px-3 rounded-full flex items-center gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
                    View Campaign <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Header Title & Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                {product.brand}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.tags &&
                  product.tags.map((tag) => (
                    <Badge key={tag} variant={tag === 'Bestseller' ? 'gold' : tag === 'Low Stock' ? 'danger' : 'primary'} size="sm">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            {/* Ratings & Reviews */}
            <div className="flex items-center gap-3 pt-1">
              <RatingStars rating={product.rating} showScore reviewCount={reviews.length} size="md" />
              {isTryOnable && (
                <button
                  type="button"
                  onClick={handleTryOn}
                  className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D Fitting Room Try-On</span>
                </button>
              )}
            </div>
          </div>

          {/* Price & Stock Container */}
          <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-150/50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#8b6f47] dark:text-[#c9a96b] font-mono">
                  ${discountedPrice.toFixed(2)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-sm text-gray-400 line-through font-mono">
                    ${calculatedPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {product.discountPercentage > 0 && (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                  Save {product.discountPercentage}% Off Retail
                </span>
              )}
            </div>

            {/* Availability Status */}
            <div>
              {currentStock > 0 ? (
                <Badge variant={currentStock <= 5 ? 'warning' : 'success'} size="md">
                  {currentStock <= 5 ? `Only ${currentStock} Left` : 'In Stock'}
                </Badge>
              ) : (
                <Badge variant="danger" size="md">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Real-time localized Shipping Countdown & Delivery Estimator */}
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/30 dark:to-zinc-900/10 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-serif font-black text-gray-900 dark:text-white">
              <Truck className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b] animate-pulse" />
              <span>Premium Shipping Calculator</span>
            </div>
            
            <div className="space-y-2 text-xs text-text-muted leading-relaxed">
              <p className="flex items-center justify-between">
                <span>🚚 Standard Shipping (Free)</span>
                <strong className="text-gray-900 dark:text-white">{deliveryDates.standard}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>🚀 Express Delivery ($9.99)</span>
                <strong className="text-[#8b6f47] dark:text-[#c9a96b]">{deliveryDates.express}</strong>
              </p>
              
              <div className="pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>
                  Order in the next <strong className="font-mono font-black">{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</strong> for same-day dispatch!
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Variant Selector (Size/Color/Style) */}
          {product.variants && product.variants.length > 0 && (
            <div className="pt-2">
              <VariantSelector
                variants={product.variants}
                selectedOptions={selectedVariants}
                onOptionSelect={handleVariantSelect}
              />
            </div>
          )}

          {/* Quantity Stepper & Add to Cart Action */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Quantity
                </span>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.max(1, currentStock)}
                  disabled={currentStock === 0}
                />
              </div>

              <div className="flex-1 space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-transparent select-none">
                  Action
                </span>
                <Button
                  disabled={currentStock === 0}
                  onClick={handleAddToCart}
                  className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </Button>
              </div>

              {/* Wishlist Button */}
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-transparent select-none">
                  Wish
                </span>
                <button
                  onClick={handleAddToWishlist}
                  className="p-3 rounded-full border border-gray-250 dark:border-gray-700 hover:border-red-500 hover:text-red-500 text-gray-600 dark:text-gray-300 transition flex items-center justify-center cursor-pointer bg-white dark:bg-gray-950"
                  title="Add to Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Guaranteed Trust Perks */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <div className="p-2 space-y-1">
                <Truck className="w-4 h-4 text-[#8b6f47] mx-auto" />
                <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-200">
                  {product.shippingInfo?.freeShipping ? 'Free Shipping' : 'Fast Shipping'}
                </span>
              </div>
              <div className="p-2 space-y-1">
                <ShieldCheck className="w-4 h-4 text-[#8b6f47] mx-auto" />
                <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-200">
                  Authentic Guaranteed
                </span>
              </div>
              <div className="p-2 space-y-1">
                <RefreshCw className="w-4 h-4 text-[#8b6f47] mx-auto" />
                <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-200">
                  30-Day Easy Returns
                </span>
              </div>
            </div>
          </div>

          {/* Accordion Sections: Description, Specs, Shipping & Returns */}
          <div className="space-y-3 pt-4">
            <Accordion title="Description & Craftsmanship" defaultOpen icon={<FileText className="w-4 h-4" />}>
              <p className="leading-relaxed">{product.description}</p>
            </Accordion>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Accordion title="Technical Specifications" icon={<Package className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="font-bold text-gray-500">{key}:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

            <Accordion title="Shipping & Return Policy" icon={<Truck className="w-4 h-4" />}>
              <div className="space-y-2">
                <p><strong>Delivery Estimate:</strong> {product.shippingInfo?.estimate || 'Standard 2-4 Business Days'}</p>
                <p><strong>Return Guarantee:</strong> {product.shippingInfo?.returnPolicy || '30-Day Hassle-Free Money Back Return Policy'}</p>
              </div>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Verified Reviews & Ratings
        </h2>
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
        <section className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Floating Mobile Sticky Cart Bar */}
      <MobileStickyCart
        title={product.title}
        price={calculatedPrice}
        salePrice={product.discountPercentage ? discountedPrice : undefined}
        activeVariantSummary={activeVariantSummary}
        isOutOfStock={currentStock === 0}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
