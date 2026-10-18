'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ImagePlus, ShoppingBag, X } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import { FittingItem, fittingItemFor, garmentImageOf, useFittingStore } from '@/stores/fittingStore';
import type { GarmentKind } from '@/components/dressing-room/tryon/garment';

// three.js is heavy: paint the page first, then load the 3D view
const FittingRoom3D = dynamic(() => import('@/components/dressing-room/FittingRoom3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-2xl border border-gray-200 bg-[#f3f1ed] text-xs text-gray-400 sm:h-[600px] dark:border-gray-800">
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
    `rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white">Dressing Room</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pick a piece to see it on the mannequin. Drag to turn it around.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FittingRoom3D gender={gender} items={worn} />
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="inline-flex rounded-full border border-gray-200 p-1 dark:border-gray-800" role="group" aria-label="Mannequin">
            <button type="button" onClick={() => setGender('female')} className={pill(gender === 'female')} aria-pressed={gender === 'female'}>Women</button>
            <button type="button" onClick={() => setGender('male')} className={pill(gender === 'male')} aria-pressed={gender === 'male'}>Men</button>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Wearing</h2>
              {worn.length > 0 && (
                <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">Take all off</button>
              )}
            </div>
            {worn.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nothing yet. Choose something below.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {worn.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 p-2.5">
                    <img src={item.image} alt="" className="h-12 w-10 shrink-0 rounded-md bg-gray-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      {item.productId ? (
                        <Link href={`/product/${item.productId}`} className="block truncate text-sm text-gray-900 hover:underline dark:text-white">{item.title}</Link>
                      ) : (
                        <span className="block truncate text-sm text-gray-900 dark:text-white">{item.title}</span>
                      )}
                      {item.price !== undefined && <span className="text-xs text-gray-500">${item.price.toFixed(2)}</span>}
                    </div>
                    {item.productId && (
                      <button type="button" onClick={() => addWornToCart(item)} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label={`Add ${item.title} to bag`}>
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => remove(item.key)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800" aria-label={`Take off ${item.title}`}>
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
              <p className="py-8 text-center text-sm text-gray-500">
                {loading ? 'Loading products...' : error || 'No items here yet.'}
              </p>
            ) : (
              <div className="grid max-h-[440px] grid-cols-3 gap-2.5 overflow-y-auto pr-1">
                {shown.map(({ product, item }) => {
                  const on = worn.some((w) => w.key === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggle(item)}
                      aria-pressed={on}
                      className={`group overflow-hidden rounded-lg border text-left transition ${on ? 'border-gray-900 ring-1 ring-gray-900 dark:border-white dark:ring-white' : 'border-gray-200 hover:border-gray-400 dark:border-gray-800'}`}
                    >
                      <img src={garmentImageOf(product)} alt="" loading="lazy" className="aspect-[3/4] w-full bg-gray-100 object-cover" />
                      <span className="block truncate px-2 pt-1.5 text-xs text-gray-800 dark:text-gray-200">{product.title}</span>
                      <span className="block px-2 pb-1.5 text-xs text-gray-500">${product.price.toFixed(0)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Try your own photo</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">A flat photo of the garment on a plain background works best.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {UPLOAD_KINDS.map((k) => (
                <button key={k.kind} type="button" onClick={() => setUploadKind(k.kind)} className={pill(uploadKind === k.kind)}>{k.label}</button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
            >
              <ImagePlus className="h-4 w-4" /> Upload photo
            </button>
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
