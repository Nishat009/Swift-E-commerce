'use client';

import React from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import ProductTable from '@/components/product/ProductTable';

export default function DashboardProductsPage() {
  return (
    <AccountLayout activeTabName="/dashboard">
      <ProductTable />
    </AccountLayout>
  );
}
