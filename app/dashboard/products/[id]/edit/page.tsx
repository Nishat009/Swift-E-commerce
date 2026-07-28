'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/product/ProductForm';
import apiClient from '@/lib/apiClient';
import Loading from '@/components/ui/Loading';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
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
      const res = await apiClient.get(`/products/${productId}`);
      if (res.data?.data) {
        setProduct(res.data.data);
      } else if (res.data?.product) {
        setProduct(res.data.product);
      }
    } catch (err: any) {
      toast.error('Failed to load product details.');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-gray-500">
        Product not found.
      </div>
    );
  }

  return <ProductForm initialData={product} isEditMode={true} />;
}
