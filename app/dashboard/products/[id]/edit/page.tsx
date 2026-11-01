'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Loader2, PackageX } from 'lucide-react';
import AdminOnly from '@/components/admin/AdminOnly';
import AdminFrame from '@/components/admin/AdminFrame';
import { AdminButton, AdminEmpty, adminCard } from '@/components/admin/AdminUI';
import ProductForm from '@/components/product/ProductForm';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';

const frameProps = { active: 'products' as const, backHref: '/admin?tab=products', backLabel: 'All products' };

function EditProductPageContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <AdminFrame {...frameProps} title="Edit product">
        <div className={`${adminCard} flex items-center justify-center gap-2 px-6 py-16 text-sm text-stone-500 dark:text-stone-400`} role="status">
          <Loader2 className="size-4 animate-spin" />
          Loading product...
        </div>
      </AdminFrame>
    );
  }

  if (!product) {
    return (
      <AdminFrame {...frameProps} title="Edit product">
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

  return (
    <AdminFrame
      {...frameProps}
      title="Edit product"
      description={product.title || product.name}
      actions={
        <Link href={`/product/${product.id}`} target="_blank">
          <AdminButton tabIndex={-1}>
            <ExternalLink className="size-4" /> View in store
          </AdminButton>
        </Link>
      }
    >
      <ProductForm initialData={product} isEditMode={true} />
    </AdminFrame>
  );
}

export default function EditProductPage() {
  return (
    <AdminOnly>
      <EditProductPageContent />
    </AdminOnly>
  );
}
