'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { fetchProducts, fetchCategories } from '@/lib/api';
import { Product } from '@/types';
import { LoadingSkeleton } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { Grid, List, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { motion, AnimatePresence } from 'framer-motion';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Mobile Filters Drawer State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('search') || ''
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'default'>('default');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const productsPerPage = 12;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, searchQuery, priceRange, sortBy, selectedColors, selectedSizes]);

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * productsPerPage;
      const params: any = {
        limit: productsPerPage,
        skip,
      };

      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (sortBy !== 'default') params.sortBy = sortBy;
      
      params.priceMin = priceRange[0];
      params.priceMax = priceRange[1];

      if (selectedColors.length > 0) params.color = selectedColors.join(',');
      if (selectedSizes.length > 0) params.size = selectedSizes.join(',');

      const data = await fetchProducts(params);
      
      setProducts(data.products);
      setTotalProducts(data.total);
      setTotalPages(Math.ceil(data.total / productsPerPage));
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 500);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // Compute Active Filters Count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 2000) count++;
    if (searchQuery !== '') count++;
    count += selectedColors.length;
    count += selectedSizes.length;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 2000]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Renders the filter controls (Sidebar/Drawer content)
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Category
        </h3>
        <div className="space-y-2">
          <label className="flex items-center text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="category"
              value="all"
              checked={selectedCategory === 'all'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mr-2"
            />
            <span>All Products</span>
          </label>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={selectedCategory === cat}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="mr-2"
              />
              <span className="capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Price Range
        </h3>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="2000"
            value={priceRange[1]}
            onChange={(e) =>
              handlePriceRangeChange([priceRange[0], parseInt(e.target.value)])
            }
            className="w-full cursor-pointer accent-[#8b6f47]"
          />
          <div className="flex justify-between text-[10px] font-bold text-text-muted">
            <span>${priceRange[0]}</span>
            <span>Up to ${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Color Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Color
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {['Beige', 'Blue', 'Grey', 'Pink', 'Black', 'Brown', 'White', 'Green'].map((color) => {
            const isChecked = selectedColors.includes(color);
            return (
              <label key={color} className="flex items-center cursor-pointer text-xs text-gray-700 dark:text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    if (isChecked) {
                      setSelectedColors(selectedColors.filter((c) => c !== color));
                    } else {
                      setSelectedColors([...selectedColors, color]);
                    }
                    setCurrentPage(1);
                  }}
                  className="mr-2 rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span className="capitalize">{color}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {['S', 'M', 'L', 'XL'].map((size) => {
            const isChecked = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  if (isChecked) {
                    setSelectedSizes(selectedSizes.filter((s) => s !== size));
                  } else {
                    setSelectedSizes([...selectedSizes, size]);
                  }
                  setCurrentPage(1);
                }}
                className={`h-8 w-8 text-xs font-bold rounded-lg border transition-all ${
                  isChecked
                    ? 'bg-[#8b6f47] text-white border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Sort By
        </h3>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs focus:outline-none"
        >
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800 rounded-[32px] p-6 sticky top-24 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-5">
              <h2 className="text-sm font-serif font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Filters
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[9px] font-bold text-red-500 hover:underline"
                >
                  Clear All ({activeFiltersCount})
                </button>
              )}
            </div>
            {renderFilterControls()}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white capitalize">
                {selectedCategory === 'all' ? 'All Products' : selectedCategory}
              </h1>
              <p className="text-xs text-text-muted mt-1">
                {totalProducts} products found {searchQuery && `for "${searchQuery}"`}
              </p>
            </div>
            
            {/* View Mode controls & Mobile toggle */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              
              {/* Mobile slide-out toggle button */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex lg:hidden items-center justify-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold bg-[#faf9f6] dark:bg-gray-850 hover:bg-gray-50 text-gray-700 dark:text-gray-300"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters ({activeFiltersCount})</span>
              </button>

              <input
                type="text"
                placeholder="Refine search..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-250 dark:border-gray-700 rounded-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none"
              />

              <div className="flex border border-gray-250 dark:border-gray-700 rounded-full overflow-hidden bg-white dark:bg-gray-950">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#8b6f47] text-white' : 'bg-transparent text-gray-500'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition ${viewMode === 'list' ? 'bg-[#8b6f47] text-white' : 'bg-transparent text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-[#faf9f6] dark:bg-gray-850 p-3 rounded-2xl border border-gray-150/40 dark:border-gray-800">
              <span className="text-[9px] font-black uppercase text-text-muted mr-1">Active:</span>
              
              {/* Category chip */}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold">
                  <span className="capitalize">{selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Price range chip */}
              {(priceRange[0] !== 0 || priceRange[1] !== 2000) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold">
                  <span>Under ${priceRange[1]}</span>
                  <button onClick={() => setPriceRange([0, 2000])}><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Search query chip */}
              {searchQuery !== '' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Colors chips */}
              {selectedColors.map((color) => (
                <span key={color} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold">
                  <span>{color}</span>
                  <button onClick={() => setSelectedColors(selectedColors.filter((c) => c !== color))}><X className="w-3 h-3" /></button>
                </span>
              ))}

              {/* Sizes chips */}
              {selectedSizes.map((size) => (
                <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold">
                  <span>{size}</span>
                  <button onClick={() => setSelectedSizes(selectedSizes.filter((s) => s !== size))}><X className="w-3 h-3" /></button>
                </span>
              ))}

              <button
                onClick={clearAllFilters}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-auto px-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-xs font-bold text-red-650">
              {error}
            </div>
          )}

          {/* Products listings / grid */}
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-150/40 dark:border-gray-800 text-center">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                No products found matching your current filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline mt-2 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} index={idx} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-Out Filters Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Drawer layout */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 p-6 overflow-y-auto lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between border-b pb-3 mb-5">
                <h2 className="text-sm font-serif font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Refine Results
                </h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                {renderFilterControls()}
              </div>

              {activeFiltersCount > 0 && (
                <div className="pt-6 border-t mt-6 flex justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { clearAllFilters(); setIsMobileFiltersOpen(false); }}
                    className="flex-1 rounded-full text-xs font-bold py-2"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold text-xs py-2"
                  >
                    Show Results
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
