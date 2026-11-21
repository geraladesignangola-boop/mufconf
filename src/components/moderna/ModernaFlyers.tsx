import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, ImageOff, RefreshCw } from 'lucide-react';
import { fetchPublicGaleria } from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { Skeleton } from '../ui/Skeleton';
import { Reveal } from '../ui/Reveal';
import type { ItemGaleria } from '../../types/database';

type Estado = 'loading' | 'ok' | 'error' | 'vazio';

export default function ModernaFlyers() {
  const texto = useSecaoTexto('flyers');
  const [flyers, setFlyers] = useState<ItemGaleria[]>([]);
  const [estado, setEstado] = useState<Estado>('loading');
  const [flyerAtivoId, setFlyerAtivoId] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    setEstado('loading');
    try {
      const data = await fetchPublicGaleria();
      const lista = (data || []).filter((item) => item.categoria === 'Flyers');
      setFlyers(lista);
      setFlyerAtivoId(lista[0]?.id || '');
      setEstado(lista.length > 0 ? 'ok' : 'vazio');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const flyerAtivo = flyers.find((f) => f.id === flyerAtivoId) || flyers[0];
  const tituloFlyer = (flyer: ItemGaleria) => flyer.titulo || flyer.legenda || 'Flyer';

  return (
    <section id="moderna-flyers" className="bg-[var(--wex-surface)] text-[var(--wex-ink)] border-b border-[var(--wex-line)]/12">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[var(--wex-line)]/12">
          <div>
            <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
              {texto?.titulo ? `05 · ${texto.titulo}` : '05 · Flyers da Conferência'}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06]">
              {texto?.subtitulo || texto?.titulo || 'Material gráfico oficial'}
            </h2>
          </div>
          <p className="text-sm text-[var(--wex-muted)] max-w-sm leading-relaxed">
            {texto?.descricao ||
              'Flyers e visuais oficiais da conferência para partilha e impressão.'}
          </p>
        </div>

        {estado === 'loading' && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <Skeleton className="lg:col-span-5 aspect-[3/4] w-full" />
            <div className="lg:col-span-7 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <div className="grid grid-cols-4 gap-3 pt-4">
                <Skeleton className="aspect-[3/4]" />
                <Skeleton className="aspect-[3/4]" />
                <Skeleton className="aspect-[3/4]" />
                <Skeleton className="aspect-[3/4]" />
              </div>
            </div>
          </div>
        )}

        {estado === 'error' && (
          <div className="mt-10 py-14 text-center border border-[var(--wex-line)]/12 bg-[var(--wex-surface-2)]">
            <ImageOff className="w-8 h-8 mx-auto text-[var(--wex-muted-2)]" />
            <p className="mt-4 text-sm text-[var(--wex-muted)]">
              Não foi possível carregar os flyers. Verifica a tua ligação e tenta novamente.
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
            Os flyers serão publicados em breve.
          </p>
        )}

        {estado === 'ok' && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Flyer selecionado */}
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 overflow-hidden">
                <AnimatePresence mode="wait">
                  {flyerAtivo && (
                    <motion.div
                      key={flyerAtivo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full"
                    >
                      {flyerAtivo.url && !failedImages[flyerAtivo.id] ? (
                        <img
                          src={flyerAtivo.url}
                          alt={tituloFlyer(flyerAtivo)}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [flyerAtivo.id]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--wex-surface-2)]">
                          <span className="font-[family-name:var(--font-moderna-display)] text-5xl font-bold text-[var(--wex-muted-2)]">
                            {tituloFlyer(flyerAtivo).slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A]/85 via-[#0B0B0A]/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-[var(--wex-on-dark)]">
                        <h3 className="font-[family-name:var(--font-moderna-display)] text-2xl font-bold">
                          {tituloFlyer(flyerAtivo)}
                        </h3>
                        {flyerAtivo.legenda && (
                          <p className="mt-3 pt-3 border-t border-[#F7F7F5]/20 text-sm text-[var(--wex-on-dark)]/85 leading-relaxed">
                            {flyerAtivo.legenda}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {flyerAtivo?.url && (
                  <a
                    href={flyerAtivo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-2 bg-[#0B0B0A]/70 hover:bg-[#0B0B0A]/90 text-[var(--wex-on-dark)] text-[11px] font-semibold uppercase tracking-wider transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir
                  </a>
                )}
              </div>
            </Reveal>

            {/* Lista de flyers */}
            <Reveal delay={100} className="lg:col-span-7 flex flex-col justify-between">
              <div className="divide-y divide-[var(--wex-line)]/12 border-y border-[var(--wex-line)]/12">
                {flyers.map((flyer, idx) => {
                  const isActive = flyer.id === flyerAtivo?.id;
                  return (
                    <button
                      key={flyer.id}
                      type="button"
                      onClick={() => setFlyerAtivoId(flyer.id)}
                      onMouseEnter={() => setFlyerAtivoId(flyer.id)}
                      aria-pressed={isActive}
                      className={`w-full text-left py-7 sm:py-8 px-4 sm:px-6 transition-colors duration-150 flex items-start justify-between gap-4 cursor-pointer ${
                        isActive ? 'bg-[var(--wex-surface-2)]' : 'hover:bg-[var(--wex-surface-2)]/50'
                      }`}
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                        <span
                          className={`font-[family-name:var(--font-caverna-mono)] text-xs tabular-nums shrink-0 ${
                            isActive ? 'text-[#B95E26]' : 'text-[var(--wex-muted-2)]'
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-[family-name:var(--font-moderna-display)] text-xl sm:text-2xl font-bold text-[var(--wex-ink)]">
                            {tituloFlyer(flyer)}
                          </span>
                          {flyer.legenda && (
                            <span className="block mt-2.5 text-xs sm:text-sm text-[var(--wex-muted)] leading-relaxed">
                              {flyer.legenda}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`font-[family-name:var(--font-caverna-mono)] text-xs shrink-0 ${
                          isActive ? 'text-[#B95E26]' : 'text-[var(--wex-muted-2)]'
                        }`}
                      >
                        {isActive ? 'Ativo' : 'Ver'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Miniaturas */}
              <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg">
                {flyers.map((flyer) => {
                  const isActive = flyer.id === flyerAtivo?.id;
                  return (
                    <button
                      key={flyer.id}
                      type="button"
                      onClick={() => setFlyerAtivoId(flyer.id)}
                      aria-label={`Selecionar ${tituloFlyer(flyer)}`}
                      className={`aspect-[3/4] overflow-hidden border transition-all cursor-pointer ${
                        isActive ? 'border-[#B95E26] opacity-100' : 'border-[var(--wex-line)]/12 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {flyer.url && !failedImages[flyer.id] ? (
                        <img
                          src={flyer.url}
                          alt={tituloFlyer(flyer)}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--wex-surface-2)] flex items-center justify-center text-xs font-bold text-[var(--wex-muted)]">
                          {tituloFlyer(flyer).slice(0, 2)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
