'use client';

import React from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import ProductForm from '@/components/product/ProductForm';

export default function CreateProductPage() {
  return (
    <AccountLayout activeTabName="/dashboard">
      <ProductForm isEditMode={false} />
    </AccountLayout>
  );
}
