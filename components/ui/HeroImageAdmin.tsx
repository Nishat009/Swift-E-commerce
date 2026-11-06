import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import apiClient from '@/lib/apiClient';

const slides = [
  { key: 'atelier', name: 'Slide 1 · Atelier', fallback: '/hero-atelier-desktop.webp' },
  { key: 'runway', name: 'Slide 2 · Runway', fallback: '/banner-runway.jpg' },
  { key: 'editorial', name: 'Slide 3 · Everyday', fallback: '/hero-everyday-editorial.jpg' },
];

export default function HeroImageAdmin() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient.get('/hero').then(({ data }) => {
      if (Array.isArray(data.slides)) setImages(Object.fromEntries(data.slides.map((slide: { key: string; image: string }) => [slide.key, slide.image])));
    }).catch(() => setMessage('Could not load the current images.'));
  }, []);

  const upload = async (key: string, file?: File) => {
    if (!file) return;
    setBusy(key);
    setMessage('');
    const form = new FormData();
    form.append('image', file);
    try {
      const { data } = await apiClient.post(`/hero/${key}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages(previous => ({ ...previous, [key]: data.image }));
      setMessage(`${slides.find(slide => slide.key === key)?.name} image updated.`);
    } catch {
      setMessage('Upload failed. Choose a JPG, PNG, WebP or GIF under 5 MB.');
    } finally {
      setBusy(null);
    }
  };

  return <section className="space-y-5">
    <p className="text-sm text-stone-500 dark:text-stone-400">
      Upload an image for each slide. The existing slide animation stays the same. JPG, PNG, WebP or GIF, up to 5 MB.
    </p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {slides.map(slide => <div key={slide.key} className="flex flex-col rounded-lg border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[slide.key] || slide.fallback} alt={`${slide.name} preview`} className="aspect-video w-full rounded-t-lg bg-stone-100 object-cover dark:bg-white/[0.04]" />
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{slide.name}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{images[slide.key] ? 'Uploaded image' : 'Default image'}</p>
          </div>
          <label className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-stone-700 shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#8b6f47]/30 dark:text-stone-200 ${busy !== null ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-stone-50 hover:text-stone-900 dark:hover:bg-white/[0.06]'}`}>
            <Upload className="size-3.5" />
            {busy === slide.key ? 'Uploading…' : 'Change image'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={busy !== null} onChange={event => { void upload(slide.key, event.target.files?.[0]); event.target.value = ''; }} />
          </label>
        </div>
      </div>)}
    </div>
    {message && <p role="status" className="rounded-lg border border-line bg-stone-50 px-3.5 py-2.5 text-sm text-stone-700 dark:bg-white/[0.03] dark:text-stone-300">{message}</p>}
  </section>;
}
