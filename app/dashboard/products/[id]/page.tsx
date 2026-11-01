'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminOnly from '@/components/admin/AdminOnly';
import AdminFrame from '@/components/admin/AdminFrame';
import { AdminButton, AdminEmpty, Panel, Pill, StatCard, adminCard, table } from '@/components/admin/AdminUI';
import { productService } from '@/services/productService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Edit2,
  Copy,
  Archive,
  Trash2,
  Package,
  DollarSign,
  Star,
  ExternalLink,
  Loader2,
  PackageX,
  CircleCheck,
  ImageIcon,
} from 'lucide-react';

const frameProps = { active: 'products' as const, backHref: '/admin?tab=products', backLabel: 'All products' };

const money = (n: unknown) => `$${(Number(n) || 0).toFixed(2)}`;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-stone-900 dark:text-stone-100">{children}</dd>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { published: 'Published', draft: 'Draft', archived: 'Archived' };

function ProductStatusPill({ status }: { status?: string }) {
  if (status === 'published') return <Pill tone="success" dot>Published</Pill>;
  if (status === 'draft') return <Pill tone="neutral" dot>Draft</Pill>;
  return <Pill tone="violet" dot>Archived</Pill>;
}

function ProductDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
      toast.error(err?.message || 'Failed to load product details.');
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleDuplicate = async () => {
    if (!product) return;
    try {
      const dup = await productService.duplicateProduct(product.id);
      if (dup) {
        toast.success('Product duplicated successfully!');
        router.push(`/dashboard/products/${dup.id}/edit`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate product.');
    }
  };

  const handleToggleArchive = async () => {
    if (!product) return;
    try {
      const newStatus = product.status === 'archived' ? 'published' : 'archived';
      await productService.updateProduct(product.id, { status: newStatus });
      toast.success(`Product status updated to ${newStatus}.`);
      loadProduct();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
    }
  };

  const handleExecuteDelete = async () => {
    if (!product) return;
    try {
      await productService.deleteProduct(product.id);
      toast.success('Product removed from the store (archived).');
      setIsDeleteModalOpen(false);
      router.push('/dashboard/products');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product.');
    }
  };

  if (loading) {
    return (
      <AdminFrame {...frameProps} title="Product">
        <div className={`${adminCard} flex items-center justify-center gap-2 px-6 py-16 text-sm text-stone-500 dark:text-stone-400`} role="status">
          <Loader2 className="size-4 animate-spin" />
          Loading product...
        </div>
      </AdminFrame>
    );
  }

  if (!product) {
    return (
      <AdminFrame {...frameProps} title="Product not found">
        <div className={adminCard}>
          <AdminEmpty
            icon={PackageX}
            title="Product not found"
            description="It may have been removed, or the link is wrong."
            action={
              <Link href="/admin?tab=products">
                <AdminButton tabIndex={-1}>Back to products</AdminButton>
              </Link>
            }
          />
        </div>
      </AdminFrame>
    );
  }

  const primaryImage = product.images?.[0] || product.thumbnail || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const discountPct = product.discountPercentage || (product.originalPrice && product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);
  const hasOriginalPrice = Number(product.originalPrice) > 0 && Number(product.originalPrice) > Number(product.price);
  const lowStockLimit = product.lowStockThreshold || 10;
  const stockTone = product.stock <= 0 ? 'danger' : product.stock <= lowStockLimit ? 'warning' : 'success';
  const stockLabel = product.stock <= 0 ? 'Out of stock' : product.stock <= lowStockLimit ? 'Low stock' : 'In stock';

  return (
    <AdminFrame
      {...frameProps}
      title={product.title || product.name || 'Product'}
      description={`SKU ${product.sku || product.SKU || 'N/A'} · ID ${product.id}`}
      actions={
        <>
          <Link href={`/product/${product.id}`} target="_blank" title="Open the storefront page in a new tab">
            <AdminButton variant="ghost" tabIndex={-1}>
              <ExternalLink className="size-4" /> View in store
            </AdminButton>
          </Link>
          <AdminButton onClick={handleDuplicate}>
            <Copy className="size-4" /> Duplicate
          </AdminButton>
          <AdminButton onClick={handleToggleArchive}>
            <Archive className="size-4" /> {product.status === 'archived' ? 'Unarchive' : 'Archive'}
          </AdminButton>
          <AdminButton variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </AdminButton>
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <AdminButton variant="primary" tabIndex={-1}>
              <Edit2 className="size-4" /> Edit
            </AdminButton>
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Selling price"
            icon={DollarSign}
            value={<span className="tabular-nums">{money(product.price)}</span>}
            hint={hasOriginalPrice ? `Was ${money(product.originalPrice)}${discountPct > 0 ? ` · ${discountPct}% off` : ''}` : discountPct > 0 ? `${discountPct}% off` : 'No discount'}
          />
          <StatCard
            label="Stock"
            icon={Package}
            value={<span className="tabular-nums">{product.stock}</span>}
            hint={<Pill tone={stockTone} dot>{stockLabel}</Pill>}
          />
          <StatCard
            label="Status"
            icon={CircleCheck}
            value={STATUS_LABEL[product.status || ''] || 'Archived'}
            hint={product.visibility ? `Visibility: ${product.visibility}` : undefined}
          />
          <StatCard
            label="Rating"
            icon={Star}
            value={<span className="tabular-nums">{product.rating || 4.8}</span>}
            hint={`${product.reviewCount || 12} reviews`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Overview">
              <div className="flex flex-col gap-5 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryImage}
                  alt={product.title}
                  className="aspect-square w-full shrink-0 rounded-lg border border-line bg-stone-100 object-cover dark:bg-white/5 sm:w-40"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ProductStatusPill status={product.status} />
                    <Pill className="capitalize">{product.category}</Pill>
                    {product.subcategory && <Pill className="capitalize">{product.subcategory}</Pill>}
                  </div>
                  <p className="text-sm leading-relaxed text-stone-600 line-clamp-4 dark:text-stone-300">
                    {product.shortDescription || product.description}
                  </p>
                  <dl className="grid grid-cols-2 gap-4 border-t border-line pt-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-stone-500 dark:text-stone-400">Brand</dt>
                      <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">{product.brand || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500 dark:text-stone-400">Created</dt>
                      <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500 dark:text-stone-400">SKU</dt>
                      <dd className="mt-0.5 truncate font-mono text-xs font-medium text-stone-900 dark:text-stone-100">{product.sku || product.SKU || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Panel title="Pricing">
                <dl className="divide-y divide-line">
                  <DetailRow label="Selling price">
                    <span className="tabular-nums">{money(product.price)}</span>
                  </DetailRow>
                  {hasOriginalPrice && (
                    <DetailRow label="Original price">
                      <span className="font-normal tabular-nums text-stone-500 line-through">{money(product.originalPrice)}</span>
                    </DetailRow>
                  )}
                  {discountPct > 0 && (
                    <DetailRow label="Discount">
                      <span className="text-red-600 dark:text-red-400">{discountPct}% off</span>
                    </DetailRow>
                  )}
                  {Number(product.costPrice) > 0 && (
                    <DetailRow label="Unit cost">
                      <span className="tabular-nums">{money(product.costPrice)}</span>
                    </DetailRow>
                  )}
                </dl>
              </Panel>

              <Panel title="Inventory">
                <dl className="divide-y divide-line">
                  <DetailRow label="Stock quantity">
                    <span className="tabular-nums">{product.stock} units</span>
                  </DetailRow>
                  <DetailRow label="Reserved">
                    <span className="tabular-nums">{product.reservedStock || 0} units</span>
                  </DetailRow>
                  <DetailRow label="Warehouse">{product.warehouse || 'Main Warehouse'}</DetailRow>
                </dl>
              </Panel>
            </div>

            {product.variantCombinations && product.variantCombinations.length > 0 && (
              <Panel title="Variants" description={`${product.variantCombinations.length} combinations`} bodyClassName="p-0">
                <div className="overflow-x-auto">
                  <table className={table.table}>
                    <thead className={table.thead}>
                      <tr>
                        <th className={table.th}>Variant</th>
                        <th className={table.th}>SKU</th>
                        <th className={`${table.th} text-right`}>Price</th>
                        <th className={`${table.th} text-right`}>Stock</th>
                      </tr>
                    </thead>
                    <tbody className={table.tbody}>
                      {product.variantCombinations.map((comb) => (
                        <tr key={comb.id} className={table.tr}>
                          <td className={`${table.td} font-medium text-stone-900 dark:text-stone-100`}>
                            {Object.values(comb.attributes).join(' / ')}
                          </td>
                          <td className={`${table.td} font-mono text-xs text-stone-500 dark:text-stone-400`}>{comb.sku}</td>
                          <td className={`${table.td} text-right font-medium tabular-nums text-stone-900 dark:text-white`}>{money(comb.price)}</td>
                          <td className={`${table.td} text-right tabular-nums text-stone-700 dark:text-stone-300`}>{comb.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {product.attributes && product.attributes.length > 0 && (
              <Panel title="Specifications">
                <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {product.attributes.map((attr, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm">
                      <dt className="text-stone-500 dark:text-stone-400">{attr.name}</dt>
                      <dd className="text-right font-medium text-stone-900 dark:text-stone-100">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            )}
          </div>

          <div className="space-y-6">
            <Panel title="Media" description={`${product.images?.length || 1} ${(product.images?.length || 1) === 1 ? 'image' : 'images'}`}>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="aspect-square w-full rounded-lg border border-line bg-stone-100 object-cover dark:bg-white/5"
                    />
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                  <ImageIcon className="size-4" /> No gallery images.
                </p>
              )}
            </Panel>

            <Panel title="Shipping">
              <dl className="divide-y divide-line">
                <DetailRow label="Weight">
                  <span className="tabular-nums">{product.shippingInfo?.weight || 0.8} kg</span>
                </DetailRow>
                <DetailRow label="Delivery estimate">{product.shippingInfo?.estimate || '2-4 Days'}</DetailRow>
                <DetailRow label="Free shipping">
                  {product.shippingInfo?.freeShipping ? <Pill tone="success">Yes</Pill> : <Pill>No</Pill>}
                </DetailRow>
              </dl>
            </Panel>

            <Panel title="SEO">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-stone-500 dark:text-stone-400">Meta title</dt>
                  <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">{product.seo?.metaTitle || product.title}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500 dark:text-stone-400">Meta description</dt>
                  <dd className="mt-0.5 text-stone-700 line-clamp-3 dark:text-stone-300">{product.seo?.metaDescription || product.shortDescription || '-'}</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Delete this product?"
        message="It is removed from the store and archived. Past orders keep their history."
        confirmText="Delete product"
        variant="danger"
      />
    </AdminFrame>
  );
}

export default function ProductDetailPage() {
  return (
    <AdminOnly>
      <ProductDetailPageContent />
    </AdminOnly>
  );
}
