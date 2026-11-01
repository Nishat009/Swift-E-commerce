import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthShellProps {
  image: string;
  imageAlt: string;
  eyebrow: string;
  quote: string;
  children: ReactNode;
}

// Calm split layout shared by the customer sign-in and sign-up pages.
export default function AuthShell({ image, imageAlt, eyebrow, quote, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-stone-900 lg:block">
        <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-stone-950/35" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="font-serif text-xl uppercase tracking-[0.28em]">
            SwiftCart
          </Link>
          <div className="max-w-sm">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">{eyebrow}</p>
            <p className="mt-3 font-serif text-3xl font-medium leading-snug tracking-tight">{quote}</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-6 lg:px-12">
        <Link href="/" className="font-serif text-lg uppercase tracking-[0.28em] text-ink lg:hidden">
          SwiftCart
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
