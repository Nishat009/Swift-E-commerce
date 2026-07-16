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
                        src={product.thumbnail}
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
                        title="Zoom Detail View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {worn && (
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

      {/* QUICK VIEW ZOOM MODAL */}
      {selectedProductForQuickView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedProductForQuickView(null);
                setIsZoomed(false);
              }}
              className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-900 text-gray-550 hover:text-gray-800 dark:hover:text-gray-200 z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Interactive Zoom Canvas */}
            <div className="md:w-1/2 relative bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 border-r border-gray-100 dark:border-gray-900 min-h-[300px]">
              <div
                className="relative w-full h-72 rounded-2xl overflow-hidden cursor-zoom-in group/zoom shadow-inner"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleImageMouseMove}
              >
                <Image
                  src={selectedProductForQuickView.thumbnail}
                  alt={selectedProductForQuickView.title}
                  fill
                  className="object-cover transition-transform duration-300"
                  style={
                    isZoomed
                      ? {
                          transform: 'scale(2.5)',
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                        }
                      : {}
                  }
                />
                {!isZoomed && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover/zoom:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white text-[9px] py-1.5 px-3 rounded-full font-bold">Hover to Magnify Fabric</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Spec Sheet */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {selectedProductForQuickView.brand}
                </span>
                <h3 className="font-serif text-base font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2">
                  {selectedProductForQuickView.title}
                </h3>
                
                {/* Pricing */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">
                    ${(selectedProductForQuickView.price * (1 - selectedProductForQuickView.discountPercentage / 100)).toFixed(0)}
                  </span>
                  {selectedProductForQuickView.discountPercentage > 0 && (
                    <span className="text-xs text-gray-450 line-through">
                      ${selectedProductForQuickView.price}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed mb-4">
                  {selectedProductForQuickView.description}
                </p>

                {/* Specs map */}
                <div className="space-y-2 border-t border-gray-150 dark:border-gray-800 pt-4">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400 font-semibold">Material Layer</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold capitalize">{getSpec(selectedProductForQuickView, 'Layer') || selectedProductForQuickView.category}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400 font-semibold">Color Shade</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold flex items-center gap-1.5">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: getSpec(selectedProductForQuickView, 'SvgColor') || '#ccc' }}
                      />
                      {getSpec(selectedProductForQuickView, 'Color') || 'Multi'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400 font-semibold">Fabric Type</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold capitalize">{getSpec(selectedProductForQuickView, 'Material') || 'Cotton/Polyester'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    handleProductToggle(selectedProductForQuickView);
                    setSelectedProductForQuickView(null);
                    setIsZoomed(false);
                  }}
                  variant={isWorn(selectedProductForQuickView) ? 'outline' : 'primary'}
                  className="flex-1 text-xs py-2.5 rounded-xl font-bold"
                >
                  {isWorn(selectedProductForQuickView) ? 'Take Off' : 'Try On Avatar'}
                </Button>
                <Button
                  onClick={() => {
                    addItem(selectedProductForQuickView, 1);
                    alert(`Added ${selectedProductForQuickView.title} to shopping bag!`);
                  }}
                  variant="secondary"
                  className="flex-1 text-xs py-2.5 rounded-xl font-bold bg-[#8b6f47] text-white hover:bg-[#725a38] border-0"
                >
                  Add to Bag
                </Button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
