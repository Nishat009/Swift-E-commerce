'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
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
import NumberInput from '@/components/ui/NumberInput';
import PreviewImage from '@/components/ui/PreviewImage';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { AdminButton, AdminEmpty, Pill, SectionHeader, table } from '@/components/admin/AdminUI';
import { cn } from '@/lib/utils';
import {
  Save,
  Send,
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Tag,
  MoveUp,
  MoveDown,
  Video,
  Star,
  Info
} from 'lucide-react';

const inputClass =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const compactInputClass =
  'h-8 rounded-lg border border-line bg-surface px-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const textareaClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const selectInputClass =
  'h-9 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-sm text-stone-900 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark] ' +
  'bg-no-repeat bg-[right_0.65rem_center] bg-[length:1rem_1rem] ' +
  'bg-[url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%239ca3af%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)]';
const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const checkboxClass = 'size-4 shrink-0 cursor-pointer rounded accent-[#8b6f47] dark:[color-scheme:dark]';
const checkboxLabelClass = 'flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300';
const uploadLabelClass =
  'inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-stone-300 bg-surface px-3.5 text-sm font-medium text-stone-700 transition-colors hover:border-[#8b6f47]/60 hover:text-[#8b6f47] dark:border-white/15 dark:text-stone-200 dark:hover:border-[#c9a96b]/60 dark:hover:text-[#c9a96b]';
const mediaIconButtonClass =
  'inline-flex size-7 items-center justify-center rounded-md border border-line bg-surface text-stone-500 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-stone-400 dark:hover:text-white cursor-pointer';

