'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCompareStore } from '@/stores/compareStore';
import { useCartStore } from '@/stores/cartStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import RatingStars from '@/components/ui/RatingStars';
import { X, Scale, ShoppingCart, Check, ShieldCheck, Truck, Trash2 } from 'lucide-react';

export default function CompareModal() {
  const { items, isOpen, closeCompareModal, removeFromCompare, clearCompare } = useCompareStore();
  const addItem = useCartStore((state) => state.addItem);
  const { format: formatCurrency } = useCurrencyStore();
  const toast = useToast();

  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  if (!isOpen) return null;

  // Comparison attribute rows definition
  const rows = [
    {
      key: 'price',
      label: 'Price',
      getValue: (p: any) => formatCurrency(p.price * (1 - (p.discountPercentage || 0) / 100))
    },
    {
      key: 'rating',
      label: 'Rating & Reviews',
      getValue: (p: any) => `${p.rating || 4.5} ★ (${p.reviewCount || 12} reviews)`
    },
    {
      key: 'brand',
      label: 'Brand Name',
      getValue: (p: any) => p.brand || 'SwiftCart'
    },
    {
      key: 'category',
      label: 'Category',
      getValue: (p: any) => p.category || 'General'
    },
    {
      key: 'stock',
      label: 'Stock Level',
      getValue: (p: any) => p.stock > 0 ? `${p.stock} units available` : 'Out of Stock'
    },
    {
      key: 'shipping',
      label: 'Shipping',
      getValue: (p: any) => p.shippingInfo?.freeShipping ? 'Free Shipping Eligible' : 'Standard Shipping'
    },
    {
      key: 'material',
      label: 'Material / Fabric',
      getValue: (p: any) => p.specifications?.Material || p.specifications?.Fabric || '100% Premium Material'
    },
    {
      key: 'warranty',
      label: 'Warranty',
      getValue: (p: any) => p.specifications?.Warranty || '1-Year Official Warranty'
    }
  ];

  // Filter rows if "Display differences only" is checked
  const filteredRows = showDifferencesOnly
    ? rows.filter((row) => {
        const values = items.map((p) => row.getValue(p));
        return new Set(values).size > 1; // More than 1 unique value means difference exists
      })
    : rows;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeCompareModal}
      title="Product Specifications Matrix"
      size="xl"
    >
      <div className="space-y-6 pt-2">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDifferencesOnly}
                onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
              />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Display Differences Only
              </span>
            </label>
          </div>

          <button
            onClick={clearCompare}
            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Products
          </button>
        </div>

        {/* Comparison Table Grid */}
        <div className="overflow-x-auto border rounded-2xl max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-3 w-40">Attribute</th>
                {items.map((prod) => (
                  <th key={prod.id} className="p-3 min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{prod.title}</span>
                      <button
                        onClick={() => removeFromCompare(prod.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-white dark:bg-gray-950 border">
                      <Image src={prod.thumbnail} alt={prod.title} fill className="object-cover" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-850">
                  <td className="p-3 font-bold text-gray-500 uppercase text-[10px] bg-gray-50/50 dark:bg-gray-900/50">
                    {row.label}
                  </td>
                  {items.map((prod) => (
                    <td key={prod.id} className="p-3 font-medium text-gray-800 dark:text-gray-200">
                      {row.getValue(prod)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Add to Cart Actions Row */}
              <tr>
                <td className="p-3 font-bold text-gray-500 uppercase text-[10px] bg-gray-50/50 dark:bg-gray-900/50">
                  Action
                </td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-3">
                    <Button
                      onClick={() => {
                        addItem(prod);
                        toast.success(`Added ${prod.title} to bag!`);
                      }}
                      size="sm"
                      className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white text-xs font-bold rounded-xl py-2 flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </Modal>
  );
}
