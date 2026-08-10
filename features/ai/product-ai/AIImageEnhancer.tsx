import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import { AdminAIImageEnhancements } from '@/types/ai';
import { Upload, Sparkles, Image as ImageIcon, Layers, RefreshCw, Check } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function AIImageEnhancer() {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancements, setEnhancements] = useState<AdminAIImageEnhancements | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRawImage(url);
      setIsProcessing(true);
      try {
        const res = await aiService.enhanceProductImage(url);
        setEnhancements(res);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            AI Product Image Enhancer & Asset Suite
          </h3>
          <p className="text-xs text-gray-500">
            Upload raw product photos to auto-generate lifestyle, model, and banner variations.
          </p>
        </div>
      </div>

      {!rawImage ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-8 hover:border-amber-500 transition-colors text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          <Upload className="w-10 h-10 text-amber-500 animate-bounce" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Upload Raw Product Photo</p>
            <p className="text-xs text-gray-500">PNG or JPG up to 10MB</p>
          </div>
          <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md">
            Browse File
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      ) : isProcessing ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            AI is rendering 5 studio asset variations...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> 5 Studio Assets Generated
            </span>
            <Button size="sm" variant="secondary" onClick={() => setRawImage(null)} className="text-xs">
              Upload New Image
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { title: '1. Clean E-commerce', src: enhancements?.ecommerceClean },
              { title: '2. Lifestyle Scene', src: enhancements?.lifestyle },
              { title: '3. Model Wearing', src: enhancements?.modelWearing },
              { title: '4. Social Banner', src: enhancements?.socialBanner },
              { title: '5. Product Thumbnail', src: enhancements?.thumbnail },
            ].map((asset, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="relative h-32 w-full rounded-xl overflow-hidden">
                  <Image src={asset.src || rawImage} alt={asset.title} fill className="object-cover" />
                </div>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-1 text-center">
                  {asset.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
