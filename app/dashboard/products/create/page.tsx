'use client';

import React from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import AdminOnly from '@/components/admin/AdminOnly';
import ProductForm from '@/components/product/ProductForm';

function CreateProductPageContent() {
  return (
    <AccountLayout activeTabName="/dashboard">
      <ProductForm isEditMode={false} />
    </AccountLayout>
  );
}

export default function CreateProductPage() {
  return (
    <AdminOnly>
      <CreateProductPageContent />
    </AdminOnly>
  );
}
