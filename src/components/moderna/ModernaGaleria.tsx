import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff, Maximize2, RefreshCw, X } from 'lucide-react';
import { fetchPublicGaleria } from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { SkeletonGalleryGrid } from '../ui/Skeleton';
import { Reveal } from '../ui/Reveal';
import type { ItemGaleria } from '../../types/database';

type Estado = 'loading' | 'ok' | 'error' | 'vazio';

export default function ModernaGaleria() {
  const texto = useSecaoTexto('galeria');
  const [itens, setItens] = useState<ItemGaleria[]>([]);
  const [estado, setEstado] = useState<Estado>('loading');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todas');
  const [selectedPhoto, setSelectedPhoto] = useState<ItemGaleria | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  const carregar = useCallback(async () => {
    setEstado('loading');
    try {
      const data = await fetchPublicGaleria();
      const fotos = (data || []).filter((item) => item.categoria !== 'Flyers');
      setItens(fotos);
      setEstado(fotos.length > 0 ? 'ok' : 'vazio');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Fecha o lightbox com Escape e devolve o foco ao fechar
  useEffect(() => {
    if (!selectedPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    document.addEventListener('keydown', onKey);
    fecharRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedPhoto]);

  const categorias = ['Todas', ...Array.from(new Set(itens.map((i) => i.categoria || 'Geral')))];

  const itensFiltrados =
    categoriaAtiva === 'Todas'
      ? itens
      : itens.filter((i) => (i.categoria || 'Geral') === categoriaAtiva);

  return (
    <section id="moderna-galeria" className="bg-[var(--wex-surface-3)] border-b border-[var(--wex-line)]/12 py-20 lg:py-28">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header da Galeria */}
        <Reveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[var(--wex-line)]/12">
          <div>
            <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
              {texto?.titulo ? `10 · ${texto.titulo}` : '10 · Acervo & Memórias'}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06]">
              {texto?.subtitulo || texto?.titulo || 'A atmosfera que nos une'}
            </h2>
          </div>
          <p className="text-sm text-[var(--wex-muted)] max-w-sm leading-relaxed">
            {texto?.descricao ||
              'Momentos marcantes de adoração, capacitação e comunhão registados em edições anteriores da conferência.'}
          </p>
        </div>
        </Reveal>

        {/* Filtros de Categoria */}
        {estado === 'ok' && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaAtiva(cat)}
                aria-pressed={categoriaAtiva === cat}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B95E26] ${
                  categoriaAtiva === cat
                    ? 'bg-[var(--wex-cta-bg)] text-[var(--wex-cta-fg)] border-[var(--wex-cta-bg)]'
                    : 'bg-[var(--wex-card)]/80 hover:bg-[var(--wex-card)] text-[var(--wex-muted)] border-[var(--wex-line)]/12'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Imagens */}
        {estado === 'loading' && <SkeletonGalleryGrid />}

        {estado === 'error' && (
          <div className="mt-10 py-14 text-center border border-[var(--wex-line)]/12 bg-[var(--wex-surface-2)]">
            <ImageOff className="w-8 h-8 mx-auto text-[var(--wex-muted-2)]" />
            <p className="mt-4 text-sm text-[var(--wex-muted)]">
              Não foi possível carregar a galeria. Verifica a tua ligação e tenta novamente.
            </p>
            <button
              type="button"
              onClick={carregar}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {estado === 'vazio' && (
          <p className="mt-10 py-10 text-center text-sm text-[var(--wex-muted)]">
            A galeria será publicada em breve.
          </p>
        )}

        {estado === 'ok' && itensFiltrados.length === 0 && (
          <p className="mt-10 py-10 text-center text-sm text-[var(--wex-muted)]">
            Sem fotos nesta categoria.
          </p>
        )}

        {estado === 'ok' && itensFiltrados.length > 0 && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {itensFiltrados.map((item, idx) => (
            <Reveal key={item.id} delay={Math.min(idx * 60, 480)} className="aspect-[4/5]">
            <button
              type="button"
              onClick={() => setSelectedPhoto(item)}
              aria-label={`Ampliar foto: ${item.titulo || 'Registo do evento'}`}
              className="group relative w-full h-full bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 overflow-hidden cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B95E26]"
            >
              <img
                src={item.url}
                alt={item.titulo || 'Registo do evento'}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                <span className="font-[family-name:var(--font-caverna-mono)] text-[10px] text-[#C9A24A] uppercase tracking-wider">
                  {item.categoria}
                </span>
                <p className="font-bold text-sm mt-1">{item.titulo}</p>
                {item.legenda && (
                  <p className="text-xs text-stone-300 mt-1 line-clamp-2">{item.legenda}</p>
                )}
                <div className="mt-3 flex items-center gap-1 text-[11px] text-[#B95E26] font-semibold">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ampliar</span>
                </div>
              </div>
            </button>
            </Reveal>
          ))}
        </div>
        )}

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
              onClick={() => setSelectedPhoto(null)}
              role="dialog"
              aria-modal="true"
              aria-label={selectedPhoto.titulo || 'Foto ampliada'}
            >
              <button
                ref={fecharRef}
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Fechar ampliação"
                className="absolute top-6 right-6 p-3 bg-stone-900 border border-stone-800 text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div
                className="max-w-4xl max-h-[85vh] flex flex-col items-center bg-[var(--wex-dark-block)] border border-[#F7F7F5]/20 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[65vh] w-full overflow-hidden flex items-center justify-center bg-black">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.titulo}
                    className="max-w-full max-h-[65vh] object-contain"
                  />
                </div>
                <div className="p-6 w-full text-white bg-[var(--wex-dark-block)] border-t border-[#F7F7F5]/10">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                      {selectedPhoto.categoria} · {selectedPhoto.criado_em.slice(0, 4)}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-moderna-display)] text-xl font-bold mt-1 text-[var(--wex-on-dark)]">
                    {selectedPhoto.titulo}
                  </h3>
                  {selectedPhoto.legenda && (
                    <p className="mt-2 text-sm text-[#A2A09A] leading-relaxed">
                      {selectedPhoto.legenda}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
