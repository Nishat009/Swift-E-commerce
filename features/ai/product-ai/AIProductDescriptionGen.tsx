import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import { AdminAIDescriptionOutput } from '@/types/ai';
import { Sparkles, Wand2, Check, Copy, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface AIProductDescriptionGenProps {
  onApplyGenerated?: (output: AdminAIDescriptionOutput) => void;
}

export default function AIProductDescriptionGen({ onApplyGenerated }: AIProductDescriptionGenProps) {
  const [category, setCategory] = useState('Shirt');
  const [material, setMaterial] = useState('Cotton');
  const [color, setColor] = useState('Blue');
  const [brand, setBrand] = useState('SwiftCart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AdminAIDescriptionOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const output = await aiService.generateAdminProductDetails({ category, material, color, brand });
      setResult(output);
      if (onApplyGenerated) {
        onApplyGenerated(output);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            AI Product Description & SEO Generator
          </h3>
          <p className="text-xs text-gray-500">
            Auto-generate titles, SEO copy, highlights, and meta keywords from basic inputs.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Material</label>
          <Input value={material} onChange={(e) => setMaterial(e.target.value)} className="text-xs mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Color</label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="text-xs mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Brand</label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="text-xs mt-1" />
        </div>
        <div className="col-span-full">
          <Button type="submit" disabled={isGenerating} className="w-full justify-center gap-2 text-xs py-2.5">
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'AI is generating copy...' : 'Generate Product Copy & SEO Tags'}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Generated Product Title</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
              {result.title}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Short Description</span>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 leading-relaxed">
              {result.shortDescription}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-gray-500 uppercase text-[10px]">SEO Meta Description</span>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
              {result.seoDescription}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Product Highlights</span>
            <ul className="list-disc list-inside space-y-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {result.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.tags.map((t, idx) => (
              <span key={idx} className="bg-amber-500/10 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/20">
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
