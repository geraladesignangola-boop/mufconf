import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Atraso em ms para entrada escalonada (stagger) */
  delay?: number;
  /** Elemento HTML a renderizar */
  as?: React.ElementType;
  id?: string;
  key?: React.Key;
}

/**
 * Entrada suave ao entrar no viewport (fade-in + translateY).
 * Anima apenas `opacity` e `transform` (performance).
 * Respeita `prefers-reduced-motion` via CSS (.reveal em index.css).
 */
export function Reveal({ children, className = '', delay = 0, as, id }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisivel(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = (as || 'div') as React.ElementType;

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${visivel ? 'is-visible' : ''} ${className}`}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
