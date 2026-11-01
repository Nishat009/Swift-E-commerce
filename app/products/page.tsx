'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';

import { fetchProducts } from '@/lib/api';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import { useCatalog } from '@/hooks/useCatalog';
import { normalizeProduct, matchesBadge, getProductSizes, getProductColors, BADGE_FILTERS } from '@/utils/productUtils';
import { LoadingSkeleton } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { Grid, List, ChevronLeft, ChevronRight, SlidersHorizontal, X, Search, RotateCcw } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const SIZE_FILTERS = ['XS', 'S', 'M', 'L', 'XL'];
// Shown even before the catalog loads; colours found in the data are added after these
const BASE_COLOR_FILTERS = ['Cream', 'Black', 'White', 'Beige', 'Blue', 'Grey', 'Brown', 'Green'];

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

const filterHeading = 'flex cursor-pointer list-none items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100 [&::-webkit-details-marker]:hidden';
/** Collapsible filter section (native <details>, open by default). */
const FilterGroup = ({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) => (
  <details open={open} className="group border-b border-line py-5 first:pt-0">
    <summary className={filterHeading}>
      {title}
      <ChevronRight className="size-3.5 text-stone-400 transition-transform group-open:rotate-90" />
    </summary>
    <div className="pt-4">{children}</div>
  </details>
);


function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // All catalog products (normalized for fallback & live facet count calculation)
  const { products: allCatalogProducts } = useCatalog();

  // Filter State initialized from URL query params
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 5000,
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
  // Most searched terms from the API, with a fixed list until it answers
  const [trendingSearches, setTrendingSearches] = useState<string[]>(['Jacket', 'Dress', 'Denim', 'Sneakers', 'Bag']);
  useEffect(() => {
    apiClient.get('/products/search/trending')
      .then((res) => {
        const terms: string[] = Array.isArray(res.data?.data) ? res.data.data : [];
        if (terms.length) setTrendingSearches(terms.slice(0, 6).map((t) => t.charAt(0).toUpperCase() + t.slice(1)));
      })
      .catch(() => {});
  }, []);

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
  }, [searchInput, allCatalogProducts]);

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
  // The free-tier API can take up to a minute to wake: say so instead of showing silent skeletons
  const [slowLoad, setSlowLoad] = useState(false);
  // Only the newest request may update the list (an older, slower answer must not overwrite it)
  const latestRequest = useRef(0);

  const productsPerPage = 12;

  // Typo suggestions need the full catalog, but only while searching: without a search the list
  // does not depend on it, so it is not fetched again when the catalog arrives
  const typoCatalog = useMemo(() => (searchQuery ? allCatalogProducts : []), [searchQuery, allCatalogProducts]);

  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return;
    }
    const timer = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(timer);
  }, [loading]);

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
    if (priceRange[1] < 5000) params.set('maxPrice', String(priceRange[1]));
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (selectedColors.length > 0) params.set('color', selectedColors.join(','));
    if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
    if (selectedTags.length > 0) params.set('tag', selectedTags.join(','));
    if (selectedBrands.length > 0) params.set('brand', selectedBrands.join(','));
    if (currentPage > 1) params.set('page', String(currentPage));
    if (viewMode === 'list') params.set('view', 'list');

    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
    if (typeof window !== 'undefined') {
      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetPath) {
        router.replace(targetPath, { scroll: false });
      }
    }
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
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      let activeQuery = searchQuery;
      let matchedSuggestion: string | null = null;
      let originalQueryToKeep: string | null = null;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        // Check if query yields any matches in titles, categories, or brands
        const directMatches = typoCatalog.some((p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );

        if (!directMatches) {
          // Collect candidates
          const candidates = new Set<string>();
          typoCatalog.forEach((p) => {
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
      if (selectedTags.length > 0) apiParams.tag = selectedTags.join(',');
      if (selectedBrands.length > 0) apiParams.brand = selectedBrands.join(',');

      const res = await fetchProducts(apiParams);
      if (requestId !== latestRequest.current) return;
      if (res && res.products && Array.isArray(res.products)) {
        const fetched = res.products.map(normalizeProduct);

        setProducts(fetched);
        setTotalProducts(res.total || fetched.length);
        setTotalPages(Math.ceil((res.total || fetched.length) / productsPerPage) || 1);
      } else {
        throw new Error('Invalid product payload structure');
      }
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      console.error('Failed to load products:', err);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setError('We could not load products right now. Please check your connection and try again.');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [typoCatalog, selectedCategory, searchQuery, priceRange, selectedColors, selectedSizes, selectedTags, selectedBrands, sortBy, currentPage, productsPerPage]);

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

      // Badge count (same rules the API filters with: Sale = discounted, etc.)
      BADGE_FILTERS.forEach((badge) => {
        if (matchesBadge(product, badge)) {
          tagsMap[badge] = (tagsMap[badge] || 0) + 1;
        }
      });

      // Color facet count
      getProductColors(product).forEach((c) => {
        colorsMap[c] = (colorsMap[c] || 0) + 1;
      });

      // Size facet count
      const sizes = getProductSizes(product);
      SIZE_FILTERS.forEach((s) => {
        if (sizes.includes(s)) {
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

  const colorFilters = useMemo(
    () => [...BASE_COLOR_FILTERS, ...Object.keys(facetCounts.colors).filter((c) => !BASE_COLOR_FILTERS.includes(c)).sort()],
    [facetCounts.colors]
  );

  // Active filters counter
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 5000) count++;
    if (searchQuery !== '') count++;
    count += selectedColors.length;
    count += selectedSizes.length;
    count += selectedTags.length;
    count += selectedBrands.length;
    return count;
  }, [selectedCategory, priceRange, searchQuery, selectedColors, selectedSizes, selectedTags, selectedBrands]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 5000]);
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
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
      active ? 'border-ink bg-ink text-paper' : 'border-line text-stone-700 hover:border-stone-400 dark:text-stone-300'
    }`;
  const sliderThumb = '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paper [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-paper';
  const renderFilterControls = () => (
    <div className="text-sm">
      <FilterGroup title="Category">
        <div className="space-y-0.5">
          {[['all', allCatalogProducts.length] as [string, number], ...Object.entries(facetCounts.categories)].map(([cat, count]) => {
            const active = cat === 'all' ? selectedCategory === 'all' : selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <label key={cat} className="flex cursor-pointer items-center justify-between py-1.5">
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={active}
                    onChange={() => { setSelectedCategory(cat === 'all' ? 'all' : cat.toLowerCase()); setCurrentPage(1); }}
                    className="sr-only"
                  />
                  <span className={`size-1.5 rounded-full transition-colors ${active ? 'bg-ink' : 'bg-transparent'}`} />
                  <span className={`capitalize transition-colors ${active ? 'font-medium text-ink' : 'text-stone-600 hover:text-ink dark:text-stone-400'}`}>
                    {cat === 'all' ? 'All products' : cat}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-stone-400">{count}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="space-y-4">
          <div className="relative mx-1 my-3 h-px bg-stone-200 dark:bg-stone-700">
            <div
              className="absolute h-full bg-ink"
              style={{
                left: `${(priceRange[0] / 5000) * 100}%`,
                right: `${100 - (priceRange[1] / 5000) * 100}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max="5000"
              step="25"
              value={priceRange[0]}
              aria-label="Minimum price"
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value, 10), priceRange[1] - 25);
                setPriceRange([val, priceRange[1]]);
                setCurrentPage(1);
              }}
              className={`pointer-events-none absolute -top-2 h-4 w-full appearance-none bg-transparent focus:outline-none ${sliderThumb}`}
              style={{ zIndex: priceRange[0] > 1800 ? 5 : 3 }}
            />
            <input
              type="range"
              min="0"
              max="5000"
              step="25"
              value={priceRange[1]}
              aria-label="Maximum price"
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value, 10), priceRange[0] + 25);
                setPriceRange([priceRange[0], val]);
                setCurrentPage(1);
              }}
              className={`pointer-events-none absolute -top-2 h-4 w-full appearance-none bg-transparent focus:outline-none ${sliderThumb}`}
              style={{ zIndex: 4 }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex flex-1 items-center gap-1 rounded-md border border-line px-2.5 py-1.5 focus-within:border-ink">
              <span className="text-stone-400">$</span>
              <input
                type="number"
                min="0"
                max={priceRange[1]}
                value={priceRange[0]}
                aria-label="Minimum price"
                onChange={(e) => {
                  setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]]);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent tabular-nums text-ink outline-none"
              />
            </label>
            <span className="text-stone-400">–</span>
            <label className="flex flex-1 items-center gap-1 rounded-md border border-line px-2.5 py-1.5 focus-within:border-ink">
              <span className="text-stone-400">$</span>
              <input
                type="number"
                min={priceRange[0]}
                max="5000"
                value={priceRange[1]}
                aria-label="Maximum price"
                onChange={(e) => {
                  setPriceRange([priceRange[0], parseInt(e.target.value) || 5000]);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent tabular-nums text-ink outline-none"
              />
            </label>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Highlights">
        <div className="flex flex-wrap gap-1.5">
          {BADGE_FILTERS.map((tag) => {
            const isChecked = selectedTags.includes(tag);
            const count = facetCounts.tags[tag] || 0;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={isChecked}
                onClick={() => {
                  setSelectedTags(isChecked ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]);
                  setCurrentPage(1);
                }}
                className={chip(isChecked)}
              >
                {tag}
                <span className={`tabular-nums ${isChecked ? 'opacity-70' : 'text-stone-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="grid grid-cols-5 gap-1.5">
          {SIZE_FILTERS.map((size) => {
            const isChecked = selectedSizes.includes(size);
            const count = facetCounts.sizes[size] || 0;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={isChecked}
                title={`${count} products`}
                onClick={() => {
                  setSelectedSizes(isChecked ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size]);
                  setCurrentPage(1);
                }}
                className={`h-9 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  isChecked ? 'border-ink bg-ink text-paper' : 'border-line text-stone-700 hover:border-stone-400 dark:text-stone-300'
                } ${count === 0 && !isChecked ? 'opacity-40' : ''}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {colorFilters.map((color) => {
            const isChecked = selectedColors.includes(color);
            const count = facetCounts.colors[color] || 0;
            return (
              <label key={color} className="flex cursor-pointer items-center justify-between py-1.5 select-none">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedColors(isChecked ? selectedColors.filter((c) => c !== color) : [...selectedColors, color]);
                      setCurrentPage(1);
                    }}
                    className="size-3.5 rounded-sm accent-stone-900 dark:accent-stone-100"
                  />
                  <span className={isChecked ? 'font-medium text-ink' : 'text-stone-600 dark:text-stone-400'}>{color}</span>
                </span>
                <span className="text-xs tabular-nums text-stone-400">{count}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Brand" open={selectedBrands.length > 0}>
        <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
          {Object.entries(facetCounts.brands).map(([brand, count]) => {
            const isChecked = selectedBrands.includes(brand);
            return (
              <label key={brand} className="flex cursor-pointer items-center justify-between py-1.5">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedBrands(isChecked ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand]);
                      setCurrentPage(1);
                    }}
                    className="size-3.5 rounded-sm accent-stone-900 dark:accent-stone-100"
                  />
                  <span className={isChecked ? 'font-medium text-ink' : 'text-stone-600 dark:text-stone-400'}>{brand}</span>
                </span>
                <span className="text-xs tabular-nums text-stone-400">{count}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>
    </div>
  );

  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...(selectedCategory !== 'all' ? [{ key: 'cat', label: selectedCategory, clear: () => setSelectedCategory('all') }] : []),
    ...(priceRange[0] !== 0 || priceRange[1] !== 5000 ? [{ key: 'price', label: `$${priceRange[0]} – $${priceRange[1]}`, clear: () => setPriceRange([0, 5000]) }] : []),
    ...(searchQuery !== '' ? [{ key: 'search', label: `“${searchQuery}”`, clear: () => { setSearchQuery(''); setSearchInput(''); } }] : []),
    ...selectedColors.map((color) => ({ key: `c-${color}`, label: color, clear: () => setSelectedColors(selectedColors.filter((c) => c !== color)) })),
    ...selectedSizes.map((size) => ({ key: `s-${size}`, label: `Size ${size}`, clear: () => setSelectedSizes(selectedSizes.filter((s) => s !== size)) })),
    ...selectedTags.map((tag) => ({ key: `t-${tag}`, label: tag, clear: () => setSelectedTags(selectedTags.filter((t) => t !== tag)) })),
    ...selectedBrands.map((brand) => ({ key: `b-${brand}`, label: brand, clear: () => setSelectedBrands(selectedBrands.filter((b) => b !== brand)) })),
  ];

  const pageTitle = searchQuery ? `Results for “${searchQuery}”` : selectedCategory === 'all' ? 'All products' : selectedCategory;
  const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3';

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10">
      {/* Page header */}
      <header className="pb-6 pt-10 sm:pt-14">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-stone-500" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
          <span className={selectedCategory === 'all' && !searchQuery ? 'text-ink' : ''}>Shop</span>
          {selectedCategory !== 'all' && (
            <>
              <ChevronRight className="size-3 text-stone-300 dark:text-stone-600" />
              <span className="capitalize text-ink">{selectedCategory}</span>
            </>
          )}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-4xl font-medium capitalize tracking-tight text-ink sm:text-5xl">{pageTitle}</h1>
          <p className="text-sm text-stone-500">
            {totalProducts} {totalProducts === 1 ? 'piece' : 'pieces'}
          </p>
        </div>

        {/* Quick category switcher */}
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[['all', allCatalogProducts.length] as [string, number], ...Object.entries(facetCounts.categories)].map(([cat]) => {
            const active = cat === 'all' ? selectedCategory === 'all' : selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat === 'all' ? 'all' : cat.toLowerCase()); setCurrentPage(1); }}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] capitalize transition-colors cursor-pointer ${
                  active ? 'border-ink bg-ink text-paper' : 'border-line text-stone-700 hover:border-stone-400 dark:text-stone-300'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 flex items-center gap-2 border-y border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-10 lg:px-10">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-ink lg:hidden cursor-pointer"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters{activeFiltersCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-ink text-[10px] text-paper">{activeFiltersCount}</span>}
        </button>
        <p className="hidden text-xs text-stone-500 lg:block lg:w-60 lg:shrink-0">
          {activeFiltersCount > 0 ? (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-1.5 text-ink hover:underline underline-offset-4 cursor-pointer">
              <RotateCcw className="size-3" /> Clear filters ({activeFiltersCount})
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100"><SlidersHorizontal className="size-3.5" /> Filters</span>
          )}
        </p>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2 lg:ml-10">
          {/* Debounced Search Input with Suggestions Dropdown */}
          <div
            className="relative z-10 hidden w-full max-w-xs sm:block"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // Delay to allow option selections to click before panel unmounts
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
          >
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search this collection"
              value={searchInput}
              onChange={handleSearchInputChange}
              aria-label="Search products"
              className="h-9 w-full rounded-full border border-line bg-transparent pl-9 pr-8 text-[13px] text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}

            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute inset-x-0 top-full z-20 mt-2 max-h-[380px] space-y-4 overflow-y-auto rounded-lg border border-line bg-surface p-4 text-left shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)]"
                >
                  {!searchInput.trim() ? (
                    <>
                      {recentSearches.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Recent</p>
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((q, idx) => (
                              <button key={idx} type="button" onClick={() => { setSearchInput(q); setSearchQuery(q); setCurrentPage(1); }} className={chip(false)}>
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Trending</p>
                        <div className="flex flex-wrap gap-1.5">
                          {trendingSearches.map((q, idx) => (
                            <button key={idx} type="button" onClick={() => { setSearchInput(q); setSearchQuery(q); setCurrentPage(1); }} className={chip(false)}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {searchSuggestions.categories.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Categories</p>
                          {searchSuggestions.categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => { setSelectedCategory(cat.toLowerCase()); setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                              className="block w-full rounded-md px-2 py-1.5 text-left text-sm capitalize text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5 cursor-pointer"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                      {searchSuggestions.brands.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Brands</p>
                          {searchSuggestions.brands.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onClick={() => { setSelectedBrands([brand]); setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5 cursor-pointer"
                            >
                              {brand}
                            </button>
                          ))}
                        </div>
                      )}
                      {searchSuggestions.products.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Products</p>
                          {searchSuggestions.products.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => router.push(`/product/${prod.id}`)}
                              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={prod.thumbnail} alt="" className="h-10 w-8 shrink-0 rounded-sm bg-stone-100 object-cover dark:bg-stone-800" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm text-ink">{prod.title}</span>
                                <span className="text-xs text-stone-500">${prod.price}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchSuggestions.categories.length === 0 && searchSuggestions.brands.length === 0 && searchSuggestions.products.length === 0 && (
                        <p className="py-3 text-center text-sm text-stone-500">No quick matches. Press Enter to search.</p>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <label className="relative">
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
              className="h-9 appearance-none rounded-full border border-line bg-transparent pl-4 pr-9 text-[13px] text-ink focus:border-ink focus:outline-none cursor-pointer"
            >
              <option value="default">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 rotate-90 text-stone-400" />
          </label>

          <div className="hidden items-center rounded-full border border-line p-0.5 sm:flex" role="group" aria-label="Layout">
            <button
              onClick={() => handleViewModeToggle('grid')}
              title="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`rounded-full p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-ink text-paper' : 'text-stone-400 hover:text-ink'}`}
            >
              <Grid className="size-3.5" />
            </button>
            <button
              onClick={() => handleViewModeToggle('list')}
              title="List view"
              aria-pressed={viewMode === 'list'}
              className={`rounded-full p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-ink text-paper' : 'text-stone-400 hover:text-ink'}`}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-10 pt-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto pb-8 pr-2">
            {renderFilterControls()}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Typo Correction Banner */}
          {typoSuggestion && originalSearchQuery && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
              <span>
                No exact matches for &ldquo;<strong className="font-medium text-ink">{originalSearchQuery}</strong>&rdquo;. Showing results for &ldquo;<strong className="font-medium text-ink">{typoSuggestion}</strong>&rdquo;.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput(originalSearchQuery);
                  setSearchQuery(originalSearchQuery);
                  setTypoSuggestion(null);
                  setOriginalSearchQuery(null);
                }}
                className="font-medium text-ink underline underline-offset-4 cursor-pointer"
              >
                Search for &ldquo;{originalSearchQuery}&rdquo; instead
              </button>
            </div>
          )}

          {/* Active filters */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => { c.clear(); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs capitalize text-stone-700 transition-colors hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-white/10 cursor-pointer"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label}
                  <X className="size-3" />
                </button>
              ))}
              <button onClick={clearAllFilters} className="ml-1 text-xs text-stone-500 underline underline-offset-4 hover:text-ink cursor-pointer">
                Clear all
              </button>
            </div>
          )}

          {/* Products Listing Container */}
          {loading ? (
            <div>
              {slowLoad && (
                <p role="status" className="mb-6 rounded-md bg-surface-muted px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                  Waking up the store server. The first visit after a quiet spell can take up to a minute.
                </p>
              )}
              <div className={gridClass}>
                {[...Array(6)].map((_, i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <h3 className="font-serif text-2xl text-ink">Something went wrong</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">{error}</p>
              <Button onClick={() => loadProducts()} className="mt-6">
                Try again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <Search className="mx-auto mb-4 size-6 text-stone-400" />
              <h3 className="font-serif text-2xl text-ink">No pieces found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
                Nothing matches these filters yet. Try removing a filter or searching for something else.
              </p>
              <Button onClick={clearAllFilters} variant="outline" className="mt-6">
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? gridClass : 'space-y-6'}>
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} index={idx} searchQuery={searchQuery} />
                ))}
              </div>

              {/* Pagination Controls & Status Indicator */}
              <div className="mt-16 flex flex-col items-center gap-4 border-t border-line pt-8">
                {totalPages > 1 && (
                  <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-white/10 cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                          className={`size-9 rounded-full text-[13px] tabular-nums transition-colors cursor-pointer ${
                            currentPage === pageNum ? 'bg-ink text-paper' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-white/10 cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </nav>
                )}
                <span className="text-xs text-stone-500">
                  Showing {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)}–{Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts}
                </span>
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
              className="fixed inset-0 z-[60] bg-stone-950/40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-sm flex-col bg-paper shadow-2xl lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex h-16 items-center justify-between border-b border-line px-5">
                <h2 className="font-sans text-sm font-medium text-ink">Filters</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="-mr-2 flex size-10 items-center justify-center rounded-full text-ink hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {renderFilterControls()}
              </div>
              <div className="flex gap-2 border-t border-line px-5 py-4">
                <Button variant="outline" onClick={() => { clearAllFilters(); setIsMobileFiltersOpen(false); }} className="flex-1">
                  Clear
                </Button>
                <Button onClick={() => setIsMobileFiltersOpen(false)} className="flex-1">
                  Show {totalProducts}
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
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
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
