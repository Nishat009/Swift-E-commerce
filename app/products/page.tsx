'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import Image from 'next/image';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockData';
import { normalizeProduct } from '@/utils/productUtils';
import { LoadingSkeleton } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { Grid, List, ChevronLeft, ChevronRight, SlidersHorizontal, X, Search, RotateCcw, Filter, Check, Tag } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp: number[][] = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 1; j <= b.length; j++) {
    tmp[0].push(j);
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // All catalog products (normalized for fallback & live facet count calculation)
  const allCatalogProducts = useMemo(() => mockProducts.map(normalizeProduct), []);

  // Filter State initialized from URL query params
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 2000,
  ]);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'default');
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get('color') ? searchParams.get('color')!.split(',') : []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get('size') ? searchParams.get('size')!.split(',') : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tag') ? searchParams.get('tag')!.split(',') : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('brand') ? searchParams.get('brand')!.split(',') : []
  );

  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Search Suggestions and a11y Focus Trap States
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);
  const [originalSearchQuery, setOriginalSearchQuery] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('swiftcart_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, []);

  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return { categories: [], brands: [], products: [] };
    const q = searchInput.toLowerCase();
    
    const matchedCats: string[] = [];
    const matchedBrands: string[] = [];
    const matchedProds: Product[] = [];
    
    allCatalogProducts.forEach((p) => {
      if (p.category && p.category.toLowerCase().includes(q) && !matchedCats.includes(p.category)) {
        matchedCats.push(p.category);
      }
      if (p.brand && p.brand.toLowerCase().includes(q) && !matchedBrands.includes(p.brand)) {
        matchedBrands.push(p.brand);
      }
      if (p.title && p.title.toLowerCase().includes(q)) {
        matchedProds.push(p);
      }
    });
    
    return {
      categories: matchedCats.slice(0, 3),
      brands: matchedBrands.slice(0, 3),
      products: matchedProds.slice(0, 5),
    };
  }, [searchInput, allCatalogProducts, allCatalogProducts]);

  // A11y Focus Trap inside Mobile Filters Drawer
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const drawerElement = document.querySelector('.fixed.left-0.w-80') as HTMLDivElement;
    if (!drawerElement) return;

    const focusableElements = drawerElement.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    firstFocusable?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFiltersOpen]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const productsPerPage = 12;

  // Persist & Retrieve ViewMode from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('swiftcart_view_mode');
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView);
    } else if (searchParams.get('view') === 'list') {
      setViewMode('list');
    }
  }, [searchParams]);

  const handleViewModeToggle = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('swiftcart_view_mode', mode);
  };

  // Synchronize state changes to URL SearchParams
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
    if (priceRange[1] < 2000) params.set('maxPrice', String(priceRange[1]));
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (selectedColors.length > 0) params.set('color', selectedColors.join(','));
    if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
    if (selectedTags.length > 0) params.set('tag', selectedTags.join(','));
    if (selectedBrands.length > 0) params.set('brand', selectedBrands.join(','));
    if (currentPage > 1) params.set('page', String(currentPage));
    if (viewMode === 'list') params.set('view', 'list');

    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(targetPath, { scroll: false });
  }, [selectedCategory, searchQuery, priceRange, sortBy, selectedColors, selectedSizes, selectedTags, selectedBrands, currentPage, viewMode, pathname, router]);

  // Debounced 300ms search query handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchHandler = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
      if (query.trim()) {
        const clean = query.trim();
        const stored = localStorage.getItem('swiftcart_recent_searches') || '[]';
        let recent: string[] = [];
        try {
          recent = JSON.parse(stored);
        } catch {
          recent = [];
        }
        const nextList = [clean, ...recent.filter((q) => q !== clean)].slice(0, 5);
        setRecentSearches(nextList);
        localStorage.setItem('swiftcart_recent_searches', JSON.stringify(nextList));
      }
    }, 300),
    []
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearchHandler(value);
  };

  // Fetch / Filter products (Server API call with client-side fallback)
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let activeQuery = searchQuery;
      let matchedSuggestion: string | null = null;
      let originalQueryToKeep: string | null = null;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        // Check if query yields any matches in titles, categories, or brands
        const directMatches = allCatalogProducts.some((p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );

        if (!directMatches) {
          // Collect candidates
          const candidates = new Set<string>();
          allCatalogProducts.forEach((p) => {
            candidates.add(p.category.toLowerCase());
            candidates.add(p.brand.toLowerCase());
            p.title.split(' ').forEach((w) => {
              const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (clean.length > 2) candidates.add(clean);
            });
            p.tags?.forEach((t) => candidates.add(t.toLowerCase()));
          });

          let minDistance = 999;
          let closestWord = '';

          candidates.forEach((word) => {
            const dist = getLevenshteinDistance(q, word);
            if (dist < minDistance && dist <= 2) {
              minDistance = dist;
              closestWord = word;
            }
          });

          if (closestWord) {
            matchedSuggestion = closestWord;
            originalQueryToKeep = searchQuery;
            activeQuery = closestWord; // search matching products for suggestions instead!
          }
        }
      }

      setTypoSuggestion(matchedSuggestion);
      setOriginalSearchQuery(originalQueryToKeep);

      const skip = (currentPage - 1) * productsPerPage;
      const apiParams: any = {
        limit: productsPerPage,
        skip,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
      };

      if (selectedCategory !== 'all') apiParams.category = selectedCategory;
      if (activeQuery) apiParams.search = activeQuery;
      if (sortBy !== 'default') apiParams.sortBy = sortBy;
      if (selectedColors.length > 0) apiParams.color = selectedColors.join(',');
      if (selectedSizes.length > 0) apiParams.size = selectedSizes.join(',');

      const res = await fetchProducts(apiParams);
      if (res && res.products && Array.isArray(res.products)) {
        let fetched = res.products.map(normalizeProduct);

        // Further client-side filtering for tags & brands if requested
        if (selectedTags.length > 0) {
          fetched = fetched.filter((p) => selectedTags.some((t) => p.tags?.includes(t)));
        }
        if (selectedBrands.length > 0) {
          fetched = fetched.filter((p) => selectedBrands.includes(p.brand));
        }

        setProducts(fetched);
        setTotalProducts(res.total || fetched.length);
        setTotalPages(Math.ceil((res.total || fetched.length) / productsPerPage) || 1);
      } else {
        throw new Error('Invalid product payload structure');
      }
    } catch (err) {
      console.warn('Backend API connection failed, executing client-side filtering fallback:', err);
      // Client-side fallback filter logic on mock catalog
      let filtered = [...allCatalogProducts];

      let activeQuery = searchQuery;
      let matchedSuggestion: string | null = null;
      let originalQueryToKeep: string | null = null;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        // Check matches
        const directMatches = filtered.some((p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );

        if (!directMatches) {
          const candidates = new Set<string>();
          filtered.forEach((p) => {
            candidates.add(p.category.toLowerCase());
            candidates.add(p.brand.toLowerCase());
            p.title.split(' ').forEach((w) => {
              const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (clean.length > 2) candidates.add(clean);
            });
            p.tags?.forEach((t) => candidates.add(t.toLowerCase()));
          });

          let minDistance = 999;
          let closestWord = '';

          candidates.forEach((word) => {
            const dist = getLevenshteinDistance(q, word);
            if (dist < minDistance && dist <= 2) {
              minDistance = dist;
              closestWord = word;
            }
          });

          if (closestWord) {
            matchedSuggestion = closestWord;
            originalQueryToKeep = searchQuery;
            activeQuery = closestWord;
          }
        }
      }

      setTypoSuggestion(matchedSuggestion);
      setOriginalSearchQuery(originalQueryToKeep);

      if (selectedCategory !== 'all') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
      }
      if (activeQuery) {
        const q = activeQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

      if (selectedColors.length > 0) {
        filtered = filtered.filter((p) =>
          selectedColors.some((c) => {
            const specColor = p.specifications?.Color || '';
            const specColorName = p.specifications?.ColorName || '';
            const hasVariantColor = p.variants?.some((v) =>
              v.options.some((opt) => opt.value.toLowerCase() === c.toLowerCase())
            );
            return specColor.toLowerCase().includes(c.toLowerCase()) || specColorName.toLowerCase().includes(c.toLowerCase()) || hasVariantColor;
          })
        );
      }

      if (selectedSizes.length > 0) {
        filtered = filtered.filter((p) =>
          selectedSizes.some((s) => {
            const specSizes = p.specifications?.Sizes || '';
            const hasVariantSize = p.variants?.some((v) =>
              v.options.some((opt) => opt.value.toUpperCase() === s.toUpperCase())
            );
            return specSizes.toUpperCase().includes(s.toUpperCase()) || hasVariantSize;
          })
        );
      }

      if (selectedTags.length > 0) {
        filtered = filtered.filter((p) => selectedTags.some((t) => p.tags?.includes(t)));
      }

      if (selectedBrands.length > 0) {
        filtered = filtered.filter((p) => selectedBrands.includes(p.brand));
      }

      // Sorting
      if (sortBy === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'newest') {
        filtered.sort((a, b) => Number(b.id) - Number(a.id));
      }

      setTotalProducts(filtered.length);
      setTotalPages(Math.ceil(filtered.length / productsPerPage) || 1);

      const startIndex = (currentPage - 1) * productsPerPage;
      setProducts(filtered.slice(startIndex, startIndex + productsPerPage));
    } finally {
      setLoading(false);
    }
  }, [allCatalogProducts, selectedCategory, searchQuery, priceRange, selectedColors, selectedSizes, selectedTags, selectedBrands, sortBy, currentPage, productsPerPage]);

  useEffect(() => {
    loadProducts();
    updateURLParams();
  }, [loadProducts, updateURLParams]);

  // Compute live facet counts across all catalog products
  const facetCounts = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    const colorsMap: Record<string, number> = {};
    const sizesMap: Record<string, number> = {};
    const tagsMap: Record<string, number> = {};
    const brandsMap: Record<string, number> = {};

    allCatalogProducts.forEach((product) => {
      // Category count
      const cat = product.category || 'General';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;

      // Brand count
      if (product.brand) {
        brandsMap[product.brand] = (brandsMap[product.brand] || 0) + 1;
      }

      // Tags count
      if (product.tags) {
        product.tags.forEach((tag) => {
          tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
      }

      // Color facet count
      const colorVal = product.specifications?.ColorName || product.specifications?.Color || 'Default';
      ['Cream', 'Black', 'White', 'Beige', 'Blue', 'Grey', 'Brown', 'Green'].forEach((c) => {
        const matchesSpec = colorVal.toLowerCase().includes(c.toLowerCase());
        const matchesVariant = product.variants?.some((v) =>
          v.options.some((opt) => opt.value.toLowerCase().includes(c.toLowerCase()))
        );
        if (matchesSpec || matchesVariant) {
          colorsMap[c] = (colorsMap[c] || 0) + 1;
        }
      });

      // Size facet count
      ['XS', 'S', 'M', 'L', 'XL'].forEach((s) => {
        const matchesSpec = (product.specifications?.Sizes || '').toUpperCase().includes(s);
        const matchesVariant = product.variants?.some((v) =>
          v.options.some((opt) => opt.value.toUpperCase() === s)
        );
        if (matchesSpec || matchesVariant) {
          sizesMap[s] = (sizesMap[s] || 0) + 1;
        }
      });
    });

    return {
      categories: categoriesMap,
      colors: colorsMap,
      sizes: sizesMap,
      tags: tagsMap,
      brands: brandsMap,
    };
  }, [allCatalogProducts]);

  // Active filters counter
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 2000) count++;
    if (searchQuery !== '') count++;
    count += selectedColors.length;
    count += selectedSizes.length;
    count += selectedTags.length;
    count += selectedBrands.length;
    return count;
  }, [selectedCategory, priceRange, searchQuery, selectedColors, selectedSizes, selectedTags, selectedBrands]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 2000]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedTags([]);
    setSelectedBrands([]);
    setSearchQuery('');
    setSearchInput('');
    setSortBy('default');
    setCurrentPage(1);
  };

  // Render Filter Controls Sidebar / Drawer
  const renderFilterControls = () => (
    <div className="space-y-6 text-xs">
      {/* Category Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3 flex items-center justify-between">
          <span>Category</span>
          <span className="text-[10px] font-normal text-gray-400">({allCatalogProducts.length})</span>
        </h3>
        <div className="space-y-1.5">
          <label className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition ${selectedCategory === 'all' ? 'bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === 'all'}
                onChange={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                className="accent-[#8b6f47]"
              />
              <span>All Products</span>
            </span>
            <span className="text-[10px] opacity-70 font-mono">({allCatalogProducts.length})</span>
          </label>

          {Object.entries(facetCounts.categories).map(([cat, count]) => (
            <label key={cat} className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selectedCategory.toLowerCase() === cat.toLowerCase()}
                  onChange={() => { setSelectedCategory(cat.toLowerCase()); setCurrentPage(1); }}
                  className="accent-[#8b6f47]"
                />
                <span className="capitalize">{cat}</span>
              </span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Price Range ($)
        </h3>
        <div className="space-y-3">
          <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full my-4">
            {/* Active colored track between min and max handles */}
            <div
              className="absolute h-full bg-[#8b6f47] dark:bg-[#c9a96b] rounded-full"
              style={{
                left: `${(priceRange[0] / 2000) * 100}%`,
                right: `${100 - (priceRange[1] / 2000) * 100}%`,
              }}
            />
            {/* Min Price Slider Handle */}
            <input
              type="range"
              min="0"
              max="2000"
              step="25"
              value={priceRange[0]}
              aria-label="Minimum Price Filter"
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value, 10), priceRange[1] - 25);
                setPriceRange([val, priceRange[1]]);
                setCurrentPage(1);
              }}
              className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none focus:outline-none accent-[#8b6f47] dark:accent-[#c9a96b] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#8b6f47] [&::-webkit-slider-thumb]:dark:bg-[#c9a96b] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#8b6f47] [&::-moz-range-thumb]:dark:bg-[#c9a96b] [&::-moz-range-thumb]:border-0"
              style={{
                zIndex: priceRange[0] > 1800 ? 5 : 3,
              }}
            />
            {/* Max Price Slider Handle */}
            <input
              type="range"
              min="0"
              max="2000"
              step="25"
              value={priceRange[1]}
              aria-label="Maximum Price Filter"
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value, 10), priceRange[0] + 25);
                setPriceRange([priceRange[0], val]);
                setCurrentPage(1);
              }}
              className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none focus:outline-none accent-[#8b6f47] dark:accent-[#c9a96b] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#8b6f47] [&::-webkit-slider-thumb]:dark:bg-[#c9a96b] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#8b6f47] [&::-moz-range-thumb]:dark:bg-[#c9a96b] [&::-moz-range-thumb]:border-0"
              style={{
                zIndex: 4,
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-lg bg-white dark:bg-gray-950">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                min="0"
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(e) => {
                  setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]]);
                  setCurrentPage(1);
                }}
                className="w-12 bg-transparent text-center font-mono font-bold outline-none"
              />
            </div>
            <span className="text-gray-400 font-bold">to</span>
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-lg bg-white dark:bg-gray-950">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                min={priceRange[0]}
                max="5000"
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([priceRange[0], parseInt(e.target.value) || 2000]);
                  setCurrentPage(1);
                }}
                className="w-14 bg-transparent text-center font-mono font-bold outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Tags Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#8b6f47]" />
          <span>Product Badges & Tags</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {['Bestseller', 'New', 'Low Stock', 'Sale', 'Featured'].map((tag) => {
            const isChecked = selectedTags.includes(tag);
            const count = facetCounts.tags[tag] || 0;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTags(isChecked ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all flex items-center gap-1 ${
                  isChecked
                    ? 'bg-[#8b6f47] text-white border-transparent shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <span>{tag}</span>
                <span className="text-[9px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Colors & Swatches
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {['Cream', 'Black', 'White', 'Beige', 'Blue', 'Grey', 'Brown', 'Green'].map((color) => {
            const isChecked = selectedColors.includes(color);
            const count = facetCounts.colors[color] || 0;
            return (
              <label key={color} className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer select-none transition ${isChecked ? 'border-[#8b6f47] bg-[#8b6f47]/5 font-bold' : 'border-gray-150 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedColors(isChecked ? selectedColors.filter((c) => c !== color) : [...selectedColors, color]);
                      setCurrentPage(1);
                    }}
                    className="rounded text-[#8b6f47] accent-[#8b6f47]"
                  />
                  <span>{color}</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Sizes
        </h3>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL'].map((size) => {
            const isChecked = selectedSizes.includes(size);
            const count = facetCounts.sizes[size] || 0;
            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setSelectedSizes(isChecked ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size]);
                  setCurrentPage(1);
                }}
                className={`h-9 min-w-[36px] px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                  isChecked
                    ? 'bg-[#8b6f47] text-white border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <span>{size}</span>
                <span className="text-[9px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
          Brands
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {Object.entries(facetCounts.brands).map(([brand, count]) => {
            const isChecked = selectedBrands.includes(brand);
            return (
              <label key={brand} className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded-md">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedBrands(isChecked ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand]);
                      setCurrentPage(1);
                    }}
                    className="rounded text-[#8b6f47] accent-[#8b6f47]"
                  />
                  <span>{brand}</span>
                </span>
                <span className="text-[10px] font-mono opacity-60">({count})</span>
              </label>
            );
          })}
        </div>
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
              <h2 className="text-sm font-serif font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#8b6f47]" />
                <span>Filters</span>
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({activeFiltersCount})</span>
                </button>
              )}
            </div>
            {renderFilterControls()}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">

          {/* Header & Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white capitalize">
                {selectedCategory === 'all' ? 'All Products' : selectedCategory}
              </h1>
              <p className="text-xs text-text-muted mt-1 font-sans">
                Showing <span className="font-bold text-gray-800 dark:text-gray-200">{products.length}</span> of{' '}
                <span className="font-bold text-gray-800 dark:text-gray-200">{totalProducts}</span> products
                {searchQuery && <span> for "<span className="text-[#8b6f47] font-bold">{searchQuery}</span>"</span>}
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex lg:hidden items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold bg-[#faf9f6] dark:bg-gray-850 text-gray-700 dark:text-gray-300"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8b6f47]" />
                <span>Filters ({activeFiltersCount})</span>
              </button>

              {/* Debounced Search Input with Suggestions Dropdown */}
              <div 
                className="relative flex-1 sm:w-64 z-40" 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => {
                  // Delay to allow option selections to click before panel unmounts
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
              >
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-full pl-9 pr-8 py-2 border border-gray-250 dark:border-gray-700 rounded-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/40"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Search suggestions dropdown panel */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-950 border border-gray-150/50 dark:border-gray-800 rounded-3xl shadow-xl z-50 p-4 space-y-4 max-h-[380px] overflow-y-auto"
                    >
                      {!searchInput.trim() ? (
                        <div className="space-y-4 text-left">
                          {recentSearches.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                                Recent Searches
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {recentSearches.map((q, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setSearchInput(q);
                                      setSearchQuery(q);
                                      setCurrentPage(1);
                                    }}
                                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer border border-transparent dark:border-gray-800"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                              Trending Searches
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {['Sofa', 'Jacket', 'Chair', 'Denim', 'Sneakers'].map((q, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSearchInput(q);
                                    setSearchQuery(q);
                                    setCurrentPage(1);
                                  }}
                                  className="px-2.5 py-1 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer border border-transparent dark:border-gray-800"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          {searchSuggestions.categories.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">Categories</p>
                              <div className="space-y-1">
                                {searchSuggestions.categories.map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCategory(cat.toLowerCase());
                                      setSearchInput('');
                                      setSearchQuery('');
                                      setCurrentPage(1);
                                    }}
                                    className="w-full text-left py-1.5 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-medium capitalize"
                                  >
                                    🔍 {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {searchSuggestions.brands.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">Brands</p>
                              <div className="space-y-1">
                                {searchSuggestions.brands.map((brand) => (
                                  <button
                                    key={brand}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBrands([brand]);
                                      setSearchInput('');
                                      setSearchQuery('');
                                      setCurrentPage(1);
                                    }}
                                    className="w-full text-left py-1.5 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-medium"
                                  >
                                    🏷️ {brand}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {searchSuggestions.products.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">Products</p>
                              <div className="space-y-1 flex flex-col">
                                {searchSuggestions.products.map((prod) => (
                                  <button
                                    key={prod.id}
                                    type="button"
                                    onClick={() => {
                                      router.push(`/product/${prod.id}`);
                                    }}
                                    className="w-full text-left py-1.5 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-medium flex items-center gap-2"
                                  >
                                    <div className="relative w-8 h-8 rounded overflow-hidden border bg-gray-50 flex-shrink-0">
                                      <img src={prod.thumbnail} alt={prod.title} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold truncate text-gray-900 dark:text-white">{prod.title}</p>
                                      <p className="text-[9px] text-text-muted truncate font-mono">${prod.price}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {searchSuggestions.categories.length === 0 && searchSuggestions.brands.length === 0 && searchSuggestions.products.length === 0 && (
                            <p className="text-xs text-text-muted italic py-3 text-center">No quick suggestion matches found.</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort By Select */}
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-full bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-xs font-bold focus:outline-none"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High ↑</option>
                <option value="price-desc">Price: High to Low ↓</option>
                <option value="rating">Highest Rated ⭐</option>
                <option value="newest">Newest Arrivals</option>
              </select>

              {/* Grid / List View Toggle */}
              <div className="flex border border-gray-250 dark:border-gray-700 rounded-full overflow-hidden bg-white dark:bg-gray-950 p-0.5">
                <button
                  onClick={() => handleViewModeToggle('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-full transition ${viewMode === 'grid' ? 'bg-[#8b6f47] text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeToggle('list')}
                  title="List View"
                  className={`p-1.5 rounded-full transition ${viewMode === 'list' ? 'bg-[#8b6f47] text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Typo Correction Banner */}
          {typoSuggestion && originalSearchQuery && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium my-2.5">
              <span>
                No exact matches for "<strong>{originalSearchQuery}</strong>". Showing results for "<strong>{typoSuggestion}</strong>" instead.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput(originalSearchQuery);
                  setSearchQuery(originalSearchQuery);
                  setTypoSuggestion(null);
                  setOriginalSearchQuery(null);
                }}
                className="underline hover:text-amber-900 dark:hover:text-amber-200 font-bold ml-3 cursor-pointer"
              >
                Search for "{originalSearchQuery}" anyway
              </button>
            </div>
          )}

          {/* Active Filter Badges & Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-[#faf9f6] dark:bg-gray-850 p-3 rounded-2xl border border-gray-150/40 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted mr-1">Active Filters:</span>

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span className="capitalize">Category: {selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              )}

              {(priceRange[0] !== 0 || priceRange[1] !== 2000) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Price: ${priceRange[0]} - ${priceRange[1]}</span>
                  <button onClick={() => setPriceRange([0, 2000])} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              )}

              {searchQuery !== '' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Search: "{searchQuery}"</span>
                  <button onClick={() => { setSearchQuery(''); setSearchInput(''); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedColors.map((color) => (
                <span key={color} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Color: {color}</span>
                  <button onClick={() => setSelectedColors(selectedColors.filter((c) => c !== color))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}

              {selectedSizes.map((size) => (
                <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Size: {size}</span>
                  <button onClick={() => setSelectedSizes(selectedSizes.filter((s) => s !== size))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}

              {selectedTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Badge: {tag}</span>
                  <button onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}

              {selectedBrands.map((brand) => (
                <span key={brand} className="inline-flex items-center gap-1 px-3 py-1 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-[10px] font-bold border border-[#8b6f47]/20">
                  <span>Brand: {brand}</span>
                  <button onClick={() => setSelectedBrands(selectedBrands.filter((b) => b !== brand))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}

              <button
                onClick={clearAllFilters}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-auto px-2 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Listing Container */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-150/40 dark:border-gray-800 text-center px-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-[#8b6f47] rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-serif text-gray-900 dark:text-white">No products found</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                We couldn't find any products matching your selected criteria. Try adjusting your filter parameters or search terms.
              </p>
              <Button
                onClick={clearAllFilters}
                className="mt-4 bg-[#8b6f47] text-white hover:bg-[#725a38] rounded-full text-xs font-bold px-6 py-2"
              >
                Reset All Filters
              </Button>
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
                  <ProductCard key={product.id} product={product} viewMode={viewMode} index={idx} searchQuery={searchQuery} />
                ))}
              </div>

              {/* Pagination Controls & Status Indicator */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-text-muted font-medium">
                  Showing {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)} to{' '}
                  {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} items
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full h-9 w-9 p-0 flex items-center justify-center disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                              currentPage === pageNum
                                ? 'bg-[#8b6f47] text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full h-9 w-9 p-0 flex items-center justify-center disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-Out Filters Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 p-6 overflow-y-auto lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between border-b pb-3 mb-5">
                <h2 className="text-sm font-serif font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Refine Products
                </h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                {renderFilterControls()}
              </div>

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
                  Show ({totalProducts}) Results
                </Button>
              </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
