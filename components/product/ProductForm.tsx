'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Product,
  ProductVariantGroup,
  VariantCombination,
  ProductAttribute,
  ProductMedia,
  ProductPricing,
  ProductInventory,
  ProductShipping,
  ProductSEO
} from '@/types';
import { productService } from '@/services/productService';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
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
  MoveUp,
  MoveDown,
  Video,
  Box,
  Star,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

interface ProductFormProps {
  initialData?: Product | null;
  isEditMode?: boolean;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [targetNavigationUrl, setTargetNavigationUrl] = useState<string | null>(null);

  // 1. Basic Info State
  const [title, setTitle] = useState(initialData?.title || initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [sku, setSku] = useState(initialData?.sku || initialData?.SKU || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [brand, setBrand] = useState(initialData?.brand || 'SwiftCart Signature');
  const [category, setCategory] = useState(initialData?.category || 'Clothing');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || ['New Arrival', 'Casual']);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // 2. Status & Visibility State
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(initialData?.status || 'published');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>(initialData?.visibility || 'public');
  const [featured, setFeatured] = useState<boolean>(initialData?.featured || initialData?.isFeatured || false);
  const [trending, setTrending] = useState<boolean>(initialData?.trending || false);
  const [newArrival, setNewArrival] = useState<boolean>(initialData?.newArrival ?? true);
  const [bestSeller, setBestSeller] = useState<boolean>(initialData?.bestSeller || initialData?.bestseller || false);

  // 3. Media State
  const [mediaList, setMediaList] = useState<ProductMedia[]>(
    initialData?.media && initialData.media.length > 0
      ? initialData.media
      : (initialData?.images || ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']).map((url, idx) => ({
          id: `med-${idx}`,
          url,
          alt: `${initialData?.title || 'Product'} Image ${idx + 1}`,
          isPrimary: idx === 0,
          type: 'image',
          sortOrder: idx,
        }))
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(initialData?.videos?.[0] || '');
  const [mediaError, setMediaError] = useState('');

