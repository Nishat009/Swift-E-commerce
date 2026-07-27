'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Check, Minus, Trash2, ArrowRight, ShieldCheck, Scale } from 'lucide-react';
import { useCompareStore } from '@/stores/compareStore';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { useCurrencyStore } from '@/stores/currencyStore';

// Concentric radar chart for side-by-side spec comparison
const RadarChart = ({ items }: { items: any[] }) => {
  const width = 280;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = 80;
  const numAxes = 5;

  const axes = [
    { label: 'Pricing Value', key: 'price' },
    { label: 'User Rating', key: 'rating' },
    { label: 'Specs Count', key: 'specs' },
    { label: 'Availability', key: 'stock' },
    { label: 'Popularity', key: 'tags' }
  ];

  // Score mapping (0 - 100)
  const getProductScores = (product: any) => {
    // Pricing Value: lower price = higher value rating
    const priceScore = Math.max(10, Math.min(100, 100 - (product.price / 1000) * 80));
    const ratingScore = Math.max(10, Math.min(100, product.rating * 20));
    const specsCount = product.specifications ? Object.keys(product.specifications).length : 0;
    const specsScore = Math.max(10, Math.min(100, specsCount * 20));
    const stockScore = Math.max(10, Math.min(100, product.stock * 1.5));
    const tagsCount = product.tags ? product.tags.length : 0;
    const tagsScore = Math.max(10, Math.min(100, tagsCount * 25));

    return {
      price: priceScore,
      rating: ratingScore,
      specs: specsScore,
      stock: stockScore,
      tags: tagsScore
    };
  };

  const getPoints = (scores: Record<string, number>) => {
    return axes.map((axis, i) => {
      const score = scores[axis.key as keyof typeof scores] || 50;
      const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
      const radius = (score / 100) * maxRadius;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { x, y };
    });
  };

  const colors = [
    { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)' },
    { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)' },
    { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.12)' }
  ];

  return (
    <div className="flex flex-col items-center p-5 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 mb-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b] mb-4">
        📊 Multi-Dimension Vector Value Radar
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl justify-center">
        {/* SVG Graphic */}
        <svg width={width} height={height} className="overflow-visible select-none">
          {/* Concentric grid lines */}
          {[20, 40, 60, 80, 100].map((percent) => {
            const radius = (percent / 100) * maxRadius;
            const points = Array.from({ length: numAxes }).map((_, i) => {
              const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
              const x = cx + radius * Math.cos(angle);
              const y = cy + radius * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={percent}
                points={points}
                fill="none"
                stroke="rgba(156, 163, 175, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Spokes */}
          {axes.map((axis, i) => {
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const endX = cx + maxRadius * Math.cos(angle);
            const endY = cy + maxRadius * Math.sin(angle);
            
            const labelDist = maxRadius + 18;
            const labelX = cx + labelDist * Math.cos(angle);
            const labelY = cy + labelDist * Math.sin(angle);

            return (
              <g key={i}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={endX}
                  y2={endY}
                  stroke="rgba(156, 163, 175, 0.2)"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="text-[9px] font-sans font-bold fill-gray-400 dark:fill-gray-500"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {/* Polygons */}
          {items.map((product, idx) => {
            const scores = getProductScores(product);
            const pts = getPoints(scores);
            const pointsString = pts.map(p => `${p.x},${p.y}`).join(' ');
            const color = colors[idx % colors.length];

            return (
              <g key={product.id}>
                <polygon
                  points={pointsString}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                {pts.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill={color.stroke}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2 text-xs text-left w-full sm:w-56">
          {items.map((product, idx) => {
            const color = colors[idx % colors.length];
            return (
              <div key={product.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border rounded-xl shadow-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color.stroke }}
                />
                <div className="truncate">
                  <p className="font-bold text-gray-900 dark:text-white truncate leading-none">{product.title}</p>
                  <p className="text-[9px] text-text-muted mt-1 truncate uppercase tracking-wider">{product.brand}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function CompareModal() {
  const { items, isOpen, closeCompareModal, removeFromCompare, clearCompare } = useCompareStore();
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();
  const { format: formatPrice } = useCurrencyStore();

  if (!isOpen || items.length === 0) return null;

  // Gather all unique specification keys across all products
  const allSpecKeys = Array.from(
    new Set(
      items.flatMap((p) => (p.specifications ? Object.keys(p.specifications) : []))
    )
  );

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`Added ${product.title} to cart!`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCompareModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-gray-150 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900 dark:text-white">
                  Product Comparison ({items.length}/3)
                </h2>
                <p className="text-xs text-text-muted">
                  Side-by-side feature and technical specification matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
              <button
                onClick={closeCompareModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Matrix Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
            <RadarChart items={items} />
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-44 p-4 text-xs font-black uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    Product Summary
                  </th>
                  {items.map((product) => (
                    <th
                      key={product.id}
                      className="p-4 border-b border-gray-100 dark:border-gray-800 min-w-[220px] align-top"
                    >
                      <div className="relative group bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="relative w-24 h-24 mb-3 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs">
                          <Image
                            src={product.thumbnail || product.images?.[0] || ''}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-0.5">
                          {product.brand}
                        </span>

                        <Link
                          href={`/product/${product.id}`}
                          onClick={closeCompareModal}
                          className="text-xs font-serif font-bold text-gray-900 dark:text-white hover:text-[#8b6f47] line-clamp-1 mb-1"
                        >
                          {product.title}
                        </Link>

                        <div className="text-sm font-bold text-[#8b6f47] dark:text-[#c9a96b] mb-3">
                           {formatPrice(product.price)}
                           {product.salePrice && (
                             <span className="text-xs text-gray-400 line-through ml-1.5 font-normal">
                               {formatPrice(product.salePrice)}
                             </span>
                           )}
                         </div>

                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {/* Rating & Reviews */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Rating & Reviews
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span>{product.rating.toFixed(1)}</span>
                        <span className="text-gray-400 font-normal">
                          ({product.reviewCount || 12} reviews)
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock & Availability */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Stock & Availability
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>In Stock ({product.totalStock || product.stock} available)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg text-[11px]">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Category & Brand */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Category & Brand
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4 text-gray-700 dark:text-gray-300">
                      <span className="capitalize font-medium">{product.category}</span> by{' '}
                      <span className="font-bold text-gray-900 dark:text-white">{product.brand}</span>
                    </td>
                  ))}
                </tr>

                {/* Badges & Tags */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Badges & Tags
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] font-bold text-[10px] rounded-md"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 font-normal">Standard Item</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specifications Rows */}
                {allSpecKeys.map((specKey) => (
                  <tr key={specKey}>
                    <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                      {specKey}
                    </td>
                    {items.map((product) => {
                      const value = product.specifications?.[specKey];
                      return (
                        <td key={product.id} className="p-4 text-gray-700 dark:text-gray-300">
                          {value ? (
                            <span className="font-medium">{value}</span>
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Shipping & Returns */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Shipping & Guarantee
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{product.shippingInfo?.freeShipping ? 'Free Delivery' : 'Standard Shipping'}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {product.shippingInfo?.estimate || '2-4 Business Days'}
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex justify-between items-center">
            <span className="text-xs text-text-muted">
              Click any product title above to view full product details page.
            </span>
            <Button
              variant="outline"
              onClick={closeCompareModal}
              className="rounded-full text-xs font-bold px-5 py-2"
            >
              Close Comparison
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
