import { useEffect, useState } from 'react';

/**
 * Devolve o `id` da secção atualmente visível no viewport, usando
 * IntersectionObserver. Usado para destacar a secção ativa na navegação.
 */
export function useScrollSpy(ids: string[], offsetRatio = 0.4): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    const elementos = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elementos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setActiveId(visiveis[0].target.id);
      },
      {
        // faixa central do viewport — ignora o header sticky (~64px)
        rootMargin: `-${Math.round(window.innerHeight * offsetRatio)}px 0px -${Math.round(
          window.innerHeight * (1 - offsetRatio)
        )}px 0px`,
        threshold: 0,
      }
    );

    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}
