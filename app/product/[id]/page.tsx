'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';
import { fetchProductById, fetchProducts } from '@/lib/api';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart, Star, Minus, Plus, Heart, ZoomIn, CheckCircle, X, Gift, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [modalZoomPosition, setModalZoomPosition] = useState({ x: 50, y: 50 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);

  // Review states
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const tryOnItem = useAvatarStore((state) => state.tryOnItem);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const prod = await fetchProductById(productId);
      setProduct(prod);
      setSelectedImage(0);

      // Load related products from backend
      const related = await fetchProducts({ category: prod.category, limit: 5 });
      setRelatedProducts(related.products.filter((p) => String(p.id) !== String(prod.id)).slice(0, 3));

      // Check if product is part of a lucky draw campaign
      try {
        const campaignsRes = await apiClient.get('/campaigns');
        if (campaignsRes.data?.success) {
          const matchingCampaign = campaignsRes.data.data.find(
            (c: any) => c.status === 'active' && c.productTitle.toLowerCase() === prod.title.toLowerCase()
          );
          setActiveCampaign(matchingCampaign || null);
        }
      } catch (cErr) {
        console.error('Error fetching campaign bindings on product page:', cErr);
      }

      // Load reviews from backend
      const reviewsResponse = await apiClient.get(`/reviews/product/${productId}`);
      setReviews(reviewsResponse.data.data || []);
    } catch (err) {
      setError('Failed to load product. Please try again later.');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !product) return;
    setSubmittingReview(true);
    try {
      const response = await apiClient.post('/reviews', {
        product: product.id,
        rating: newReviewRating,
        review: newReviewComment
      });

      if (response.data?.success) {
        const createdReview = response.data.data;
        setReviews([createdReview, ...reviews]);
        setNewReviewComment('');
        setNewReviewRating(5);
        toast.success('Thank you! Your product review has been submitted successfully.');
      }
    } catch (err: any) {
      console.error('Review submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleModalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setModalZoomPosition({ x, y });
  };

  const discountedPrice = product ? product.price * (1 - product.discountPercentage / 100) : 0;

  if (loading) {
    return <Loading />;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">{error || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div>
          <div
            className="relative w-full h-[450px] mb-4 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden cursor-zoom-in group border border-gray-100 dark:border-gray-900 shadow-sm"
            onMouseEnter={() => setShowZoomModal(true)}
          >
            <Image
              src={product.images[selectedImage] || product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-black/60 text-white text-xs py-1.5 px-3 rounded-full font-bold">Hover to inspect fabric details</span>
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(0, 4).map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index
                    ? 'border-blue-600 dark:border-blue-400'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Image src={img} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {product.title}
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-lg font-semibold text-gray-700 dark:text-gray-300">
                {product.rating}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              Brand: <span className="font-semibold">{product.brand}</span>
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${discountedPrice.toFixed(2)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                    -{product.discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {product.stock > 0 ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
              )}
            </p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {product.description}
          </p>

          {/* Active Lucky Draw Campaign banner */}
          {activeCampaign && (
            <div className="mb-6 p-4 rounded-2xl bg-yellow-500/5 dark:bg-yellow-950/20 border border-yellow-300/30 flex items-center gap-3">
              <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 animate-bounce" />
              <div className="text-left flex-1 min-w-0">
                <span className="block text-[10px] text-yellow-600 dark:text-yellow-400 font-black uppercase tracking-widest">Lucky Draw Active 🎲</span>
                <span className="block text-xs text-gray-800 dark:text-gray-250 font-bold mt-0.5">
                  Purchase this product to get a free entry to win: <span className="font-serif text-[#8b6f47] dark:text-[#c9a96b]">{activeCampaign.prizeName}</span>!
                </span>
              </div>
              <Link href={`/campaigns/${activeCampaign.id}`}>
                <Button size="sm" className="text-[10px] py-1.5 px-3 font-bold bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 shadow-sm whitespace-nowrap rounded-lg flex items-center gap-1">
                  View Campaign <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="flex-1"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            
            {isTryOnable && (
              <Button
                onClick={handleTryOn}
                variant="outline"
                size="lg"
                className="border-2 border-[#8b6f47] text-[#8b6f47] hover:bg-[#8b6f47] hover:text-white"
              >
                <Star className="w-5 h-5 mr-2 fill-current text-[#8b6f47] hover:text-white" />
                Try On (2D)
              </Button>
            )}

            <Button variant="outline" size="lg" onClick={handleAddToWishlist}>
              <Heart className="w-5 h-5 mr-2" />
              Wishlist
            </Button>
          </div>

          {/* Size Guide Trigger if Try Onable */}
          {isTryOnable && (
            <div className="mt-4">
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline"
              >
                📏 View Premium Size Guide
              </button>
            </div>
          )}

          {/* Product Details */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Product Specifications
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                  Category:
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white capitalize">
                  {product.category}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                  Brand:
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">{product.brand}</dd>
              </div>
              <div className="flex">
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                  Stock:
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">{product.stock} units</dd>
              </div>
              
              {/* Dynamic specs loop */}
              {product.specifications && Object.entries(product.specifications).map(([key, val]) => {
                if (['SvgStyle', 'SvgColor', 'Assembly Required'].includes(key)) return null;
                return (
                  <div className="flex" key={key}>
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32 capitalize">
                      {key}:
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {String(val)}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {/* Delivery Estimate & Return Policy */}
            <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-gray-150/40 dark:border-gray-800 space-y-3.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white font-bold">🚚 Delivery Estimate:</span>
                <span>Get it by Tuesday, Jul 28 (Standard Shipping - Free over $100)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white font-bold">🔄 Return Policy:</span>
                <span>Easy 30-day returns. Free return shipping labels included in your package.</span>
              </div>
            </div>
          </div>

          {/* Premium Size Guide Modal */}
          <Modal
            isOpen={isSizeGuideOpen}
            onClose={() => setIsSizeGuideOpen(false)}
            title="Style Studio Size Guide"
            size="md"
          >
            <div className="p-2">
              <p className="text-xs text-gray-500 mb-4">
                Measurements represent size ranges in inches. All garments are designed for tailored, standard fits.
              </p>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="py-2.5 px-3 font-bold">Size</th>
                    <th className="py-2.5 px-3 font-bold">Chest (in)</th>
                    <th className="py-2.5 px-3 font-bold">Waist (in)</th>
                    <th className="py-2.5 px-3 font-bold">Hips (in)</th>
                    <th className="py-2.5 px-3 font-bold">Sleeve (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold">S (Small)</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">34 - 36</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">28 - 30</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">35 - 37</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">32.5</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold">M (Medium)</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">38 - 40</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">32 - 34</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">39 - 41</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">33.5</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold">L (Large)</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">42 - 44</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">36 - 38</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">43 - 45</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">34.5</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold">XL (Extra Large)</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">46 - 48</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">40 - 42</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">47 - 49</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">35.5</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsSizeGuideOpen(false)} size="sm" className="bg-[#8b6f47] border-0 text-white px-4">
                  Close Size Guide
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Customer Reviews
        </h2>

        {/* Add a Review Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-900 mb-8 max-w-xl">
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">
            Write a Customer Review
          </h3>
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Rating Selection
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newReviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-650'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Your Review Comment
                </label>
                <textarea
                  placeholder="Share your experience wearing or sizing this product..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-xs border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl p-3 text-gray-800 dark:text-gray-250 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submittingReview}
                className="text-xs py-2 px-4 rounded-xl font-bold bg-[#8b6f47] text-white hover:bg-[#725a38] border-0"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You must be logged in to submit a product review.
              </p>
              <Link
                href="/auth/login"
                className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline mt-2 inline-block"
              >
                Log In to Your Account →
              </Link>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {review.userName}
                        </h4>
                        {review.verified && (
                          <span className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.date || (review as any).createdAt || new Date()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment || (review as any).review}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {(() => {
        const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

        useEffect(() => {
          if (product) {
            const stored = localStorage.getItem('recently-viewed');
            let list: Product[] = stored ? JSON.parse(stored) : [];
            list = list.filter((p) => String(p.id) !== String(product.id));
            list.unshift(product);
            list = list.slice(0, 4);
            localStorage.setItem('recently-viewed', JSON.stringify(list));
            setRecentlyViewed(list.filter((p) => String(p.id) !== String(product.id)));
          }
        }, [product]);

        if (recentlyViewed.length === 0) return null;

        return (
          <section className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recently Viewed Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyViewed.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Full Screen Zoom Modal with Blurred Background */}
      {showZoomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Overlay close trigger */}
          <div className="absolute inset-0" onClick={() => setShowZoomModal(false)} />
          
          {/* Zoom Panel */}
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-3xl p-6 shadow-2xl z-10 w-full max-w-3xl overflow-hidden">
            {/* Exit Button */}
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-3">
               <span className="text-[10px] font-bold text-[#8b6f47] dark:text-[#c9a96b] uppercase tracking-widest">High-Definition Fabric Inspection</span>
              <h4 className="text-xs font-bold text-gray-500 mt-0.5">{product.title}</h4>
            </div>

            {/* Dynamic Canvas Zoom */}
            <div
              className="relative w-full h-[520px] rounded-2xl overflow-hidden cursor-zoom-out shadow-inner bg-gray-50 dark:bg-gray-950"
              onMouseMove={handleModalMouseMove}
              onMouseLeave={() => setShowZoomModal(false)}
            >
              <Image
                src={product.images[selectedImage] || product.thumbnail}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-150 ease-out"
                style={{
                  transform: 'scale(2.8)',
                  transformOrigin: `${modalZoomPosition.x}% ${modalZoomPosition.y}%`
                }}
              />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-[10px] py-1 px-3 rounded-full text-white font-bold pointer-events-none">
                Move mouse to scroll zoomed fabric | Move cursor away to exit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

