import { useEffect } from 'react';
import { applyPageMeta, PageMeta } from '../lib/seo';

/**
 * Aplica metadados SEO da página atual (title, description, canonical,
 * Open Graph, Twitter Cards, robots e JSON-LD) enquanto a rota está montada.
 */
export function usePageMeta(meta: PageMeta) {
  const { title, description, path, noindex, ogType, jsonLd } = meta;

  useEffect(() => {
    return applyPageMeta({ title, description, path, noindex, ogType, jsonLd });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, noindex, ogType, JSON.stringify(jsonLd)]);
}
