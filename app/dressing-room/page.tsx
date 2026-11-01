'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ImagePlus, ShoppingBag, X } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { FittingItem, fittingItemFor, garmentImageOf, useFittingStore } from '@/stores/fittingStore';
import type { GarmentKind } from '@/components/dressing-room/tryon/garment';

// three.js is heavy: paint the page first, then load the 3D view
const FittingRoom3D = dynamic(() => import('@/components/dressing-room/FittingRoom3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-sm bg-surface-muted text-xs text-stone-500 sm:h-[600px]">
      Loading 3D view...
    </div>
  ),
});

const FILTERS: { key: 'all' | GarmentKind | 'bottoms'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dress', label: 'Dresses' },
  { key: 'top', label: 'Tops' },
  { key: 'outer', label: 'Jackets' },
  { key: 'bottoms', label: 'Bottoms' },
];

const UPLOAD_KINDS: { kind: GarmentKind; label: string }[] = [
  { kind: 'dress', label: 'Dress' },
  { kind: 'top', label: 'Top' },
  { kind: 'outer', label: 'Jacket' },
  { kind: 'pants', label: 'Trousers' },
  { kind: 'skirt', label: 'Skirt' },
];

function DressingRoom() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const addToCart = useCartStore((state) => state.addItem);
  const { products, loading, error } = useCatalog();
  const { gender, worn, setGender, toggle, wear, remove, clear } = useFittingStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [uploadKind, setUploadKind] = useState<GarmentKind>('dress');
  const fileRef = useRef<HTMLInputElement>(null);

  const wearable = useMemo(
    () => products.map((product) => ({ product, item: fittingItemFor(product) })).filter((x): x is { product: typeof x.product; item: FittingItem } => x.item !== null),
    [products],
  );
  const shown = wearable.filter(({ item }) =>
    filter === 'all' ? true : filter === 'bottoms' ? item.kind === 'pants' || item.kind === 'skirt' : item.kind === filter,
  );

  // Arriving from a product page: put that product on.
  const requested = searchParams?.get('product');
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!requested || handled.current === requested || products.length === 0) return;
    handled.current = requested;
    const match = wearable.find(({ product }) => String(product.id) === requested);
    if (match) wear(match.item);
  }, [requested, products.length, wearable, wear]);

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    const label = UPLOAD_KINDS.find((k) => k.kind === uploadKind)?.label ?? 'Garment';
    wear({ key: `upload-${Date.now()}`, image: URL.createObjectURL(file), kind: uploadKind, title: `Your ${label.toLowerCase()}` });
  };

  const addWornToCart = (item: FittingItem) => {
    const product = products.find((p) => String(p.id) === item.productId);
    if (!product) return;
    addToCart(product, 1);
    toast.success(`Added "${product.title}" to your bag`);
  };

  const pill = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
      active ? 'bg-ink text-paper' : 'text-stone-600 hover:bg-surface-muted dark:text-stone-300'
    }`;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <header className="mb-10 border-b border-line pb-8">
        <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">Virtual fitting</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">Dressing Room</h1>
        <p className="mt-3 text-base text-stone-600 dark:text-stone-400">Pick a piece to see it on the mannequin. Drag to turn it around.</p>
      </header>

      <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FittingRoom3D gender={gender} items={worn} />
        </div>

        <aside className="space-y-8 lg:col-span-5">
          <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label="Mannequin">
            <button type="button" onClick={() => setGender('female')} className={pill(gender === 'female')} aria-pressed={gender === 'female'}>Women</button>
            <button type="button" onClick={() => setGender('male')} className={pill(gender === 'male')} aria-pressed={gender === 'male'}>Men</button>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">Wearing</h2>
              {worn.length > 0 && (
                <button type="button" onClick={clear} className="text-xs text-stone-500 hover:text-ink cursor-pointer underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600">Take all off</button>
              )}
            </div>
            {worn.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Nothing yet. Choose something below.</p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {worn.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 py-3">
                    <img src={item.image} alt="" className="h-14 w-[42px] shrink-0 rounded-sm bg-surface-muted object-cover" />
                    <div className="min-w-0 flex-1">
                      {item.productId ? (
                        <Link href={`/product/${item.productId}`} className="block truncate text-sm text-ink hover:underline underline-offset-4">{item.title}</Link>
                      ) : (
                        <span className="block truncate text-sm text-ink">{item.title}</span>
                      )}
                      {item.price !== undefined && <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">${item.price.toFixed(2)}</span>}
                    </div>
                    {item.productId && (
                      <button type="button" onClick={() => addWornToCart(item)} className="rounded-full p-2 text-stone-600 hover:bg-surface-muted dark:text-stone-300 cursor-pointer" aria-label={`Add ${item.title} to bag`}>
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => remove(item.key)} className="rounded-full p-2 text-stone-400 hover:bg-surface-muted hover:text-ink cursor-pointer" aria-label={`Take off ${item.title}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={pill(filter === f.key)}>{f.label}</button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                {loading ? 'Loading products...' : error || 'No items here yet.'}
              </p>
            ) : (
              <div className="grid max-h-[480px] grid-cols-3 gap-3 overflow-y-auto pr-1">
                {shown.map(({ product, item }) => {
                  const on = worn.some((w) => w.key === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggle(item)}
                      aria-pressed={on}
                      className={`group text-left cursor-pointer ${on ? '[&_img]:ring-2 [&_img]:ring-ink [&_img]:ring-offset-2 [&_img]:ring-offset-paper' : ''}`}
                    >
                      <img src={garmentImageOf(product)} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-sm bg-surface-muted object-cover" />
                      <span className="block truncate pt-2 text-xs text-ink">{product.title}</span>
                      <span className="block pb-1 text-xs tabular-nums text-stone-500 dark:text-stone-400">${product.price.toFixed(0)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line p-5">
            <h2 className="text-xl font-serif font-medium tracking-tight text-ink">Try your own photo</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">A flat photo of the garment on a plain background works best.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {UPLOAD_KINDS.map((k) => (
                <button key={k.kind} type="button" onClick={() => setUploadKind(k.kind)} className={pill(uploadKind === k.kind)}>{k.label}</button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <Button type="button" size="sm" className="mt-4" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload photo
            </Button>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default function DressingRoomPage() {
  return (
    <Suspense fallback={null}>
      <DressingRoom />
    </Suspense>
  );
}
