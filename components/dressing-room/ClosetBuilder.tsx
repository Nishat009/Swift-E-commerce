import React, { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import { WornItems } from '@/types/dressingRoom';
import { fashionProducts } from '@/data/fashionCatalog';
import { useAvatarStore } from '@/stores/avatarStore';
import { useCartStore } from '@/stores/cartStore';
import { Search, SlidersHorizontal, Check, RefreshCw, X, Eye, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DressRoomViewer from './DressRoomViewer';

interface ClosetBuilderProps {
  onProductSelect?: (product: Product) => void;
}

export default function ClosetBuilder({ onProductSelect }: ClosetBuilderProps) {
  const { wornItems, tryOnItem, takeOffItem, avatar } = useAvatarStore();
  const addItem = useCartStore((state) => state.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'match'>('match');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');

  // Quick View zoom states
  const [selectedProductForQuickView, setSelectedProductForQuickView] = useState<Product | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const categories = [
    { id: 'top', label: 'Tops' },
    { id: 'pants', label: 'Pants' },
    { id: 'dress', label: 'Dresses' },
    { id: 'jacket', label: 'Jackets' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'hat', label: 'Hats' },
    { id: 'bag', label: 'Bags' },
    { id: 'glasses', label: 'Glasses' },
    { id: 'jewelry', label: 'Jewelry' },
  ];

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Load products from backend (fallback to fashion Catalog data offline)
      const response = await fetchProducts({ limit: 100 });
      let allProducts = response.products || [];

      // Filter to dressing room compatible items
      const compatibilityKeys = ['top', 'pants', 'dress', 'jacket', 'shoes', 'hat', 'bag', 'glasses', 'jewelry'];
      const vdrProducts = allProducts.filter((p) =>
        compatibilityKeys.includes(p.category.toLowerCase()) || 
        (p.specifications && p.specifications['Layer'])
      );

      // Merge with premium frontend-only fashion Catalog data if not present
      const merged = [...vdrProducts];
      fashionProducts.forEach((fp) => {
        if (!merged.some((m) => String(m.id) === String(fp.id))) {
          merged.push(fp);
        }
      });

      setProducts(merged);
    } catch (err) {
      console.warn('Failed to load online products, loading default fashion Catalog:', err);
      setProducts(fashionProducts);
    } finally {
      setLoading(false);
    }
  };

  const isWorn = (product: Product): boolean => {
    const category = (getSpec(product, 'Layer') || product.category).toLowerCase() as keyof WornItems;
    const item = wornItems[category];
    return item ? String(item.id) === String(product.id) : false;
  };

  const handleProductToggle = (product: Product) => {
    const category = (getSpec(product, 'Layer') || product.category).toLowerCase() as keyof WornItems;
    
    if (isWorn(product)) {
      takeOffItem(category);
    } else {
      tryOnItem(product);
    }

    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const getSpec = (product: Product | undefined, key: string): string => {
    if (!product || !product.specifications) return '';
    return product.specifications[key] || '';
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // --- FILTERING & SORTING LOGIC ---
  const genderMatchedProducts = products.filter((p) => {
    if (genderFilter === 'all') return true;
    const prodGender = getSpec(p, 'Gender');
    if (!prodGender) return true; // Unisex fallback
    if (prodGender.toLowerCase() === 'unisex') return true;
    return prodGender.toLowerCase() === avatar.gender.toLowerCase();
  });

  const categoryFiltered = genderMatchedProducts.filter((p) => {
    const layer = (getSpec(p, 'Layer') || p.category).toLowerCase();
    return layer === selectedCategory;
  });

  const searchFiltered = categoryFiltered.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      getSpec(p, 'Material').toLowerCase().includes(q) ||
      getSpec(p, 'Color').toLowerCase().includes(q)
    );
  });

  const sortedProducts = [...searchFiltered].sort((a, b) => {
    const priceA = a.price * (1 - a.discountPercentage / 100);
    const priceB = b.price * (1 - b.discountPercentage / 100);
    if (priceSort === 'asc') return priceA - priceB;
    if (priceSort === 'desc') return priceB - priceA;
    return 0; // Default Mongoose order
  });

  const filteredProducts = sortedProducts;

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full justify-between relative">
      <div>
        {/* Filters Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          
          {/* Search bar */}
          <div className="relative flex-1 min-w-[140px]">
            <Input
              type="text"
              placeholder="Search closet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 border-gray-200 dark:border-gray-800"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Gender Filter toggle */}
            <select
              value={genderFilter}
              onChange={(e: any) => setGenderFilter(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl px-2.5 py-1.5 font-semibold text-gray-600 dark:text-gray-300"
            >
              <option value="match">Match My Avatar ({avatar.gender})</option>
              <option value="all">Show All Genders</option>
            </select>

            {/* Price sort */}
            <select
              value={priceSort}
              onChange={(e: any) => setPriceSort(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl px-2.5 py-1.5 font-semibold text-gray-600 dark:text-gray-300"
            >
              <option value="default">Sort: Default</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Tabs list */}
        <div className="flex gap-1.5 overflow-x-auto pb-3.5 mb-4 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#8b6f47] text-white dark:bg-[#c9a96b] dark:text-gray-950 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Closet Inventory Grid */}
        <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#8b6f47]" />
              <span className="text-xs">Browsing closet racks...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-gray-400 text-xs">No matching products found in this closet rack.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const worn = isWorn(product);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductToggle(product)}
                    className={`flex flex-col rounded-xl overflow-hidden border cursor-pointer bg-[#fafaf9]/20 dark:bg-gray-950/20 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group relative ${
                      worn
                        ? 'border-[#8b6f47] dark:border-[#c9a96b] bg-[#8b6f47]/5'
                        : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    {/* Image Frame */}
                    <div className="relative aspect-square bg-gray-50 dark:bg-gray-900 w-full overflow-hidden">
                      <Image
                        src={product.productImage || product.thumbnail}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 30vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                      
                      {/* Zoom magnifying button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForQuickView(product);
                        }}
                        className="absolute top-2 left-2 bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 p-1.5 rounded-full shadow-sm hover:text-[#8b6f47] dark:hover:text-[#c9a96b] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Open Dress Room Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {product.modelWearingImage && (
                        <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-[#c9a96b] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-[#c9a96b]/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Model</span>
                        </div>
                      )}

                      {worn && !product.modelWearingImage && (
                        <div className="absolute top-2 right-2 bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 p-1 rounded-full shadow-sm">
                          <Check className="w-3.5 h-3.5 font-extrabold" />
                        </div>
                      )}
                      {product.discountPercentage > 0 && (
                        <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          -{product.discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Body Specs */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                          {product.brand}
                        </span>
                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mt-0.5">
                          {product.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-3.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">
                            ${(product.price * (1 - product.discountPercentage / 100)).toFixed(0)}
                          </span>
                          {product.discountPercentage > 0 && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          worn
                            ? 'bg-[#8b6f47] text-white dark:bg-[#c9a96b] dark:text-gray-950'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {worn ? 'Worn' : 'Try On'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUICK VIEW DRESS ROOM MODAL */}
      {selectedProductForQuickView && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 overflow-hidden shadow-2xl relative my-auto">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedProductForQuickView(null);
              }}
              className="absolute top-5 right-5 p-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-full border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 z-30 transition-all cursor-pointer shadow-sm"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modular Dress Room Viewer */}
            <DressRoomViewer
              product={selectedProductForQuickView}
              showDetails={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