  // 4. Pricing State
  const [price, setPrice] = useState<number>(initialData?.price ?? 79);
  const [originalPrice, setOriginalPrice] = useState<number>(initialData?.originalPrice ?? 99);
  const [costPrice, setCostPrice] = useState<number>(initialData?.costPrice ?? 35);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    initialData?.pricing?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.pricing?.discountValue || (initialData?.discountPercentage ?? 20)
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.pricing?.taxRate ?? initialData?.tax ?? 5);
  const [currency, setCurrency] = useState<string>(initialData?.pricing?.currency || initialData?.currency || 'USD');

  // 5. Inventory State
  const [stock, setStock] = useState<number>(initialData?.stock ?? 45);
  const [reservedStock, setReservedStock] = useState<number>(initialData?.reservedStock ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialData?.lowStockThreshold ?? 10);
  const [warehouse, setWarehouse] = useState<string>(initialData?.warehouse || 'Main Distribution Hub - NY');
  const [trackInventory, setTrackInventory] = useState<boolean>(initialData?.trackInventory ?? true);
  const [allowBackorder, setAllowBackorder] = useState<boolean>(
    initialData?.allowBackorder ?? initialData?.allowBackorders ?? false
  );
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(initialData?.minOrderQuantity ?? 1);
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<number>(initialData?.maxOrderQuantity ?? 10);

  // 6. Variants State
  const [variantOptionGroups, setVariantOptionGroups] = useState<{ name: string; values: string[] }[]>([
    { name: 'Color', values: ['Black', 'White', 'Navy'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] }
  ]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(
    initialData?.variantCombinations || []
  );

  // 7. Attributes State
  const [attributes, setAttributes] = useState<ProductAttribute[]>(
    initialData?.attributes || [
      { name: 'Material', value: '100% Organic Cotton', group: 'Fabric' },
      { name: 'Fit Type', value: 'Regular Slim Fit', group: 'Apparel' },
      { name: 'Season', value: 'Summer / All-Year', group: 'Usage' },
      { name: 'Occasion', value: 'Casual & Semi-Formal', group: 'Style' }
    ]
  );
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // 8. Shipping State
  const [weight, setWeight] = useState<number>(initialData?.shippingInfo?.weight ?? initialData?.shipping?.weight ?? 0.75);
  const [length, setLength] = useState<number>(initialData?.shippingInfo?.dimensions?.length ?? initialData?.shipping?.length ?? 25);
  const [width, setWidth] = useState<number>(initialData?.shippingInfo?.dimensions?.width ?? initialData?.shipping?.width ?? 18);
  const [height, setHeight] = useState<number>(initialData?.shippingInfo?.dimensions?.height ?? initialData?.shipping?.height ?? 5);
  const [shippingClass, setShippingClass] = useState<string>(
    initialData?.shippingInfo?.shippingClass || initialData?.shipping?.shippingClass || 'Standard Express Parcel'
  );
  const [freeShipping, setFreeShipping] = useState<boolean>(
    initialData?.shippingInfo?.freeShipping ?? initialData?.shipping?.freeShipping ?? true
  );
  const [expressShipping, setExpressShipping] = useState<boolean>(
    initialData?.shippingInfo?.expressShipping ?? initialData?.shipping?.expressShipping ?? true
  );
  const [estimate, setEstimate] = useState<string>(
    initialData?.shippingInfo?.estimate || initialData?.shipping?.estimate || '2 - 4 Business Days'
  );
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>(
    initialData?.shippingInfo?.countryOfOrigin || initialData?.shipping?.countryOfOrigin || 'United States'
  );

  // 9. SEO State
  const [metaTitle, setMetaTitle] = useState<string>(initialData?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState<string>(initialData?.seo?.metaDescription || '');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(initialData?.seo?.keywords || ['swiftcart', 'fashion', 'premium']);
  const [canonicalUrl, setCanonicalUrl] = useState<string>(initialData?.seo?.canonicalUrl || '');

  // Subcategories mapping by Category
  const subcategoryOptions: Record<string, string[]> = {
    Clothing: ['T-Shirts', 'Hoodies & Sweatshirts', 'Jackets', 'Pants & Jeans', 'Dresses', 'Shorts'],
    Top: ['T-Shirts', 'Shirts', 'Polo', 'Tank Tops'],
    Bottom: ['Jeans', 'Trousers', 'Shorts', 'Joggers'],
    Dresses: ['Casual Dresses', 'Evening Gowns', 'Cocktail Dresses'],
    Outerwear: ['Coats', 'Jackets', 'Blazers', 'Windbreakers'],
    Footwear: ['Sneakers', 'Boots', 'Loafers', 'Sandals'],
    Accessories: ['Bags & Backpacks', 'Watches', 'Sunglasses', 'Belts & Hats'],
    Sofa: ['Sectional', '3-Seater Standard', 'Recliner', 'Loveseat'],
    Chair: ['Dining Chair', 'Lounge Chair', 'Ergonomic Office Chair'],
    Table: ['Coffee Table', 'Dining Table', 'Side Table', 'Desk']
  };

  // Auto Slug generation from Title (if not manually edited)
  useEffect(() => {
    if (title && !isSlugManuallyEdited) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isSlugManuallyEdited]);

  // Auto SKU & Barcode generation if empty
  useEffect(() => {
    if (!sku && !isEditMode) {
      const catCode = category ? category.slice(0, 3).toUpperCase() : 'SCT';
      setSku(`${catCode}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    if (!barcode && !isEditMode) {
      setBarcode(`BC-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    }
  }, [category, isEditMode]);

  // Dirty tracking for unsaved changes warning
  useEffect(() => {
    setIsDirty(true);
  }, [
    title,
    slug,
    sku,
    price,
    stock,
    category,
    status,
    visibility,
    mediaList,
    attributes,
    variantCombinations
  ]);

  // Prevent unload if dirty
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

  // Derived Pricing Calculations (NaN & Infinity safe)
  const calculatedDiscountAmount = useMemo(() => {
    const orig = Number(originalPrice) || 0;
    const currentPrice = Number(price) || 0;
    return orig > currentPrice ? orig - currentPrice : 0;
  }, [originalPrice, price]);

  const calculatedDiscountPercentage = useMemo(() => {
    const orig = Number(originalPrice) || 0;
    if (orig <= 0 || calculatedDiscountAmount <= 0) return 0;
    return Math.round((calculatedDiscountAmount / orig) * 100);
  }, [originalPrice, calculatedDiscountAmount]);

  const estimatedProfit = useMemo(() => {
    const currentPrice = Number(price) || 0;
    const cost = Number(costPrice) || 0;
    return currentPrice - cost;
  }, [price, costPrice]);

  const profitMargin = useMemo(() => {
    const currentPrice = Number(price) || 0;
    if (currentPrice <= 0 || estimatedProfit <= 0) return 0;
    const margin = (estimatedProfit / currentPrice) * 100;
    return isFinite(margin) ? Math.round(margin * 100) / 100 : 0;
  }, [price, estimatedProfit]);

  // Derived Stock Status
  const calculatedStockStatus = useMemo(() => {
    const currentStock = Number(stock) || 0;
    const threshold = Number(lowStockThreshold) || 10;
    if (currentStock <= 0) return 'out_of_stock';
    if (currentStock <= threshold) return 'low_stock';
    return 'in_stock';
  }, [stock, lowStockThreshold]);

  // Derived Available Stock
  const availableStock = useMemo(() => {
    const currentStock = Number(stock) || 0;
    const reserved = Number(reservedStock) || 0;
    return Math.max(0, currentStock - reserved);
  }, [stock, reservedStock]);

  // Completion calculation
  const missingRequiredFields = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push('Product Name');
    if (!category.trim()) missing.push('Category');
    if (Number(price) <= 0) missing.push('Selling Price (must be > 0)');
    if (mediaList.length === 0) missing.push('At least 1 Product Image');
    return missing;
  }, [title, category, price, mediaList]);

  const completionPercentage = useMemo(() => {
    let count = 0;
    const totalChecks = 10;
    if (title.trim()) count++;
    if (brand.trim()) count++;
    if (category.trim()) count++;
    if (description.trim()) count++;
    if (Number(price) > 0) count++;
    if (mediaList.length > 0) count++;
    if (Number(stock) >= 0) count++;
    if (sku.trim()) count++;
    if (attributes.length > 0) count++;
    if (metaTitle || description) count++;
    return Math.round((count / totalChecks) * 100);
  }, [title, brand, category, description, price, mediaList, stock, sku, attributes, metaTitle]);

  // Primary image
  const primaryMedia = useMemo(() => {
    return mediaList.find((m) => m.isPrimary) || mediaList[0] || null;
  }, [mediaList]);

  // Media Handlers
  const handleAddMediaUrl = () => {
    if (!newImageUrl.trim()) return;

    // Validate URL format
    if (!newImageUrl.startsWith('http://') && !newImageUrl.startsWith('https://')) {
      setMediaError('Image URL must start with http:// or https://');
      return;
    }

    setMediaError('');
    const newMediaItem: ProductMedia = {
      id: `med_${Date.now()}`,
      url: newImageUrl.trim(),
      alt: `${title || 'Product'} Image ${mediaList.length + 1}`,
      isPrimary: mediaList.length === 0,
      type: 'image',
      sortOrder: mediaList.length,
    };

    setMediaList([...mediaList, newMediaItem]);
    setNewImageUrl('');
    toast.success('Media image added to gallery.');
  };

  const handleRemoveMedia = (index: number) => {
    const updated = mediaList.filter((_, i) => i !== index);
    if (mediaList[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setMediaList(updated);
  };

  const handleSetPrimaryMedia = (index: number) => {
    const updated = mediaList.map((m, i) => ({
      ...m,
      isPrimary: i === index,
    }));
    setMediaList(updated);
    toast.success('Primary product image updated!');
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mediaList.length) return;
    const updated = [...mediaList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setMediaList(updated);
  };

  // Tags Handlers
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Generate Variant Combinations Matrix
  const handleGenerateVariants = () => {
    if (variantOptionGroups.length === 0 || variantOptionGroups.some((g) => g.values.length === 0)) {
      toast.error('Please define option groups and at least one option value each.');
      return;
    }

    let results: Record<string, string>[] = [{}];
    variantOptionGroups.forEach((group) => {
      const temp: Record<string, string>[] = [];
      results.forEach((acc) => {
        group.values.forEach((val) => {
          temp.push({ ...acc, [group.name]: val });
        });
      });
      results = temp;
    });

    const generated: VariantCombination[] = results.map((comb, idx) => {
      const optionSuffix = Object.values(comb).join('-').toUpperCase();
      return {
        id: `var-${Date.now()}-${idx}`,
        sku: `${sku || 'SKU'}-${optionSuffix}`,
        price: Number(price) || 49,
        stock: Math.floor((Number(stock) || 10) / results.length) || 5,
        barcode: `BC-VAR-${idx + 100}`,
        status: 'active',
        images: [primaryMedia?.url || ''],
        attributes: comb
      };
    });

    setVariantCombinations(generated);
    toast.success(`Generated ${generated.length} variant combinations matrix!`);
  };

  const handleUpdateVariantRow = (index: number, field: keyof VariantCombination, val: any) => {
    const updated = [...variantCombinations];
    updated[index] = { ...updated[index], [field]: val };
    setVariantCombinations(updated);
  };

  // Custom Attribute Handlers
  const handleAddAttribute = () => {
    if (newAttrName.trim() && newAttrVal.trim()) {
      setAttributes([
        ...attributes,
        { name: newAttrName.trim(), value: newAttrVal.trim(), group: 'Custom' }
      ]);
      setNewAttrName('');
      setNewAttrVal('');
      toast.success('Custom attribute added.');
    }
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes(attributes.filter((_, i) => i !== idx));
  };

  // SEO Keywords Handlers
  const handleAddKeyword = () => {
    if (keywordsInput.trim() && !keywords.includes(keywordsInput.trim())) {
      setKeywords([...keywords, keywordsInput.trim()]);
      setKeywordsInput('');
    }
  };

  // Form Save/Publish Handlers
  const handleSaveDraft = async () => {
    setStatus('draft');
    await submitForm('draft');
  };

  const handlePublish = async () => {
    if (missingRequiredFields.length > 0) {
      toast.error(`Please complete missing required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }
    setStatus('published');
    await submitForm('published');
  };

  const submitForm = async (targetStatus: 'draft' | 'published' | 'archived') => {
    setSubmitting(true);

    const imagesArray = mediaList.map((m) => m.url);
    const primaryUrl = primaryMedia?.url || imagesArray[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

    const pricingObj: ProductPricing = {
      price: Math.max(0, Number(price) || 0),
      originalPrice: Math.max(0, Number(originalPrice) || 0),
      costPrice: Math.max(0, Number(costPrice) || 0),
      discountType,
      discountValue: Number(discountValue) || 0,
      taxRate: Number(taxRate) || 0,
      currency
    };

    const inventoryObj: ProductInventory = {
      stock: Math.max(0, Number(stock) || 0),
      reservedStock: Math.max(0, Number(reservedStock) || 0),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 10),
      trackInventory,
      allowBackorder,
      allowBackorders: allowBackorder,
      minOrderQuantity: Math.max(1, Number(minOrderQuantity) || 1),
      maxOrderQuantity: Math.max(1, Number(maxOrderQuantity) || 10),
      warehouse,
      status: calculatedStockStatus
    };

    const shippingObj: ProductShipping = {
      weight: Math.max(0, Number(weight) || 0),
      dimensions: {
        length: Math.max(0, Number(length) || 0),
        width: Math.max(0, Number(width) || 0),
        height: Math.max(0, Number(height) || 0)
      },
      length: Math.max(0, Number(length) || 0),
      width: Math.max(0, Number(width) || 0),
      height: Math.max(0, Number(height) || 0),
      shippingClass,
      freeShipping,
      expressShipping,
      estimate,
      countryOfOrigin
    };

    const seoObj: ProductSEO = {
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || shortDescription || description.slice(0, 150),
      keywords,
      canonicalUrl: canonicalUrl || `https://swiftcart.com/products/${slug}`
    };

    const payload: Partial<Product> = {
      title,
      name: title,
      slug,
      sku,
      SKU: sku,
      barcode,
      brand,
      category,
      subcategory,
      tags,
      shortDescription,
      description,
      status: targetStatus,
      visibility,
      featured,
      isFeatured: featured,
      trending,
      newArrival,
      bestSeller,
      bestseller: bestSeller,

      price: Math.max(0, Number(price) || 0),
      originalPrice: Math.max(0, Number(originalPrice) || 0),
      salePrice: Math.max(0, Number(price) || 0),
      discountPercentage: calculatedDiscountPercentage,
      costPrice: Math.max(0, Number(costPrice) || 0),
      tax: Number(taxRate) || 0,
      currency,

      stock: Math.max(0, Number(stock) || 0),
      totalStock: Math.max(0, Number(stock) || 0),
      reservedStock: Math.max(0, Number(reservedStock) || 0),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 10),
      stockStatus: calculatedStockStatus,
      warehouse,
      trackInventory,
      allowBackorder,
      allowBackorders: allowBackorder,
      minOrderQuantity: Number(minOrderQuantity) || 1,
      maxOrderQuantity: Number(maxOrderQuantity) || 10,

      pricing: pricingObj,
      inventory: inventoryObj,
      media: mediaList,
      images: imagesArray.length > 0 ? imagesArray : [primaryUrl],
      thumbnail: primaryUrl,
      videos: videoUrl ? [videoUrl] : [],

      variants: variantOptionGroups.map((group) => ({
        id: group.name.toLowerCase(),
        name: group.name,
        options: group.values.map((val, idx) => ({
          id: `${group.name.toLowerCase()}-${idx}`,
          name: group.name,
          value: val,
          stock: Number(stock) || 10,
          sku: `${sku}-${val.toUpperCase()}`
        }))
      })),
      variantCombinations,

      attributes,
      specifications: attributes.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}),

      shippingInfo: shippingObj,
      shipping: shippingObj,

      seo: seoObj,
      rating: initialData?.rating ?? 4.8,
      reviewCount: initialData?.reviewCount ?? 15,
      updatedAt: new Date().toISOString()
    };

    try {
      if (isEditMode && initialData?.id) {
        await productService.updateProduct(initialData.id, payload);
        toast.success(`Product "${title}" updated successfully!`);
      } else {
        await productService.createProduct(payload);
        toast.success(`Product "${title}" ${targetStatus === 'draft' ? 'saved as draft' : 'published'} successfully!`);
      }
      setIsDirty(false);
      router.push('/dashboard/products');
    } catch (err: any) {
      toast.error('Failed to save product. Please check form values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setTargetNavigationUrl('/dashboard/products');
      setIsLeaveModalOpen(true);
    } else {
      router.push('/dashboard/products');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Sticky Action Header */}
      <div className="sticky top-4 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl border border-gray-150/80 dark:border-gray-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/products"
              className="text-xs font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline"
            >
              ← Products
            </Link>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-xs text-text-muted capitalize">
              {isEditMode ? 'Edit Product' : 'Create Product'}
            </span>
          </div>
          <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wide mt-1">
            {isEditMode ? `Edit: ${initialData?.title || 'Product'}` : 'Create New Product'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="rounded-xl border-gray-200 dark:border-gray-800"
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={submitting}
            className="rounded-xl border-gray-200 dark:border-gray-800 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-amber-500" />
            <span>Save Draft</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
          </Button>
        </div>
      </div>

      {/* Validation missing fields summary banner */}
      {missingRequiredFields.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Completion: {completionPercentage}%</strong> — Missing required fields for publish:{' '}
              {missingRequiredFields.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Two-Column Responsive Layout (Main 70% | Sidebar 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Main Content Area (~70%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: Basic Information */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8b6f47]" />
                Basic Information
              </h2>
              <span className="text-[11px] text-text-muted font-medium">* Required</span>
            </div>

            {/* Product Title */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Organic Cotton T-Shirt"
                className="w-full text-sm font-serif"
              />
            </div>

            {/* Slug & SKU & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Slug */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  placeholder="premium-cotton-tshirt"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              {/* SKU */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    SKU
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = `SCT-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                      setSku(generated);
                    }}
                    className="text-[10px] text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SCT-TSH-001"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Barcode (UPC / EAN)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="BC-984021482014"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Brand, Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Brand */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="SwiftCart Signature"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                >
                  <option value="Clothing">Clothing</option>
                  <option value="Top">Top</option>
                  <option value="Bottom">Bottom</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Sofa">Sofa</option>
                  <option value="Chair">Chair</option>
                  <option value="Table">Table</option>
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Subcategory
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                >
                  <option value="">Select Subcategory</option>
                  {(subcategoryOptions[category] || ['General']).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Tags */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                Tags & Keywords
              </label>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200"
                  >
                    <Tag className="w-3 h-3 text-[#8b6f47]" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-400 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (e.g. summer, cotton) and press Enter"
                  className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  className="rounded-xl"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                Short Description
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary displayed on product cards and search results..."
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                Detailed Product Description
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed specifications, features, washing guidelines, craftsmanship..."
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 2: Media Management */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8b6f47]" />
                Media Gallery
              </h2>
              <span className="text-xs text-text-muted">
                Supported formats: JPG, PNG, WEBP
              </span>
            </div>

            {/* Add Image URL Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Add Image URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddMediaUrl}
                  className="rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Image</span>
                </Button>
              </div>
              {mediaError && (
                <p className="text-[11px] text-rose-500 font-medium">{mediaError}</p>
              )}
            </div>

            {/* Media Items List & Cards */}
            {mediaList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaList.map((media, idx) => (
                  <div
                    key={media.id || idx}
                    className={`relative rounded-2xl border overflow-hidden group bg-gray-50 dark:bg-gray-800 p-2 space-y-2 transition-all ${
                      media.isPrimary
                        ? 'border-[#8b6f47] ring-2 ring-[#8b6f47]/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <img
                        src={media.url}
                        alt={media.alt || 'Product'}
                        className="w-full h-full object-cover"
                      />

                      {media.isPrimary && (
                        <span className="absolute top-2 left-2 bg-[#8b6f47] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Primary Image
                        </span>
                      )}

                      {/* Action buttons overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!media.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryMedia(idx)}
                            className="p-1.5 bg-white dark:bg-gray-900 text-[#8b6f47] rounded-lg text-[10px] font-bold shadow-xs hover:scale-105 transition-transform"
                            title="Set as primary"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold shadow-xs hover:scale-105 transition-transform"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Reordering Controls */}
                    <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                      <span>#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMedia(idx, 'up')}
                          className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mediaList.length - 1}
                          onClick={() => handleMoveMedia(idx, 'down')}
                          className="p-1 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-text-muted space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-xs font-medium">No media uploaded yet.</p>
                <p className="text-[11px] text-text-muted">
                  Add at least one product image to publish.
                </p>
              </div>
            )}

            {/* Optional Video URL */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                Product Video URL (Optional)
              </label>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=sample or MP4 URL"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#8b6f47]" />
                Pricing Strategy
              </h2>
              <span className="text-xs text-text-muted">Currency: {currency}</span>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Selling Price */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Selling Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Original Price */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Original Price (MSRP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Cost Price */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Cost Price (Unit Cost)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tax & Discount Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            {/* Live Pricing Summary Box */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-150 dark:border-emerald-900/40 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Selling Price
                </span>
                <p className="text-base font-bold font-serif text-emerald-900 dark:text-emerald-200">
                  ${price}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Calculated Discount
                </span>
                <p className="text-base font-bold font-serif text-emerald-900 dark:text-emerald-200">
                  {calculatedDiscountPercentage}% OFF (${calculatedDiscountAmount.toFixed(2)})
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Estimated Profit
                </span>
                <p className="text-base font-bold font-serif text-emerald-900 dark:text-emerald-200">
                  ${estimatedProfit.toFixed(2)}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Profit Margin
                </span>
                <p className="text-base font-bold font-serif text-emerald-900 dark:text-emerald-200">
                  {profitMargin}%
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: Inventory Management */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-5 h-5 text-[#8b6f47]" />
                Inventory Control
              </h2>
              
              {/* Derived status badge */}
              {calculatedStockStatus === 'out_of_stock' ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  Out of Stock
                </span>
              ) : calculatedStockStatus === 'low_stock' ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  Low Stock
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  In Stock
                </span>
              )}
            </div>

            {/* Inventory Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Total Stock */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Reserved Stock */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Reserved Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={reservedStock}
                  onChange={(e) => setReservedStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Warehouse & Order Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Warehouse Location
                </label>
                <input
                  type="text"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  placeholder="Main Hub - NY"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Min Order Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  Max Order Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxOrderQuantity}
                  onChange={(e) => setMaxOrderQuantity(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Track Stock Quantity</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBackorder}
                  onChange={(e) => setAllowBackorder(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Allow Backorders</span>
              </label>
            </div>
          </div>

          {/* SECTION 5: Variant Foundation */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#8b6f47]" />
                  Product Variants Matrix
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Define variant options (Color, Size, Material) to generate SKU combinations.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateVariants}
                className="rounded-xl flex items-center gap-1.5 border-[#8b6f47] text-[#8b6f47] dark:text-[#c9a96b]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Combinations</span>
              </Button>
            </div>

            {/* Generated Variant Table */}
            {variantCombinations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-500">
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {variantCombinations.map((comb, idx) => (
                      <tr key={comb.id || idx}>
                        <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                          {Object.entries(comb.attributes)
                            .map(([k, v]) => `${v}`)
                            .join(' / ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={comb.sku}
                            onChange={(e) => handleUpdateVariantRow(idx, 'sku', e.target.value)}
                            className="w-32 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={comb.price}
                            onChange={(e) => handleUpdateVariantRow(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={comb.stock}
                            onChange={(e) => handleUpdateVariantRow(idx, 'stock', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={comb.status || 'active'}
                            onChange={(e) => handleUpdateVariantRow(idx, 'status', e.target.value as any)}
                            className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">
                No variants matrix generated yet. Click "Generate Combinations" above.
              </p>
            )}
          </div>

          {/* SECTION 6: Custom Attributes */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-4 border-gray-100 dark:border-gray-800">
              <Layers className="w-5 h-5 text-[#8b6f47]" />
              Specifications & Custom Attributes
            </h2>

            {/* List */}
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{attr.name}:</span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{attr.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="text-gray-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Attribute */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="Attribute Name (e.g. Care)"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Attribute Value (e.g. Machine Wash Cold)"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttribute}
                className="rounded-xl"
              >
                Add
              </Button>
            </div>
          </div>

          {/* SECTION 7: Shipping Details */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-4 border-gray-100 dark:border-gray-800">
              <Truck className="w-5 h-5 text-[#8b6f47]" />
              Shipping & Logistics
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Free Shipping Available</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expressShipping}
                  onChange={(e) => setExpressShipping(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
                <span>Express Courier Shipping</span>
              </label>
            </div>
          </div>

          {/* SECTION 8: SEO Foundation */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-4 border-gray-100 dark:border-gray-800">
              <Globe className="w-5 h-5 text-[#8b6f47]" />
              SEO Engine Optimization
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || 'Product Meta Title'}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={shortDescription || 'Compelling search preview summary...'}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              />
            </div>

            {/* Google Search Visual Preview Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Google Search Result Preview
              </span>
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                {metaTitle || title || 'Product Title | SwiftCart'}
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                https://swiftcart.com/products/{slug || 'product-slug'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                {metaDescription || shortDescription || description || 'Product description preview...'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Area (~30%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status & Visibility Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150/60 dark:border-gray-800/80 shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-800">
              Publish Status & Flags
            </h3>

            {/* Status Selector */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Visibility Selector */}
            <div>
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              >
                <option value="public">Public (Catalog)</option>
                <option value="private">Private (Admin only)</option>
                <option value="hidden">Hidden (Link only)</option>
              </select>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center justify-between text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <span>Featured Product</span>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <span>New Arrival</span>
                <input
                  type="checkbox"
                  checked={newArrival}
                  onChange={(e) => setNewArrival(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <span>Bestseller Badge</span>
                <input
                  type="checkbox"
                  checked={bestSeller}
                  onChange={(e) => setBestSeller(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                <span>Trending Badge</span>
                <input
                  type="checkbox"
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                  className="rounded text-[#8b6f47] focus:ring-[#8b6f47]"
                />
              </label>
            </div>

            {/* LIVE PRODUCT CARD PREVIEW PANEL */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Live Product Card Preview
              </span>
              
              <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm p-3 space-y-2">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={primaryMedia?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'}
                    alt={title || 'Product Preview'}
                    className="w-full h-full object-cover"
                  />
                  {calculatedDiscountPercentage > 0 && (
                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      -{calculatedDiscountPercentage}%
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                    {brand}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-white truncate">
                    {title || 'Product Title'}
                  </h4>

                  {/* Rating Stars Mock */}
                  <div className="flex items-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[10px] text-text-muted ml-1">(15)</span>
                  </div>

                  {/* Pricing line */}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-gray-900 dark:text-white font-serif text-sm">
                      ${price}
                    </span>
                    {originalPrice > price && (
                      <span className="text-xs text-text-muted line-through">
                        ${originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Modal when Leaving with Unsaved Changes */}
      <ConfirmationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          setIsDirty(false);
          if (targetNavigationUrl) router.push(targetNavigationUrl);
        }}
        title="Unsaved Changes"
        message="You have unsaved changes on this product form. Are you sure you want to leave?"
        confirmText="Leave Page"
        variant="warning"
      />

    </div>
  );
}
