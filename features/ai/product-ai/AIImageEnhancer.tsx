import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Upload, Image as ImageIcon, RefreshCw, Check } from 'lucide-react';
import Image from 'next/image';
import { AdminButton, Panel, Pill } from '@/components/admin/AdminUI';

export default function AIImageEnhancer() {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancements, setEnhancements] = useState<Record<'ecommerceClean' | 'lifestyle' | 'socialBanner' | 'thumbnail', string> | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Choose an image smaller than 5 MB.'); return; }
      if (rawImage) URL.revokeObjectURL(rawImage);
      const url = URL.createObjectURL(file);
      setRawImage(url);
      setIsProcessing(true);
      setError('');
      try {
        const form = new FormData();
        form.append('image', file);
        const response = await apiClient.post('/image-assets', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setEnhancements(response.data.data);
      } catch (err: any) {
        setEnhancements(null);
        setError(err.response?.data?.message || 'Could not process the image.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <Panel
      title={<span className="flex items-center gap-2"><ImageIcon className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" /> Product image presets</span>}
      description="Create real crop and size variants for product cards and banners."
    >
      {!rawImage ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-6 py-10 text-center transition-colors hover:border-stone-400 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-white/25">
          <span className="flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-white/[0.06] dark:text-stone-400">
            <Upload className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-white">Upload a product photo</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">PNG, JPG or WebP up to 5 MB</p>
          </div>
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-stone-700 shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#8b6f47]/30 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-white/[0.06]">
            Choose file
            <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
          </label>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12" role="status">
          <RefreshCw className="size-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Processing image presets...
          </p>
        </div>
      ) : enhancements ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pill tone="success">
              <Check className="size-3" /> 4 presets ready
            </Pill>
            <AdminButton size="sm" onClick={() => { if (rawImage) URL.revokeObjectURL(rawImage); setRawImage(null); setEnhancements(null); }}>
              <Upload className="size-3.5" /> Upload new image
            </AdminButton>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { title: 'Clean e-commerce', src: enhancements?.ecommerceClean },
              { title: 'Portrait crop', src: enhancements?.lifestyle },
              { title: 'Social banner', src: enhancements?.socialBanner },
              { title: 'Product thumbnail', src: enhancements?.thumbnail },
            ].map((asset, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-line p-2">
                <div className="relative h-32 w-full overflow-hidden rounded-md bg-stone-100 dark:bg-white/[0.04]">
                  <Image src={asset.src || rawImage} alt={asset.title} fill unoptimized className="object-cover" />
                </div>
                <p className="line-clamp-1 text-center text-xs font-medium text-stone-700 dark:text-stone-300">
                  {asset.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </Panel>
  );
}
