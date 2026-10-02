'use client';

import React from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import AdminOnly from '@/components/admin/AdminOnly';
import ProductTable from '@/components/product/ProductTable';

function DashboardProductsPageContent() {
  return (
    <AccountLayout activeTabName="/dashboard">
      <ProductTable />
    </AccountLayout>
  );
}

export default function DashboardProductsPage() {
  return (
    <AdminOnly>
      <DashboardProductsPageContent />
    </AdminOnly>
  );
}
