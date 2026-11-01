'use client';

import React from 'react';
import AdminOnly from '@/components/admin/AdminOnly';
import AdminFrame from '@/components/admin/AdminFrame';
import { adminCard } from '@/components/admin/AdminUI';
import ProductTable from '@/components/product/ProductTable';

function DashboardProductsPageContent() {
  return (
    <AdminFrame active="products" title="Products" description="Add and edit products, prices, stock and visibility.">
      <div className={`${adminCard} p-4 sm:p-6`}>
        <ProductTable />
      </div>
    </AdminFrame>
  );
}

export default function DashboardProductsPage() {
  return (
    <AdminOnly>
      <DashboardProductsPageContent />
    </AdminOnly>
  );
}
