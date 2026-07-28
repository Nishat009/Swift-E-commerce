'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariantGroup, VariantCombination, ProductAttribute } from '@/types';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Save,
  Send,
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Layers,
  Truck,
  Globe,
  Tag,
  Sliders,
  Calendar,
  MoveUp,
  MoveDown,
  Crop,
  Video,
  Box
} from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  initialData?: Product | null;
  isEditMode?: boolean;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Active section for sticky right sidebar indicator
  const [activeSection, setActiveSection] = useState('basic');
  const [autosaveTime, setAutosaveTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Basic Info State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [sku, setSku] = useState(initialData?.sku || initialData?.SKU || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [category, setCategory] = useState(initialData?.category || 'clothing');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || ['New Arrival']);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(initialData?.status || 'published');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>(initialData?.visibility || 'public');
  const [featured, setFeatured] = useState<boolean>(initialData?.featured || false);
  const [trending, setTrending] = useState<boolean>(initialData?.trending || false);
  const [newArrival, setNewArrival] = useState<boolean>(initialData?.newArrival || true);
  const [bestSeller, setBestSeller] = useState<boolean>(initialData?.bestSeller || false);

  // 2. Media State
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']
  );
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || images[0] || '');
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const [videoUrl, setVideoUrl] = useState(initialData?.videos?.[0] || '');
  const [has360Viewer, setHas360Viewer] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // 3. Pricing State
  const [price, setPrice] = useState<number>(initialData?.price || 99);
  const [originalPrice, setOriginalPrice] = useState<number>(initialData?.originalPrice || 149);
  const [tax, setTax] = useState<number>(initialData?.tax || 5);
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [costPrice, setCostPrice] = useState<number>(initialData?.costPrice || 45);

  // 4. Inventory State
  const [stock, setStock] = useState<number>(initialData?.stock || 50);
  const [reservedStock, setReservedStock] = useState<number>(initialData?.reservedStock || 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialData?.lowStockThreshold || 5);
  const [warehouse, setWarehouse] = useState(initialData?.warehouse || 'Main Warehouse - NY');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'backorder'>(initialData?.stockStatus || 'in_stock');
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<number>(initialData?.maxOrderQuantity || 10);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(initialData?.minOrderQuantity || 1);
  const [allowBackorders, setAllowBackorders] = useState(initialData?.allowBackorders || false);
  const [trackInventory, setTrackInventory] = useState(initialData?.trackInventory ?? true);

  // 5. Variants State
  const [variantTypes, setVariantTypes] = useState<{ name: string; values: string[] }[]>([
    { name: 'Colour', values: ['Black', 'Navy', 'White'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] }
  ]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(
    initialData?.variantCombinations || []
  );

  // 6. Shipping State
  const [weight, setWeight] = useState<number>(initialData?.shippingInfo?.weight || 0.8);
  const [length, setLength] = useState<number>(initialData?.shippingInfo?.dimensions?.length || 25);
  const [width, setWidth] = useState<number>(initialData?.shippingInfo?.dimensions?.width || 15);
  const [height, setHeight] = useState<number>(initialData?.shippingInfo?.dimensions?.height || 5);
  const [shippingClass, setShippingClass] = useState(initialData?.shippingInfo?.shippingClass || 'Standard Parcel');
  const [freeShipping, setFreeShipping] = useState(initialData?.shippingInfo?.freeShipping ?? true);
  const [expressShipping, setExpressShipping] = useState(initialData?.shippingInfo?.expressShipping ?? true);
  const [estimate, setEstimate] = useState(initialData?.shippingInfo?.estimate || '2 - 4 Business Days');
  const [packagingType, setPackagingType] = useState(initialData?.shippingInfo?.packagingType || 'Recyclable Box');
  const [countryOfOrigin, setCountryOfOrigin] = useState(initialData?.shippingInfo?.countryOfOrigin || 'United States');
  const [hsCode, setHsCode] = useState(initialData?.shippingInfo?.hsCode || '6109.10.00');

  // 7. SEO State
  const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.seo?.metaDescription || '');
  const [keywords, setKeywords] = useState<string[]>(initialData?.seo?.keywords || ['ecommerce', 'swiftcart']);
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.seo?.canonicalUrl || '');
  const [ogImage, setOgImage] = useState(initialData?.seo?.ogImage || '');

  // 8. Related Products
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);

  // 9. Attributes State
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    { name: 'Material', value: '100% Organic Cotton', group: 'Fabric' },
    { name: 'Fit Type', value: 'Regular Slim Fit', group: 'Apparel' },
    { name: 'Care Instructions', value: 'Machine Wash Cold', group: 'Maintenance' },
    { name: 'Warranty', value: '1 Year Manufacturer Guarantee', group: 'Guarantee' }
  ]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');
  const [newAttrGroup, setNewAttrGroup] = useState('Custom');

  // 10. Publish Schedule
  const [scheduledPublishDate, setScheduledPublishDate] = useState('');

  // Auto-generate slug & SKU
  useEffect(() => {
    if (title && (!slug || !isEditMode)) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title]);

  useEffect(() => {
    if (!sku && !isEditMode) {
      setSku('SKU-' + Math.floor(100000 + Math.random() * 900000));
    }
    if (!barcode) {
      setBarcode('BC-' + Math.floor(100000000000 + Math.random() * 900000000000));
    }
  }, []);

  // Fetch product list for related products selection
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await apiClient.get('/products?limit=50');
        if (res.data?.products) {
          setAvailableProducts(res.data.products.filter((p: Product) => String(p.id) !== String(initialData?.id)));
        }
      } catch (err) {
        console.error('Failed to load related products list:', err);
      }
    };
    loadProducts();
  }, [initialData]);

  // Calculations for pricing section
  const discountAmount = originalPrice > price ? originalPrice - price : 0;
  const discountPercentage = originalPrice > 0 && discountAmount > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const profit = price - costPrice;
  const profitMargin = price > 0 ? Math.round((profit / price) * 100) : 0;

  // Track field changes
  useEffect(() => {
    setIsDirty(true);
  }, [title, price, stock, description, images, status, visibility]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submitting]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, price, stock]);

  // Autosave timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty && title.trim()) {
        const timestamp = new Date().toLocaleTimeString();
        localStorage.setItem(
          `swiftcart_draft_${initialData?.id || 'new'}`,
          JSON.stringify({ title, price, stock, category, status })
        );
        setAutosaveTime(timestamp);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isDirty, title, price, stock, category, status]);

  // Form completion percentage
  const calculateCompletion = () => {
    let count = 0;
    const totalFields = 10;
    if (title) count++;
    if (brand) count++;
    if (category) count++;
    if (description) count++;
    if (price > 0) count++;
    if (images.length > 0) count++;
    if (stock >= 0) count++;
    if (sku) count++;
    if (attributes.length > 0) count++;
    if (metaTitle || description) count++;
    return Math.round((count / totalFields) * 100);
  };

  const completionPct = calculateCompletion();

  // Helper functions
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      if (!thumbnail) setThumbnail(newImageUrl.trim());
      setNewImageUrl('');
      toast.success('Media image added!');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (thumbnail === images[index]) {
      setThumbnail(updated[0] || '');
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setImages(updated);
  };

  const handleGenerateCombinations = () => {
    if (variantTypes.length === 0 || variantTypes.some((v) => v.values.length === 0)) {
      toast.error('Please define variant types and at least one value each.');
      return;
    }

    let results: Record<string, string>[] = [{}];
    variantTypes.forEach((vt) => {
      const temp: Record<string, string>[] = [];
      results.forEach((acc) => {
        vt.values.forEach((val) => {
          temp.push({ ...acc, [vt.name]: val });
        });
      });
      results = temp;
    });

    const generated: VariantCombination[] = results.map((comb, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      sku: `${sku || 'SKU'}-${Object.values(comb).join('-').toUpperCase()}`,
      price: price,
      stock: Math.floor(stock / results.length) || 10,
      barcode: `BC-VAR-${idx + 100}`,
      status: 'active',
      images: [images[0] || ''],
      attributes: comb
    }));

    setVariantCombinations(generated);
    toast.success(`Generated ${generated.length} variant combinations matrix!`);
  };

  const handleAddCustomAttr = () => {
    if (newAttrName.trim() && newAttrVal.trim()) {
      setAttributes([...attributes, { name: newAttrName.trim(), value: newAttrVal.trim(), group: newAttrGroup }]);
      setNewAttrName('');
      setNewAttrVal('');
      toast.success('Custom attribute added!');
    }
  };

  const handleSaveDraft = async () => {
    setStatus('draft');
    await handleSubmitForm('draft');
  };

  const handlePublish = async () => {
    setStatus('published');
    await handleSubmitForm('published');
  };

  const handleSubmitForm = async (targetStatus: 'draft' | 'published' | 'archived') => {
    if (!title.trim()) {
      toast.error('Product title is required.');
      return;
    }
    if (price <= 0) {
      toast.error('Product price must be greater than 0.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      slug,
      sku,
      barcode,
      brand: brand || 'SwiftCart Brand',
      category,
      subcategory,
      tags,
      status: targetStatus,
      visibility,
      featured,
      trending,
      newArrival,
      bestSeller,
      price: Number(price),
      originalPrice: Number(originalPrice),
      salePrice: Number(price),
      discountPercentage,
      tax: Number(tax),
      currency,
      costPrice: Number(costPrice),
      stock: Number(stock),
      reservedStock: Number(reservedStock),
      lowStockThreshold: Number(lowStockThreshold),
      warehouse,
      stockStatus: stock <= 0 ? 'out_of_stock' : stockStatus,
      maxOrderQuantity: Number(maxOrderQuantity),
      minOrderQuantity: Number(minOrderQuantity),
      allowBackorders,
      trackInventory,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
      videos: videoUrl ? [videoUrl] : [],
      thumbnail: thumbnail || images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      shortDescription,
      description: description || shortDescription || 'High quality product available at SwiftCart.',
      specifications: attributes.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}),
      attributes,
      variants: variantTypes.map((vt) => ({
        id: vt.name.toLowerCase(),
        name: vt.name,
        options: vt.values.map((val, idx) => ({
          id: `${vt.name.toLowerCase()}-${idx}`,
          name: vt.name,
          value: val,
          stock: stock,
          sku: `${sku}-${val.toUpperCase()}`
        }))
      })),
      variantCombinations,
      shippingInfo: {
        estimate,
        freeShipping,
        expressShipping,
        returnPolicy: '30-Day Hassle-Free Returns',
        cost: freeShipping ? 0 : 15,
        weight: Number(weight),
        dimensions: { length: Number(length), width: Number(width), height: Number(height) },
        shippingClass,
        packagingType,
        countryOfOrigin,
        hsCode
      },
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || shortDescription,
        keywords,
        canonicalUrl: canonicalUrl || `https://swiftcart.com/product/${slug}`,
        ogImage: ogImage || thumbnail
      },
      relatedProducts: selectedRelatedIds
    };

    try {
      if (isEditMode && initialData?.id) {
        const res = await apiClient.put(`/products/${initialData.id}`, payload);
        if (res.data?.success || res.status === 200) {
          toast.success(`Product "${title}" updated successfully!`);
          setIsDirty(false);
          router.push('/admin');
        }
      } else {
        const res = await apiClient.post('/products', payload);
        if (res.data?.success || res.status === 201) {
          toast.success(`Product "${title}" created and published successfully!`);
          setIsDirty(false);
          router.push('/admin');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'variants', label: 'Variants', icon: Layers },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'related', label: 'Related Products', icon: Tag },
    { id: 'attributes', label: 'Attributes', icon: Sliders },
    { id: 'publish', label: 'Publish', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Modern Header Banner */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150/50 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Link href="/admin" className="hover:text-[#8b6f47]">Admin Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-serif">{isEditMode ? 'Edit Product' : 'Create Product'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-gray-900 dark:text-white tracking-tight">
              {isEditMode ? `Edit: ${title || 'Product'}` : 'Create New Product'}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Form Completion: <strong className="text-[#8b6f47] dark:text-[#c9a96b] font-bold">{completionPct}%</strong></span>
              {autosaveTime && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Draft autosaved at {autosaveTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold px-4 py-2">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              size="sm"
              loading={submitting && status === 'draft'}
              className="rounded-xl text-xs font-bold px-4 py-2 border-gray-300 text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-gray-500" /> Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              size="sm"
              loading={submitting && status === 'published'}
              className="rounded-xl text-xs font-bold px-5 py-2 bg-[#8b6f47] hover:bg-[#725a38] text-white flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Publish Product
            </Button>
          </div>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] transition-all duration-500 rounded-full"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Form Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: 10 Form Sections */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* 1. BASIC INFORMATION */}
            <section id="section-basic" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#8b6f47]" /> 1. Basic Information
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Product identity, titles, categorization, and badges.</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">Required</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Swift Oxford Cotton Button-Down Shirt"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full text-sm rounded-xl py-2.5 font-serif font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      URL Slug
                    </label>
                    <Input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      SKU Code
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setSku('SKU-' + Math.floor(100000 + Math.random() * 900000))}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                        title="Auto Generate SKU"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Barcode (EAN/UPC)
                    </label>
                    <Input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Brand Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. SwiftCart Atelier"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Primary Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value="clothing">Clothing & Apparel</option>
                      <option value="electronics">Electronics & Tech</option>
                      <option value="top">Tops & Shirts</option>
                      <option value="pants">Pants & Trousers</option>
                      <option value="shoes">Footwear & Sneakers</option>
                      <option value="accessories">Accessories & Watches</option>
                      <option value="jewelry">Jewelry & Luxuries</option>
                      <option value="home">Home & Living</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Subcategory
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Formal Shirts"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                {/* Tags input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Product Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      placeholder="Type a tag and click Add (e.g. Organic, Summer, Cotton)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="w-full text-xs"
                    />
                    <Button type="button" onClick={handleAddTag} size="sm" className="rounded-xl px-4 text-xs font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                      Add Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, idx) => (
                      <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border border-gray-200/60 dark:border-gray-700">
                        #{t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Short Description / Teaser
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief 1-2 sentence overview shown in cards and headers..."
                    className="w-full text-xs border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Long Description (Rich Text Editor)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Detailed specs, fabric details, sizing info, features..."
                    className="w-full text-xs border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-serif leading-relaxed"
                  />
                </div>

                {/* Status & Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Product Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value="published">Published (Live in Store)</option>
                      <option value="draft">Draft (Hidden in Admin)</option>
                      <option value="archived">Archived (Deactivated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="w-full text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value="public">Public (Visible in search & catalog)</option>
                      <option value="private">Private (Only accessible via link)</option>
                      <option value="hidden">Hidden (Completely hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { label: 'Featured Item', state: featured, setter: (val: boolean) => setFeatured(val) },
                    { label: 'New Arrival', state: newArrival, setter: (val: boolean) => setNewArrival(val) },
                    { label: 'Trending Item', state: trending, setter: (val: boolean) => setTrending(val) },
                    { label: 'Best Seller', state: bestSeller, setter: (val: boolean) => setBestSeller(val) },
                  ].map((t, idx) => (
                    <label key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200/50 dark:border-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={t.state}
                        onChange={(e) => t.setter(e.target.checked)}
                        className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. MEDIA GALLERY */}
            <section id="section-media" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#8b6f47]" /> 2. Media Gallery & Video
                </h2>
                <p className="text-xs text-gray-500 mt-1">Upload multiple photos, set thumbnail, ordering, alt text, and video URLs.</p>
              </div>

              <div className="space-y-4">
                {/* Drag & Drop Add Image Input */}
                <div className="border-2 border-dashed border-gray-250 dark:border-gray-800 rounded-3xl p-6 text-center space-y-3 bg-gray-50/50 dark:bg-gray-950/40">
                  <Upload className="w-8 h-8 text-[#8b6f47] mx-auto" />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Enter Image URL or Drag & Drop Media</p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full text-xs"
                    />
                    <Button type="button" onClick={handleAddImage} size="sm" className="rounded-xl px-4 text-xs font-bold bg-[#8b6f47] text-white">
                      Add Media
                    </Button>
                  </div>
                </div>

                {/* Images Reordering & Thumbnails */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-950 p-2 space-y-2">
                      <div className="relative h-32 w-full rounded-xl overflow-hidden">
                        <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        {thumbnail === img && (
                          <span className="absolute top-2 left-2 bg-[#8b6f47] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                            Main Thumbnail
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs px-1">
                        <button
                          type="button"
                          onClick={() => setThumbnail(img)}
                          className={`text-[10px] font-bold ${thumbnail === img ? 'text-[#8b6f47]' : 'text-gray-400 hover:text-gray-700'}`}
                        >
                          {thumbnail === img ? '✓ Cover' : 'Set Cover'}
                        </button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleMoveImage(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => handleMoveImage(idx, 'down')} disabled={idx === images.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video & 360 Viewer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t dark:border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-500" /> Video URL (YouTube / Vimeo / MP4)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-emerald-500" /> Interactive 360 Viewer
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={has360Viewer}
                        onChange={(e) => setHas360Viewer(e.target.checked)}
                        className="rounded border-gray-300 text-[#8b6f47]"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Enable 360 Product Spin Preview</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. PRICING & FINANCIAL CALCULATIONS */}
            <section id="section-pricing" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#8b6f47]" /> 3. Pricing & Financials
                </h2>
                <p className="text-xs text-gray-500 mt-1">Set selling price, original compare price, cost price, and live profit calculations.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Selling Price ($) *
                    </label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                      className="w-full text-sm font-black text-[#8b6f47]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Original / MSRP ($)
                    </label>
                    <Input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Cost Price ($)
                    </label>
                    <Input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Sales Tax %
                    </label>
                    <Input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value))}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* Live Profit & Discount Calculation Banner */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-black text-gray-400">Calculated Discount</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      ${discountAmount} ({discountPercentage}% OFF)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-black text-gray-400">Profit Per Unit</span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                      ${profit}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-black text-gray-400">Profit Margin %</span>
                    <span className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
                      {profitMargin}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-black text-gray-400">Base Currency</span>
                    <span className="text-base font-black text-gray-900 dark:text-white mt-0.5 block font-mono">
                      {currency}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. INVENTORY & WAREHOUSING */}
            <section id="section-inventory" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#8b6f47]" /> 4. Inventory & Warehousing
                </h2>
                <p className="text-xs text-gray-500 mt-1">Manage stock quantity, low stock alerts, backorders, and warehouse tracking.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Available Stock *
                    </label>
                    <Input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      required
                      className="w-full text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Reserved Stock
                    </label>
                    <Input
                      type="number"
                      value={reservedStock}
                      onChange={(e) => setReservedStock(Number(e.target.value))}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Low Stock Threshold
                    </label>
                    <Input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Warehouse Location
                    </label>
                    <Input
                      type="text"
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Stock Status
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as any)}
                      className="w-full text-xs border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="backorder">On Backorder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Max Order Quantity
                    </label>
                    <Input
                      type="number"
                      value={maxOrderQuantity}
                      onChange={(e) => setMaxOrderQuantity(Number(e.target.value))}
                      className="w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Min Order Quantity
                    </label>
                    <Input
                      type="number"
                      value={minOrderQuantity}
                      onChange={(e) => setMinOrderQuantity(Number(e.target.value))}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowBackorders}
                      onChange={(e) => setAllowBackorders(e.target.checked)}
                      className="rounded border-gray-300 text-[#8b6f47]"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Allow Backorders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trackInventory}
                      onChange={(e) => setTrackInventory(e.target.checked)}
                      className="rounded border-gray-300 text-[#8b6f47]"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Track Inventory Quantity</span>
                  </label>
                </div>
              </div>
            </section>

            {/* 5. PRODUCT VARIANTS MATRIX */}
            <section id="section-variants" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#8b6f47]" /> 5. Dynamic Product Variants Matrix
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Configure Color, Size, Material, Storage options and auto-generate combination SKUs.</p>
                </div>
                <Button type="button" onClick={handleGenerateCombinations} size="sm" className="rounded-xl text-xs font-bold bg-[#8b6f47] text-white">
                  Generate Matrix ⚡
                </Button>
              </div>

              <div className="space-y-4">
                {/* Variant Types Definition */}
                {variantTypes.map((vt, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/70 dark:bg-gray-850 rounded-2xl border border-gray-200/50 dark:border-gray-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-[#8b6f47] tracking-wider">Variant Option #{idx + 1}</span>
                      <button type="button" onClick={() => setVariantTypes(variantTypes.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:underline">
                        Remove Option
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="Option Name (e.g. Size, Color, Storage)"
                        value={vt.name}
                        onChange={(e) => {
                          const updated = [...variantTypes];
                          updated[idx].name = e.target.value;
                          setVariantTypes(updated);
                        }}
                        className="w-full text-xs font-bold"
                      />
                      <Input
                        type="text"
                        placeholder="Values separated by comma (e.g. S, M, L, XL)"
                        value={vt.values.join(', ')}
                        onChange={(e) => {
                          const updated = [...variantTypes];
                          updated[idx].values = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                          setVariantTypes(updated);
                        }}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={() => setVariantTypes([...variantTypes, { name: 'Material', values: ['Cotton', 'Polyester'] }])}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-dashed border-gray-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Variant Option
                </Button>

                {/* Variant Combinations Table */}
                {variantCombinations.length > 0 && (
                  <div className="overflow-x-auto border rounded-2xl mt-4 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase text-[9px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Variant Combination</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Price ($)</th>
                          <th className="p-2.5">Stock</th>
                          <th className="p-2.5">Barcode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {variantCombinations.map((vc, i) => (
                          <tr key={vc.id} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">
                              {Object.entries(vc.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                            </td>
                            <td className="p-2.5 font-mono text-[10px]">{vc.sku}</td>
                            <td className="p-2.5 font-bold text-[#8b6f47]">${vc.price}</td>
                            <td className="p-2.5 font-mono">{vc.stock}</td>
                            <td className="p-2.5 font-mono text-[10px]">{vc.barcode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* 6. SHIPPING & LOGISTICS */}
            <section id="section-shipping" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#8b6f47]" /> 6. Shipping & Logistics
                </h2>
                <p className="text-xs text-gray-500 mt-1">Weight, package dimensions, delivery estimates, and customs HS code.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Length (cm)
                    </label>
                    <Input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Width (cm)
                    </label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Height (cm)
                    </label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Estimated Delivery
                    </label>
                    <Input
                      type="text"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      className="w-full text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Packaging Type
                    </label>
                    <Input
                      type="text"
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Country of Origin
                    </label>
                    <Input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={freeShipping}
                      onChange={(e) => setFreeShipping(e.target.checked)}
                      className="rounded border-gray-300 text-[#8b6f47]"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Free Shipping Eligible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={expressShipping}
                      onChange={(e) => setExpressShipping(e.target.checked)}
                      className="rounded border-gray-300 text-[#8b6f47]"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Express Delivery Available</span>
                  </label>
                </div>
              </div>
            </section>

            {/* 7. SEO METADATA & LIVE GOOGLE PREVIEW */}
            <section id="section-seo" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#8b6f47]" /> 7. SEO & Open Graph Preview
                </h2>
                <p className="text-xs text-gray-500 mt-1">Configure search engine titles, descriptions, and view live Google result preview.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Meta Title (Max 60 chars)
                  </label>
                  <Input
                    type="text"
                    placeholder={title || 'Product Page Meta Title'}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Meta Description (Max 160 chars)
                  </label>
                  <textarea
                    rows={2}
                    placeholder={shortDescription || 'Search engine summary snippet...'}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full text-xs border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  />
                </div>

                {/* Live Google Preview Card */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-2">Live Google Search Snippet</span>
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium hover:underline truncate cursor-pointer">
                    {metaTitle || title || 'Product Title | SwiftCart Store'}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-500 font-mono truncate">
                    https://swiftcart.com/product/{slug || 'product-slug'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {metaDescription || shortDescription || 'Buy the finest quality product at SwiftCart. Enjoy free shipping and 30-day returns.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 8. RELATED PRODUCTS & BUNDLES */}
            <section id="section-related" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#8b6f47]" /> 8. Related Products & Bundles
                </h2>
                <p className="text-xs text-gray-500 mt-1">Cross-sell and upsell products recommended on the detail page.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto p-2 border rounded-2xl">
                {availableProducts.map((p) => {
                  const isSelected = selectedRelatedIds.includes(String(p.id));
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRelatedIds(selectedRelatedIds.filter((id) => id !== String(p.id)));
                        } else {
                          setSelectedRelatedIds([...selectedRelatedIds, String(p.id)]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'border-[#8b6f47] bg-[#8b6f47]/10'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <img src={p.thumbnail} alt={p.title} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{p.title}</p>
                        <p className="text-[10px] text-[#8b6f47] font-bold">${p.price}</p>
                      </div>
                      <input type="checkbox" checked={isSelected} readOnly className="rounded text-[#8b6f47]" />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 9. PRODUCT ATTRIBUTES & SPECIFICATIONS */}
            <section id="section-attributes" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#8b6f47]" /> 9. Specifications & Custom Attributes
                </h2>
                <p className="text-xs text-gray-500 mt-1">Material, care instructions, origin, and custom key-value attributes.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    type="text"
                    placeholder="Attribute Name (e.g. Sleeve Length)"
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="text"
                    placeholder="Attribute Value (e.g. Long Sleeve)"
                    value={newAttrVal}
                    onChange={(e) => setNewAttrVal(e.target.value)}
                    className="text-xs"
                  />
                  <Button type="button" onClick={handleAddCustomAttr} size="sm" className="rounded-xl text-xs font-bold bg-[#8b6f47] text-white">
                    Add Attribute
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200/50 dark:border-gray-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="block font-bold text-gray-800 dark:text-gray-200">{attr.name}</span>
                        <span className="text-gray-500">{attr.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 10. PUBLISH CONTROL */}
            <section id="section-publish" className="bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b pb-4 dark:border-gray-800">
                <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#8b6f47]" /> 10. Final Publish & Action
                </h2>
                <p className="text-xs text-gray-500 mt-1">Publish immediately or save as draft.</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  loading={submitting && status === 'draft'}
                  variant="outline"
                  className="rounded-2xl px-6 py-3 font-bold text-xs border-gray-300"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  loading={submitting && status === 'published'}
                  className="rounded-2xl px-8 py-3 font-bold text-xs bg-[#8b6f47] hover:bg-[#725a38] text-white shadow-md"
                >
                  Publish Product Now
                </Button>
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Navigation Jump Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 space-y-4 bg-white dark:bg-gray-900 border border-gray-150/40 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs">
              <span className="block text-xs font-extrabold uppercase font-serif tracking-wider text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
                Form Sections
              </span>

              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a
                      key={sec.id}
                      href={`#section-${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        activeSection === sec.id
                          ? 'bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b]'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#8b6f47]" /> {sec.label}
                      </span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