/** One block of the form: a heading row and its fields. */
function FormSection({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <SectionHeader title={title} description={description} actions={actions} className="mb-5 border-b border-line pb-4" />
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, required, hint, action, className, children }: { label: string; htmlFor?: string; required?: boolean; hint?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-stone-600 dark:text-stone-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {action && <div className="text-xs leading-4">{action}</div>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </div>
  );
}

function SummaryCell({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className="bg-stone-50 px-4 py-3 dark:bg-[#1b1a18]">
      <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className={cn('mt-1 text-base font-semibold tabular-nums text-stone-900 dark:text-white', className)}>{value}</dd>
      {hint && <dd className="mt-0.5 text-[11px] tabular-nums text-stone-500 dark:text-stone-400">{hint}</dd>}
    </div>
  );
}

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
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
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
      : (initialData?.images || []).map((url, idx) => ({
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
  const [modelWearingImage, setModelWearingImage] = useState<string>(initialData?.modelWearingImage || '');
  const [mediaError, setMediaError] = useState('');

  // 4. Pricing State
  // Storefront convention: price is the list price and the final price is price * (1 - discountPercentage/100).
  // The form edits "selling price" (what the shopper pays) and an optional "original price" (list/MSRP).
  const initialListPrice = initialData?.price ?? 0;
  const initialDiscountPct = initialData?.discountPercentage ?? 0;
  const initialIsLegacyPair = (initialData?.originalPrice ?? 0) > initialListPrice;
  const initialSelling = initialIsLegacyPair
    ? initialListPrice
    : initialDiscountPct > 0
      ? Math.round(initialListPrice * (1 - initialDiscountPct / 100) * 100) / 100
      : initialListPrice;
  const initialOriginal = initialIsLegacyPair
    ? (initialData?.originalPrice ?? 0)
    : initialDiscountPct > 0
      ? initialListPrice
      : 0;
  const [price, setPrice] = useState<number>(initialSelling);
  const [originalPrice, setOriginalPrice] = useState<number>(initialOriginal);
  const [costPrice, setCostPrice] = useState<number>(initialData?.costPrice ?? 0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    initialData?.pricing?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.pricing?.discountValue || (initialData?.discountPercentage ?? 0)
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.pricing?.taxRate ?? initialData?.tax ?? 5);
  const [currency, setCurrency] = useState<string>(initialData?.pricing?.currency || initialData?.currency || 'USD');

  // 5. Inventory State
  const [stock, setStock] = useState<number>(initialData?.stock ?? 0);
  const [reservedStock, setReservedStock] = useState<number>(initialData?.reservedStock ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialData?.lowStockThreshold ?? 10);
  const [warehouse, setWarehouse] = useState<string>(initialData?.warehouse || '');
  const [trackInventory, setTrackInventory] = useState<boolean>(initialData?.trackInventory ?? true);
  const [allowBackorder, setAllowBackorder] = useState<boolean>(
    initialData?.allowBackorder ?? initialData?.allowBackorders ?? false
  );
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(initialData?.minOrderQuantity ?? 1);
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<number>(initialData?.maxOrderQuantity ?? 10);

  // 6. Variants State
  // Start from the product's real variant groups; a new product starts with none.
  const initialVariantGroups = (initialData?.variants || []).map((g: any) => ({
    name: String(g.name),
    values: (g.options || []).map((o: any) => String(o.value ?? o.name)),
  }));
  const [variantOptionGroups, setVariantOptionGroups] = useState<{ name: string; values: string[] }[]>(initialVariantGroups);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(
    initialData?.variantCombinations || []
  );

  // 7. Attributes State
  // Attributes come from the product's attribute list, else from its stored specifications, else none.
  const [attributes, setAttributes] = useState<ProductAttribute[]>(() => {
    if (initialData?.attributes && initialData.attributes.length > 0) return initialData.attributes;
    const specs = (initialData as any)?.specifications;
    if (specs && typeof specs === 'object') {
      return Object.entries(specs)
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
        .map(([name, value]) => ({ name, value: String(value), group: 'General' }));
    }
    return [];
  });
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // 8. Shipping State
  const [weight, setWeight] = useState<number>(initialData?.shippingInfo?.weight ?? initialData?.shipping?.weight ?? 0);
  const [length, setLength] = useState<number>(initialData?.shippingInfo?.dimensions?.length ?? initialData?.shipping?.length ?? 0);
  const [width, setWidth] = useState<number>(initialData?.shippingInfo?.dimensions?.width ?? initialData?.shipping?.width ?? 0);
  const [height, setHeight] = useState<number>(initialData?.shippingInfo?.dimensions?.height ?? initialData?.shipping?.height ?? 0);
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
  const [keywords, setKeywords] = useState<string[]>(initialData?.seo?.keywords || []);
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

  // Categories come from the database (managed in Admin > Categories)
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/categories')
      .then((res) => {
        if (cancelled) return;
        const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setCategoryOptions(list.map((c) => ({ value: String(c.name).toLowerCase(), label: c.name })));
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load categories from the server.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const uploadImageFile = async (file: File): Promise<string> => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      throw new Error('Choose a JPG, PNG, WebP or GIF image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be under 5 MB.');
    }
    const body = new FormData();
    body.append('image', file);
    try {
      const res = await apiClient.post('/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url;
      if (!url) throw new Error('Upload succeeded but no image URL was returned.');
      return url;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Image upload failed.');
    }
  };

  const handleUploadMediaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    setMediaError('');
    let next = [...mediaList];
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImageFile(file);
        next = [
          ...next,
          {
            id: `med_${Date.now()}_${next.length}`,
            url,
            alt: `${title || 'Product'} Image ${next.length + 1}`,
            isPrimary: next.length === 0,
            type: 'image',
            sortOrder: next.length,
          },
        ];
      }
      toast.success('Image uploaded.');
    } catch (err: any) {
      setMediaError(err.message);
    } finally {
      setMediaList(next);
      setUploadingMedia(false);
    }
  };

  const handleUploadModelImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingModel(true);
    try {
      setModelWearingImage(await uploadImageFile(file));
      toast.success('Model image uploaded.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingModel(false);
    }
  };

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
    if (mediaList.length === 0) {
      toast.error('Add at least one product image (upload or URL) before saving.');
      return;
    }
    if (!title.trim() || !category.trim() || !brand.trim() || !description.trim()) {
      toast.error('Product name, brand, category and description are required.');
      return;
    }
    setSubmitting(true);

    const imagesArray = mediaList.map((m) => m.url);
    const primaryUrl = primaryMedia?.url || imagesArray[0];
    const sellingPrice = Math.max(0, Number(price) || 0);
    const listPrice = Math.max(sellingPrice, Number(originalPrice) || 0);

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
      canonicalUrl: canonicalUrl || ''
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

      // price = list price; salePrice = what the shopper pays; discountPercentage ties them together
      price: listPrice,
      originalPrice: listPrice > sellingPrice ? listPrice : 0,
      salePrice: sellingPrice,
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
      productImage: primaryUrl,
      modelWearingImage: modelWearingImage.trim() || null,
      videos: videoUrl ? [videoUrl] : [],

      variants: JSON.stringify(variantOptionGroups) === JSON.stringify(initialVariantGroups) && initialData?.variants
        ? initialData.variants // untouched: keep each option's own stock / SKU
        : variantOptionGroups.map((group) => ({
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
      // rating / reviewCount are maintained by the reviews system; the form never overwrites them
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
      toast.error(err?.message || 'Failed to save product. Please check form values.');
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
    <div>
      {/* Fields still needed before the product can be published */}
      {missingRequiredFields.length > 0 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <span className="font-semibold">Needed before publishing:</span>{' '}
            <span className="text-amber-800 dark:text-amber-300/90">{missingRequiredFields.join(', ')}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Basic information */}
          <FormSection
            title="Basic information"
            description="Name, identifiers and how the product is described."
            actions={<span className="text-xs text-stone-500 dark:text-stone-400"><span className="text-red-500">*</span> Required</span>}
          >
            <Field label="Product name" htmlFor="pf-title" required>
              <input
                id="pf-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Organic Cotton T-Shirt"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="URL slug" htmlFor="pf-slug">
                <input
                  id="pf-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  placeholder="premium-cotton-tshirt"
                  className={inputClass}
                />
              </Field>

              <Field
                label="SKU"
                htmlFor="pf-sku"
                action={
                  <button
                    type="button"
                    onClick={() => {
                      const generated = `SCT-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                      setSku(generated);
                    }}
                    className="text-xs font-medium text-stone-500 hover:text-[#8b6f47] dark:text-stone-400 dark:hover:text-[#c9a96b] cursor-pointer"
                  >
                    Auto-generate
                  </button>
                }
              >
                <input
                  id="pf-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SCT-TSH-001"
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field label="Barcode (UPC / EAN)" htmlFor="pf-barcode">
                <input
                  id="pf-barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="BC-984021482014"
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Brand" htmlFor="pf-brand" required>
                <input
                  id="pf-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="SwiftCart Signature"
                  className={inputClass}
                />
              </Field>

              <Field label="Category" htmlFor="pf-category" required>
                <select
                  id="pf-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                  className={selectInputClass}
                >
                  <option value="">Select category</option>
                  {category && !categoryOptions.some((o) => o.value === category.toLowerCase()) && (
                    <option value={category}>{category}</option>
                  )}
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subcategory" htmlFor="pf-subcategory">
                <input
                  id="pf-subcategory"
                  type="text"
                  list="subcategory-suggestions"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="Optional, e.g. Jeans"
                  className={inputClass}
                />
                <datalist id="subcategory-suggestions">
                  {(subcategoryOptions[category.charAt(0).toUpperCase() + category.slice(1)] || []).map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Tags" htmlFor="pf-tag" hint="Press Enter or Add after each tag.">
              {tags.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-stone-100 py-1 pl-2 pr-1 text-xs font-medium text-stone-700 dark:bg-white/[0.06] dark:text-stone-200"
                    >
                      <Tag className="size-3 text-stone-400" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 inline-flex size-4 items-center justify-center rounded text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-stone-200 cursor-pointer"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  id="pf-tag"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. summer, cotton"
                  className={inputClass}
                />
                <AdminButton onClick={handleAddTag}>
                  <Plus className="size-4" /> Add
                </AdminButton>
              </div>
            </Field>

            <Field label="Short description" htmlFor="pf-short" hint="Shown on product cards and in search results.">
              <textarea
                id="pf-short"
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A one or two line summary"
                className={textareaClass}
              />
            </Field>

            <Field label="Description" htmlFor="pf-description" required>
              <textarea
                id="pf-description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Materials, fit, features, care instructions..."
                className={`${textareaClass} leading-relaxed`}
              />
            </Field>
          </FormSection>

          {/* Media */}
          <FormSection
            title="Media"
            description="Product images, an optional video and the Dress Room model image."
            actions={<span className="text-xs text-stone-500 dark:text-stone-400">JPG, PNG, WebP or GIF</span>}
          >
            <Field label="Add an image by URL" htmlFor="pf-image-url">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="pf-image-url"
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
                  className={inputClass}
                />
                <AdminButton onClick={handleAddMediaUrl}>
                  <Plus className="size-4" /> Add image
                </AdminButton>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label className={uploadLabelClass}>
                  <Upload className="size-4" />
                  {uploadingMedia ? 'Uploading...' : 'Upload from device'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="sr-only"
                    disabled={uploadingMedia}
                    onChange={(e) => {
                      void handleUploadMediaFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                <span className="text-xs text-stone-500 dark:text-stone-400">Max 5 MB each</span>
              </div>
              {newImageUrl.trim() && (
                <div className="mt-3 flex items-center gap-3">
                  <PreviewImage src={newImageUrl.trim()} className="size-20 rounded-lg border border-line bg-stone-100 object-cover dark:bg-white/5" />
                  <span className="text-xs text-stone-500 dark:text-stone-400">Preview. Click &quot;Add image&quot; to put it in the gallery.</span>
                </div>
              )}
              {mediaError && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{mediaError}</p>}
            </Field>

            {mediaList.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {mediaList.map((media, idx) => (
                  <div
                    key={media.id || idx}
                    className={`space-y-2 rounded-lg border bg-stone-50 p-2 dark:bg-white/[0.03] ${
                      media.isPrimary ? 'border-[#8b6f47]/70 ring-1 ring-[#8b6f47]/30 dark:border-[#c9a96b]/60 dark:ring-[#c9a96b]/25' : 'border-line'
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100 dark:bg-white/5">
                      <PreviewImage src={media.url} alt={media.alt || 'Product'} className="h-full w-full object-cover" />
                      {media.isPrimary && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-[#8b6f47] px-1.5 py-0.5 text-[11px] font-medium text-white dark:bg-[#c9a96b] dark:text-stone-900">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 px-0.5">
                      <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMedia(idx, 'up')}
                          className={mediaIconButtonClass}
                          title="Move earlier"
                          aria-label="Move earlier"
                        >
                          <MoveUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mediaList.length - 1}
                          onClick={() => handleMoveMedia(idx, 'down')}
                          className={mediaIconButtonClass}
                          title="Move later"
                          aria-label="Move later"
                        >
                          <MoveDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className={`${mediaIconButtonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400`}
                          title="Delete image"
                          aria-label="Delete image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {!media.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryMedia(idx)}
                        className="h-8 w-full rounded-md border border-line bg-surface text-xs font-medium text-stone-700 transition-colors hover:border-[#8b6f47]/50 hover:text-[#8b6f47] dark:text-stone-200 dark:hover:border-[#c9a96b]/50 dark:hover:text-[#c9a96b] cursor-pointer"
                        title="Set as primary"
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line">
                <AdminEmpty icon={ImageIcon} title="No images yet" description="Add at least one product image to publish." />
              </div>
            )}

            <Field label="Product video URL" htmlFor="pf-video" hint="Optional. A YouTube link or an MP4 URL.">
              <div className="relative">
                <Video className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="pf-video"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=sample or MP4 URL"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>

            {/* Dress Room model image */}
            <div className="space-y-4 rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    <Sparkles className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" />
                    Dress Room model image
                  </h3>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                    The product image is used everywhere in the store (cards, details, cart). The model image shows a model wearing this exact product and is used inside the Dress Room.
                  </p>
                </div>
                {modelWearingImage ? <Pill tone="success" dot>Model image set</Pill> : <Pill tone="neutral">Optional, not set</Pill>}
              </div>

              <Field label="Model image URL" htmlFor="pf-model">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="pf-model"
                    type="text"
                    value={modelWearingImage}
                    onChange={(e) => setModelWearingImage(e.target.value)}
                    placeholder="https://... or /images/dress-room/shirt-model.jpg"
                    className={inputClass}
                  />
                  <div className="flex items-center gap-2">
                    <label className={uploadLabelClass}>
                      <Upload className="size-4" />
                      {uploadingModel ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={uploadingModel}
                        onChange={(e) => {
                          void handleUploadModelImage(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {modelWearingImage && (
                      <AdminButton variant="danger" onClick={() => setModelWearingImage('')}>
                        <Trash2 className="size-4" /> Remove
                      </AdminButton>
                    )}
                  </div>
                </div>
              </Field>

              {modelWearingImage ? (
                <div className="flex items-center gap-4 rounded-lg bg-stone-50 p-3 dark:bg-white/[0.03]">
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-stone-100 dark:bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={modelWearingImage}
                      alt="Model wearing preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-[#8b6f47] dark:text-[#c9a96b]">Dress Room preview</p>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Model wearing &quot;{title || 'this product'}&quot;</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      When shoppers open the Dress Room and choose &quot;Model&quot;, this image is shown without a page reload.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-line px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                  No model image yet. Without one, the Dress Room uses the standard product image and the Model toggle is turned off.
                </p>
              )}
            </div>
          </FormSection>

          {/* Pricing */}
          <FormSection
            title="Pricing"
            description="What shoppers pay, the list price and your unit cost."
            actions={<span className="text-xs text-stone-500 dark:text-stone-400">Currency: {currency}</span>}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Selling price" htmlFor="pf-price" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
                  <NumberInput
                    id="pf-price"
                    emptyWhenZero
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={price}
                    onValueChange={(n) => setPrice(n || 0)}
                    className={`${inputClass} pl-7 tabular-nums`}
                  />
                </div>
              </Field>

              <Field label="Original price (MSRP)" htmlFor="pf-original">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
                  <NumberInput
                    id="pf-original"
                    emptyWhenZero
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onValueChange={(n) => setOriginalPrice(n || 0)}
                    className={`${inputClass} pl-7 tabular-nums`}
                  />
                </div>
              </Field>

              <Field label="Cost price (per unit)" htmlFor="pf-cost">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
                  <NumberInput
                    id="pf-cost"
                    emptyWhenZero
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onValueChange={(n) => setCostPrice(n || 0)}
                    className={`${inputClass} pl-7 tabular-nums`}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Tax rate (%)" htmlFor="pf-tax">
                <NumberInput
                  id="pf-tax"
                  min="0"
                  max="100"
                  value={taxRate}
                  onValueChange={(n) => setTaxRate(n || 0)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>

              <Field label="Discount type" htmlFor="pf-discount-type">
                <select
                  id="pf-discount-type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className={selectInputClass}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount ($)</option>
                </select>
              </Field>

              <Field label="Currency" htmlFor="pf-currency">
                <select
                  id="pf-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={selectInputClass}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </Field>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
              <SummaryCell label="Selling price" value={`$${(Number(price) || 0).toFixed(2)}`} />
              <SummaryCell
                label="Discount"
                value={`${calculatedDiscountPercentage}% off`}
                hint={`$${calculatedDiscountAmount.toFixed(2)} below list price`}
              />
              <SummaryCell
                label="Estimated profit"
                value={`$${estimatedProfit.toFixed(2)}`}
                className={estimatedProfit < 0 ? 'text-red-600 dark:text-red-400' : undefined}
              />
              <SummaryCell label="Profit margin" value={`${profitMargin}%`} />
            </dl>
          </FormSection>

          {/* Inventory */}
          <FormSection
            title="Inventory"
            description="Stock levels, order limits and backorders."
            actions={
              calculatedStockStatus === 'out_of_stock' ? (
                <Pill tone="danger" dot>Out of stock</Pill>
              ) : calculatedStockStatus === 'low_stock' ? (
                <Pill tone="warning" dot>Low stock</Pill>
              ) : (
                <Pill tone="success" dot>In stock</Pill>
              )
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Stock quantity" htmlFor="pf-stock" required>
                <NumberInput
                  id="pf-stock"
                  integer
                  min="0"
                  value={stock}
                  onValueChange={(n) => setStock(n || 0)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>

              <Field label="Reserved stock" htmlFor="pf-reserved">
                <NumberInput
                  id="pf-reserved"
                  integer
                  min="0"
                  value={reservedStock}
                  onValueChange={(n) => setReservedStock(n || 0)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>

              <Field label="Low-stock threshold" htmlFor="pf-threshold">
                <NumberInput
                  id="pf-threshold"
                  integer
                  min="1"
                  value={lowStockThreshold}
                  onValueChange={(n) => setLowStockThreshold(n || 10)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Warehouse location" htmlFor="pf-warehouse">
                <input
                  id="pf-warehouse"
                  type="text"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  placeholder="Main Hub - NY"
                  className={inputClass}
                />
              </Field>

              <Field label="Min order quantity" htmlFor="pf-min-qty">
                <NumberInput
                  id="pf-min-qty"
                  integer
                  min="1"
                  value={minOrderQuantity}
                  onValueChange={(n) => setMinOrderQuantity(n || 1)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>

              <Field label="Max order quantity" htmlFor="pf-max-qty">
                <NumberInput
                  id="pf-max-qty"
                  integer
                  min="1"
                  value={maxOrderQuantity}
                  onValueChange={(n) => setMaxOrderQuantity(n || 10)}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className={checkboxClass}
                />
                Track stock quantity
              </label>
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  checked={allowBackorder}
                  onChange={(e) => setAllowBackorder(e.target.checked)}
                  className={checkboxClass}
                />
                Allow backorders
              </label>
            </div>
          </FormSection>

          {/* Variants */}
          <FormSection
            title="Variants"
            description="Define options such as colour, size or material, then generate a SKU for each combination."
            actions={
              <AdminButton size="sm" onClick={handleGenerateVariants}>
                <Sparkles className="size-3.5" /> Generate combinations
              </AdminButton>
            }
          >
            {variantCombinations.length > 0 ? (
              <div className={table.wrap}>
                <table className={table.table}>
                  <thead className={table.thead}>
                    <tr>
                      <th className={table.th}>Variant</th>
                      <th className={table.th}>SKU</th>
                      <th className={table.th}>Price</th>
                      <th className={table.th}>Stock</th>
                      <th className={table.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={table.tbody}>
                    {variantCombinations.map((comb, idx) => (
                      <tr key={comb.id || idx} className={table.tr}>
                        <td className={`${table.td} whitespace-nowrap font-medium text-stone-900 dark:text-stone-100`}>
                          {Object.values(comb.attributes).join(' / ')}
                        </td>
                        <td className={table.td}>
                          <input
                            type="text"
                            value={comb.sku}
                            onChange={(e) => handleUpdateVariantRow(idx, 'sku', e.target.value)}
                            className={`${compactInputClass} w-40 font-mono text-xs`}
                            aria-label="Variant SKU"
                          />
                        </td>
                        <td className={table.td}>
                          <NumberInput
                            emptyWhenZero
                            placeholder="0.00"
                            value={comb.price}
                            onValueChange={(n) => handleUpdateVariantRow(idx, 'price', n || 0)}
                            className={`${compactInputClass} w-24 text-right tabular-nums`}
                            aria-label="Variant price"
                          />
                        </td>
                        <td className={table.td}>
                          <NumberInput
                            integer
                            value={comb.stock}
                            onValueChange={(n) => handleUpdateVariantRow(idx, 'stock', n || 0)}
                            className={`${compactInputClass} w-20 text-right tabular-nums`}
                            aria-label="Variant stock"
                          />
                        </td>
                        <td className={table.td}>
                          <select
                            value={comb.status || 'active'}
                            onChange={(e) => handleUpdateVariantRow(idx, 'status', e.target.value as any)}
                            className={`${selectInputClass} h-8 min-w-[110px]`}
                            aria-label="Variant status"
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
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
                No combinations yet. Use &quot;Generate combinations&quot; to create them.
              </p>
            )}
          </FormSection>

          {/* Specifications */}
          <FormSection title="Specifications" description="Fabric, fit, care and other details shown on the product page.">
            {attributes.length > 0 && (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {attributes.map((attr, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="text-stone-500 dark:text-stone-400">{attr.name}</span>
                      <span className="ml-2 font-medium text-stone-900 dark:text-stone-100">{attr.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 cursor-pointer"
                      aria-label={`Remove ${attr.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="Name, e.g. Care"
                className={inputClass}
                aria-label="Attribute name"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Value, e.g. Machine wash cold"
                className={inputClass}
                aria-label="Attribute value"
              />
              <AdminButton onClick={handleAddAttribute}>
                <Plus className="size-4" /> Add
              </AdminButton>
            </div>
          </FormSection>

          {/* SECTION 7: Shipping & Logistics - hidden for now (backend keeps its defaults; payload still sends the existing/default values). */}

          {/* SEO */}
          <FormSection title="SEO" description="How the product appears in search engine results.">
            <Field label="Meta title" htmlFor="pf-meta-title">
              <input
                id="pf-meta-title"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || 'Product Meta Title'}
                className={inputClass}
              />
            </Field>

            <Field label="Meta description" htmlFor="pf-meta-description">
              <textarea
                id="pf-meta-description"
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={shortDescription || 'Compelling search preview summary...'}
                className={textareaClass}
              />
            </Field>

            <div className="space-y-1 rounded-lg border border-line bg-stone-50 p-4 dark:bg-white/[0.03]">
              <p className="mb-2 text-xs font-medium text-stone-500 dark:text-stone-400">Search result preview</p>
              <p className="truncate text-base text-blue-700 dark:text-blue-400">
                {metaTitle || title || 'Product Title | SwiftCart'}
              </p>
              <p className="truncate font-mono text-xs text-emerald-700 dark:text-emerald-400">
                https://swiftcart.com/products/{slug || 'product-slug'}
              </p>
              <p className="line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
                {metaDescription || shortDescription || description || 'Product description preview...'}
              </p>
            </div>
          </FormSection>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-20">
            <FormSection title="Status & visibility">
              <Field label="Status" htmlFor="pf-status">
                <select
                  id="pf-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={selectInputClass}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>

              <Field label="Visibility" htmlFor="pf-visibility">
                <select
                  id="pf-visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className={selectInputClass}
                >
                  <option value="public">Public (catalog)</option>
                  <option value="private">Private (admin only)</option>
                  <option value="hidden">Hidden (link only)</option>
                </select>
              </Field>

              <fieldset>
                <legend className={labelClass}>Badges</legend>
                <div className="divide-y divide-line rounded-lg border border-line">
                  {[
                    { label: 'Featured product', checked: featured, set: setFeatured },
                    { label: 'New arrival', checked: newArrival, set: setNewArrival },
                    { label: 'Bestseller', checked: bestSeller, set: setBestSeller },
                    { label: 'Trending', checked: trending, set: setTrending },
                  ].map((flag) => (
                    <label key={flag.label} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/[0.02]">
                      <span>{flag.label}</span>
                      <input
                        type="checkbox"
                        checked={flag.checked}
                        onChange={(e) => flag.set(e.target.checked)}
                        className={checkboxClass}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormSection>

            <FormSection title="Card preview" description="How the product card looks in the shop.">
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="relative aspect-square bg-stone-100 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryMedia?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'}
                    alt={title || 'Product Preview'}
                    className="h-full w-full object-cover"
                  />
                  {calculatedDiscountPercentage > 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                      -{calculatedDiscountPercentage}%
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  {brand && <p className="text-xs text-stone-500 dark:text-stone-400">{brand}</p>}
                  <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{title || 'Product Title'}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-[11px] text-stone-500 dark:text-stone-400">(15)</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-0.5 tabular-nums">
                    <span className="text-sm font-semibold text-stone-900 dark:text-white">${price}</span>
                    {originalPrice > price && <span className="text-xs text-stone-400 line-through">${originalPrice}</span>}
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden items-center gap-3 sm:flex">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]" aria-hidden>
            <div className="h-full rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" style={{ width: `${completionPercentage}%` }} />
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium tabular-nums text-stone-900 dark:text-stone-100">{completionPercentage}%</span> complete
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AdminButton variant="ghost" onClick={handleCancel}>
            Cancel
          </AdminButton>
          <AdminButton onClick={handleSaveDraft} disabled={submitting}>
            <Save className="size-4" /> Save draft
          </AdminButton>
          <AdminButton variant="primary" onClick={handlePublish} disabled={submitting}>
            <Send className="size-4" /> {isEditMode ? 'Save changes' : 'Publish product'}
          </AdminButton>
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
        title="Leave without saving?"
        message="You have unsaved changes on this product. If you leave now, they will be lost."
        confirmText="Leave page"
        variant="warning"
      />
    </div>
  );
}
