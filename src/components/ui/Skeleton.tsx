import React from 'react';

/**
 * Bloco base para skeleton loaders — combina com `animate-pulse` do Tailwind.
 */
export function Skeleton({ className = '' }: { className?: string; key?: React.Key }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--wex-line)]/10 ${className}`}
    />
  );
}

/** Grade de placeholders no formato dos cartões da galeria. */
export function SkeletonGalleryGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/5]" />
      ))}
    </div>
  );
}

/** Lista de placeholders no formato das linhas de programação/oradoras. */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--wex-line)]/12 border-y border-[var(--wex-line)]/12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-6 sm:py-7 px-4 sm:px-6 flex items-start gap-6">
          <Skeleton className="w-16 h-6 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Cartões de placeholders no formato dos atalhos de materiais. */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--wex-card)] border border-[var(--wex-line)]/12 p-6 space-y-4">
          <Skeleton className="w-11 h-11" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
