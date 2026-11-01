import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { AdminAIDescriptionOutput } from '@/types/ai';
import { Sparkles, Wand2 } from 'lucide-react';
import { AdminButton, Panel, Pill } from '@/components/admin/AdminUI';

interface AIProductDescriptionGenProps {
  onApplyGenerated?: (output: AdminAIDescriptionOutput) => void;
}

const labelCls = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const outputLabelCls = 'text-xs font-medium text-stone-500 dark:text-stone-400';
const outputBoxCls = 'rounded-lg border border-line bg-stone-50 px-3 py-2.5 text-sm text-stone-700 dark:bg-white/[0.03] dark:text-stone-300';

export default function AIProductDescriptionGen({ onApplyGenerated }: AIProductDescriptionGenProps) {
  const [category, setCategory] = useState('Shirt');
  const [material, setMaterial] = useState('Cotton');
  const [color, setColor] = useState('Blue');
  const [brand, setBrand] = useState('SwiftCart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AdminAIDescriptionOutput | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    try {
      const response = await apiClient.post('/admin/copy-draft', { category, material, color, brand });
      const output: AdminAIDescriptionOutput = response.data.data;
      setResult(output);
      if (onApplyGenerated) {
        onApplyGenerated(output);
      }
    } catch (err: any) {
      // A validation answer lists the problem per field; show the first one
      const fieldErrors = Object.values(err.response?.data?.errors || {}) as string[];
      setError(fieldErrors[0] || err.response?.data?.message || 'Could not create a copy draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Panel
      title={<span className="flex items-center gap-2"><Wand2 className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" /> Product description & SEO draft</span>}
      description="Prepare an editable copy draft from the product details you enter."
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="copy-category" className={labelCls}>Category</label>
            <input id="copy-category" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="copy-material" className={labelCls}>Material</label>
            <input id="copy-material" value={material} onChange={(e) => setMaterial(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="copy-color" className={labelCls}>Color</label>
            <input id="copy-color" value={color} onChange={(e) => setColor(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="copy-brand" className={labelCls}>Brand</label>
            <input id="copy-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={fieldCls} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : <span />}
          <AdminButton type="submit" variant="primary" disabled={isGenerating}>
            <Sparkles className="size-4" />
            {isGenerating ? 'Preparing draft...' : 'Create copy draft'}
          </AdminButton>
        </div>
      </form>

      {result && (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <div className="space-y-1.5">
            <span className={outputLabelCls}>Product title</span>
            <p className={`${outputBoxCls} font-medium text-stone-900 dark:text-white`}>
              {result.title}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className={outputLabelCls}>Short description</span>
            <p className={`${outputBoxCls} leading-relaxed`}>
              {result.shortDescription}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className={outputLabelCls}>SEO meta description</span>
            <p className={outputBoxCls}>
              {result.seoDescription}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className={outputLabelCls}>Highlights</span>
            <ul className={`${outputBoxCls} list-inside list-disc space-y-1`}>
              {result.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <span className={outputLabelCls}>Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((t, idx) => (
                <Pill key={idx}>#{t}</Pill>
              ))}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
