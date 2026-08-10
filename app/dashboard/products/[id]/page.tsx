'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AccountLayout from '@/components/layout/AccountLayout';
import { productService } from '@/services/productService';
import Loading from '@/components/ui/Loading';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import {
  Edit2,
  Copy,
  Archive,
  Trash2,
  Package,
  DollarSign,
  Layers,
  Truck,
  Globe,
  Tag,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowLeft,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const fetched = await productService.getProductById(productId);
      if (fetched) {
        setProduct(fetched);
      } else {
        toast.error('Product not found.');
        router.push('/dashboard/products');
      }
    } catch (err: any) {
      toast.error('Failed to load product details.');
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;
    try {
      const dup = await productService.duplicateProduct(product.id);
      if (dup) {
        toast.success('Product duplicated successfully!');
        router.push(`/dashboard/products/${dup.id}/edit`);
      }
    } catch (err) {
      toast.error('Failed to duplicate product.');
    }
  };

  const handleToggleArchive = async () => {
    if (!product) return;
    try {
      const newStatus = product.status === 'archived' ? 'published' : 'archived';
      await productService.updateProduct(product.id, { status: newStatus });
      toast.success(`Product status updated to ${newStatus}.`);
      loadProduct();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleExecuteDelete = async () => {
    if (!product) return;
    try {
      await productService.deleteProduct(product.id);
      toast.success('Product deleted.');
      setIsDeleteModalOpen(false);
      router.push('/dashboard/products');
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  if (loading) {
    return (
      <AccountLayout activeTabName="/dashboard">
        <Loading />
      </AccountLayout>
    );
  }

  if (!product) {
    return (
      <AccountLayout activeTabName="/dashboard">
        <div className="p-8 text-center text-text-muted">
          Product not found.
        </div>
      </AccountLayout>
    );
  }

  const primaryImage = product.images?.[0] || product.thumbnail || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const discountPct = product.discountPercentage || (product.originalPrice && product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

  return (
    <AccountLayout activeTabName="/dashboard">
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-gray-150 dark:border-gray-800">
          <div>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
            <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wide">
              {product.title || product.name}
            </h1>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              SKU: {product.sku || product.SKU || 'N/A'} | ID: {product.id}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/product/${product.id}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl flex items-center gap-1.5"
                title="Preview Storefront View"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Store Preview</span>
              </Button>
            </Link>

            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Button
                variant="primary"
                size="sm"
                className="rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="rounded-xl flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              className="rounded-xl flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{product.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Product Management Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                <img
                  src={primaryImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {product.category}
                  </span>
                  {product.subcategory && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {product.subcategory}
                    </span>
                  )}
                  {product.status === 'published' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Published
                    </span>
                  ) : product.status === 'draft' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      Draft
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                      Archived
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">
                  {product.title}
                </h2>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                  {product.shortDescription || product.description}
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Brand</span>
                    <span className="font-bold text-gray-900 dark:text-white">{product.brand}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Rating</span>
                    <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{product.rating || 4.8} ({product.reviewCount || 12} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Pricing Card */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
                  <DollarSign className="w-4 h-4 text-[#8b6f47]" />
                  Pricing Details
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Selling Price:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">${product.price}</span>
                  </div>

                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Original Price:</span>
                      <span className="line-through text-text-muted">${product.originalPrice}</span>
                    </div>
                  )}

                  {discountPct > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Discount:</span>
                      <span className="font-bold text-rose-600">{discountPct}% OFF</span>
                    </div>
                  )}

                  {product.costPrice && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-text-muted">Unit Cost Price:</span>
                      <span className="font-medium">${product.costPrice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Card */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
                  <Package className="w-4 h-4 text-[#8b6f47]" />
                  Inventory Status
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Stock Quantity:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">{product.stock} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Reserved Stock:</span>
                    <span>{product.reservedStock || 0} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Warehouse:</span>
                    <span className="font-medium">{product.warehouse || 'Main Warehouse'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Matrix */}
            {product.variantCombinations && product.variantCombinations.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider border-b pb-3 border-gray-100 dark:border-gray-800">
                  Variants ({product.variantCombinations.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-500">
                        <th className="py-2 px-3">Variant</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Price</th>
                        <th className="py-2 px-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {product.variantCombinations.map((comb) => (
                        <tr key={comb.id}>
                          <td className="py-2 px-3 font-bold">
                            {Object.values(comb.attributes).join(' / ')}
                          </td>
                          <td className="py-2 px-3 font-mono text-text-muted">{comb.sku}</td>
                          <td className="py-2 px-3 font-bold">${comb.price}</td>
                          <td className="py-2 px-3">{comb.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Specifications / Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider border-b pb-3 border-gray-100 dark:border-gray-800">
                  Specifications & Attributes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {product.attributes.map((attr, i) => (
                    <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="font-bold text-gray-900 dark:text-white">{attr.name}: </span>
                      <span className="text-gray-700 dark:text-gray-300">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (1 Col) */}
          <div className="space-y-6">
            
            {/* Gallery Images */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider border-b pb-3 border-gray-100 dark:border-gray-800">
                Media Gallery ({product.images?.length || 1})
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {product.images?.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Image ${i + 1}`}
                    className="w-full aspect-square rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
                <Truck className="w-4 h-4 text-[#8b6f47]" />
                Shipping Info
              </h3>

              <div className="space-y-1.5 text-text-muted">
                <p>Weight: <span className="font-bold text-gray-900 dark:text-white">{product.shippingInfo?.weight || 0.8} kg</span></p>
                <p>Delivery Estimate: <span className="font-bold text-gray-900 dark:text-white">{product.shippingInfo?.estimate || '2-4 Days'}</span></p>
                <p>Free Shipping: <span className="font-bold text-emerald-600">{product.shippingInfo?.freeShipping ? 'Yes' : 'No'}</span></p>
              </div>
            </div>

            {/* SEO Information */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
                <Globe className="w-4 h-4 text-[#8b6f47]" />
                SEO Metadata
              </h3>

              <div className="space-y-1.5 text-text-muted">
                <p>Meta Title: <span className="font-medium text-gray-900 dark:text-white">{product.seo?.metaTitle || product.title}</span></p>
                <p className="line-clamp-2">Meta Description: <span className="font-medium text-gray-900 dark:text-white">{product.seo?.metaDescription || product.shortDescription}</span></p>
              </div>
            </div>

          </div>

        </div>

        {/* Delete Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleExecuteDelete}
          title="Delete Product?"
          message="This action cannot be undone. The product will be removed permanently from your store."
          confirmText="Delete Product"
          variant="danger"
        />

      </div>
    </AccountLayout>
  );
}
