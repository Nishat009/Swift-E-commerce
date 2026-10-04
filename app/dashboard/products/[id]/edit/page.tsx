'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AccountLayout from '@/components/layout/AccountLayout';
import AdminOnly from '@/components/admin/AdminOnly';
import ProductForm from '@/components/product/ProductForm';
import { productService } from '@/services/productService';
import Loading from '@/components/ui/Loading';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';

function EditProductPageContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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
      toast.error(err?.message || 'Failed to load product details.');
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
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

  return (
    <AccountLayout activeTabName="/dashboard">
      <ProductForm initialData={product} isEditMode={true} />
    </AccountLayout>
  );
}

export default function EditProductPage() {
  return (
    <AdminOnly>
      <EditProductPageContent />
    </AdminOnly>
  );
}
