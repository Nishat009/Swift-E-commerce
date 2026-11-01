'use client';

import React from 'react';
import AdminOnly from '@/components/admin/AdminOnly';
import AdminFrame from '@/components/admin/AdminFrame';
import ProductForm from '@/components/product/ProductForm';

function CreateProductPageContent() {
  return (
    <AdminFrame
      active="products"
      title="Add product"
      description="Fill in the details, then save it as a draft or publish it to the store."
      backHref="/admin?tab=products"
      backLabel="All products"
    >
      <ProductForm isEditMode={false} />
    </AdminFrame>
  );
}

export default function CreateProductPage() {
  return (
    <AdminOnly>
      <CreateProductPageContent />
    </AdminOnly>
  );
}
