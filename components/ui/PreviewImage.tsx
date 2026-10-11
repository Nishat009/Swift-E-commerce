'use client';

import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Plain <img> preview for arbitrary (possibly user-typed) URLs. Shows a fallback when the URL fails to load. */
export default function PreviewImage({ src, alt = 'Preview', className = '' }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-bold text-center ${className}`}>
        <ImageOff className="w-5 h-5" />
        Can&apos;t load
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />
  );
}
