'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

const slides = [
  { key: 'atelier', name: 'Slide 1 · Atelier', fallback: '/hero-atelier-desktop.webp' },
  { key: 'runway', name: 'Slide 2 · Runway', fallback: '/banner-runway.jpg' },
  { key: 'editorial', name: 'Slide 3 · Everyday', fallback: '/hero-everyday-editorial.png' },
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
    <div><h2 className="text-xl font-semibold">Hero slide images</h2><p className="text-sm text-gray-500">Upload an image for each slide. The existing slide animation stays the same.</p></div>
    <div className="grid gap-5 sm:grid-cols-2">
      {slides.map(slide => <div key={slide.key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h3 className="font-semibold">{slide.name}</h3>
        <img src={images[slide.key] || slide.fallback} alt={`${slide.name} preview`} className="w-full aspect-video object-cover rounded-lg" />
        <label className="inline-flex cursor-pointer rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white">
          {busy === slide.key ? 'Uploading…' : 'Change image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={busy !== null} onChange={event => { void upload(slide.key, event.target.files?.[0]); event.target.value = ''; }} />
        </label>
      </div>)}
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
