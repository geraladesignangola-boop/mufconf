import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff, RefreshCw } from 'lucide-react';
import {
  fetchPublicOradoras,
  fetchPublicProgramacao,
} from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { Skeleton, SkeletonRows } from '../ui/Skeleton';
import { Reveal } from '../ui/Reveal';

interface SessaoItem {
  id: string;
  hora: string;
  horaFim: string;
  bloco: string;
  titulo: string;
  desc: string;
}

interface OradoraItem {
  id: string;
  nome: string;
  cargo: string;
  fotoUrl: string;
  foco: string;
}

const PERIODOS_ORDEM: Record<string, number> = { 'Manhã': 0, 'Tarde': 1, 'Noite': 2 };

function horaParaMinutos(hora: string): number {
  const m = hora.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10);
}

function formatHoraCurta(hora: string): string {
  const m = hora.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (!m) return hora;
  const min = m[2] || '00';
  return min === '00' ? `${m[1]}h` : `${m[1]}h${min}`;
}

export default function ModernaJornadaMentoras() {
  const textoProgramacao = useSecaoTexto('programacao');
  const textoOradoras = useSecaoTexto('oradoras');
  const [sessoes, setSessoes] = useState<SessaoItem[]>([]);
  const [estadoProgramacao, setEstadoProgramacao] = useState<'loading' | 'ok' | 'error' | 'vazio'>('loading');

  const [oradoras, setOradoras] = useState<OradoraItem[]>([]);
  const [estadoOradoras, setEstadoOradoras] = useState<'loading' | 'ok' | 'error' | 'vazio'>('loading');

  const [blocoAtivo, setBlocoAtivo] = useState<string>('todos');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [selectedOradoraId, setSelectedOradoraId] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    setEstadoProgramacao('loading');
    setEstadoOradoras('loading');
    const [resOradoras, resProgramacao] = await Promise.allSettled([
      fetchPublicOradoras(),
      fetchPublicProgramacao(),
    ]);

    if (resOradoras.status === 'fulfilled') {
      const liveOradoras = resOradoras.value;
      if (liveOradoras && liveOradoras.length > 0) {
        setOradoras(
          liveOradoras.map((o) => ({
            id: o.id,
            nome: o.nome,
            cargo: o.cargo,
            fotoUrl: o.fotoUrl,
            foco: o.biografia || o.subtitulo || '',
          }))
        );
        setSelectedOradoraId(liveOradoras[0].id);
        setEstadoOradoras('ok');
      } else {
        setOradoras([]);
        setSelectedOradoraId('');
        setEstadoOradoras('vazio');
      }
    } else {
      setEstadoOradoras('error');
    }

    if (resProgramacao.status === 'fulfilled') {
      const liveProgramacao = resProgramacao.value;
      if (liveProgramacao && liveProgramacao.length > 0) {
        setSessoes(
          liveProgramacao.map((p) => ({
            id: p.id,
            hora: p.horaInicio,
            horaFim: p.horaFim,
            bloco: p.periodo,
            titulo: p.titulo,
            desc: p.descricao || '',
          }))
        );
        setActiveSessionId('');
        setEstadoProgramacao('ok');
      } else {
        setSessoes([]);
        setActiveSessionId('');
        setEstadoProgramacao('vazio');
      }
    } else {
      setEstadoProgramacao('error');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const blocos = useMemo(() => {
    const grupos = new Map<string, SessaoItem[]>();
    sessoes.forEach((s) => {
      const arr = grupos.get(s.bloco);
      if (arr) arr.push(s);
      else grupos.set(s.bloco, [s]);
    });
    return [...grupos.entries()]
      .sort(([a], [b]) => (PERIODOS_ORDEM[a] ?? 99) - (PERIODOS_ORDEM[b] ?? 99))
      .map(([key, list]) => {
        let inicio = list[0]?.hora || '';
        let fim = list[list.length - 1]?.horaFim || inicio;
        let minMin = Infinity;
        let maxMin = -1;
        list.forEach((s) => {
          const a = horaParaMinutos(s.hora);
          const b = horaParaMinutos(s.horaFim || s.hora);
          if (a < minMin) {
            minMin = a;
            inicio = s.hora;
          }
          if (b > maxMin) {
            maxMin = b;
            fim = s.horaFim || s.hora;
          }
        });
        return { key, label: `${key} · ${formatHoraCurta(inicio)}–${formatHoraCurta(fim)}` };
      });
  }, [sessoes]);

  const blocoEfetivo =
    blocoAtivo === 'todos' || blocos.some((b) => b.key === blocoAtivo) ? blocoAtivo : 'todos';

  const blocosChips = useMemo(
    () => [{ key: 'todos', label: 'Dia completo' }, ...blocos],
    [blocos]
  );

  const visibleSessions = useMemo(
    () => (blocoEfetivo === 'todos' ? sessoes : sessoes.filter((s) => s.bloco === blocoEfetivo)),
    [blocoEfetivo, sessoes]
  );

  const blocoLabelDe = (bloco: string) => blocos.find((b) => b.key === bloco)?.label || bloco;

  const highlightedSession =
    visibleSessions.find((s) => s.id === activeSessionId) || visibleSessions[0];

  const activeOradora = oradoras.find((o) => o.id === selectedOradoraId) || oradoras[0] || {
    id: 'placeholder',
    nome: 'Oradora',
    cargo: '',
    fotoUrl: '',
    foco: '',
  };

  const initials = activeOradora.nome
    .split(' ')
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map((n) => n[0])
    .join('');

  return (
    <div className="bg-[var(--wex-surface)] text-[var(--wex-ink)]">
      {/* Section 03: Programação Divulgada */}
      <section id="moderna-programacao" className="border-b border-[var(--wex-line)]/12">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Sticky Left Column */}
            <Reveal className="lg:col-span-5 lg:sticky lg:top-24">
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                {textoProgramacao?.titulo
                  ? `03 · ${textoProgramacao.titulo}`
                  : '03 · Programação'}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06] text-balance">
                {textoProgramacao?.subtitulo ||
                  textoProgramacao?.titulo ||
                  'Um dia inteiro de conferência e capacitação'}
              </h2>
              <p className="mt-4 text-sm sm:text-[15px] text-[var(--wex-muted)] leading-relaxed max-w-md">
                {textoProgramacao?.descricao ||
                  'Blocos estruturados entre manhã, tarde e encerramento. A programação pode ser atualizada pela comissão organizadora.'}
              </p>

              {/* Period Filter Buttons */}
              <div className="mt-7 flex flex-wrap gap-1.5">
                {blocosChips.map((b) => {
                  const isActive = blocoEfetivo === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setBlocoAtivo(b.key)}
                      aria-pressed={isActive}
                      className={`px-3 py-2 text-xs font-semibold font-[family-name:var(--font-caverna-mono)] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[var(--wex-cta-bg)] text-[var(--wex-cta-fg)] border-[var(--wex-cta-bg)]'
                          : 'bg-[var(--wex-surface-2)] text-[var(--wex-muted)] border-[var(--wex-line)]/12 hover:text-[var(--wex-ink)]'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>

              {highlightedSession && (
                <div className="mt-8 p-6 bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/10">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[var(--wex-muted-2)]">
                      {blocoLabelDe(highlightedSession.bloco)}
                    </span>
                    <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] tabular-nums">
                      {highlightedSession.hora}
                    </span>
                  </div>
                  <p className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl font-extrabold text-[var(--wex-ink)] tabular-nums">
                    {highlightedSession.hora}
                  </p>
                  <p className="mt-2 font-semibold text-sm text-[var(--wex-ink)]">
                    {highlightedSession.titulo}
                  </p>
                </div>
              )}
            </Reveal>

            {/* Right Flowing Schedule Rows */}
            <Reveal delay={100} className="lg:col-span-7">
              {estadoProgramacao === 'loading' && <SkeletonRows />}

              {estadoProgramacao === 'error' && (
                <div className="py-12 text-center border-y border-[var(--wex-line)]/12">
                  <ImageOff className="w-8 h-8 mx-auto text-[var(--wex-muted-2)]" />
                  <p className="mt-4 text-sm text-[var(--wex-muted)]">
                    Não foi possível carregar a programação.
                  </p>
                  <button
                    type="button"
                    onClick={carregar}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </button>
                </div>
              )}

              {estadoProgramacao === 'vazio' && (
                <p className="py-10 text-center text-sm text-[var(--wex-muted)] border-y border-[var(--wex-line)]/12">
                  A programação será publicada em breve.
                </p>
              )}

              {estadoProgramacao === 'ok' && visibleSessions.length === 0 && (
                <p className="py-10 text-center text-sm text-[var(--wex-muted)] border-y border-[var(--wex-line)]/12">
                  Sem sessões neste período.
                </p>
              )}

              {estadoProgramacao === 'ok' && visibleSessions.length > 0 && (
              <div className="divide-y divide-[var(--wex-line)]/12 border-y border-[var(--wex-line)]/12">
              {visibleSessions.map((sessao) => {
                const isSelected = sessao.id === highlightedSession?.id;
                return (
                  <button
                    key={sessao.id}
                    type="button"
                    onClick={() => setActiveSessionId(sessao.id)}
                    onMouseEnter={() => setActiveSessionId(sessao.id)}
                    className={`w-full text-left py-6 sm:py-7 px-4 sm:px-6 transition-colors duration-150 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start cursor-pointer ${
                      isSelected ? 'bg-[var(--wex-surface-2)]' : 'hover:bg-[var(--wex-surface-2)]/60'
                    }`}
                  >
                    <div className="sm:col-span-3">
                      <span
                        className={`block font-[family-name:var(--font-caverna-mono)] text-base font-semibold tabular-nums ${
                          isSelected ? 'text-[#B95E26]' : 'text-[var(--wex-ink)]'
                        }`}
                      >
                        {sessao.hora}
                      </span>
                      <span className="block mt-1 font-[family-name:var(--font-caverna-mono)] text-[10px] text-[var(--wex-muted-2)] uppercase">
                        {sessao.bloco}
                      </span>
                    </div>
                    <div className="sm:col-span-9">
                      <h3 className="font-[family-name:var(--font-moderna-display)] text-lg sm:text-xl font-bold text-[var(--wex-ink)]">
                        {sessao.titulo}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--wex-muted)] leading-relaxed">
                        {sessao.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
              </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Section 04: Oradoras Apresentadas */}
      <section id="moderna-oradoras" className="border-b border-[var(--wex-line)]/12">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[var(--wex-line)]/12">
            <div>
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                {textoOradoras?.titulo ? `04 · ${textoOradoras.titulo}` : '04 · Oradoras Apresentadas'}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06]">
                {textoOradoras?.subtitulo || textoOradoras?.titulo || 'Vozes de autoridade e vivência'}
              </h2>
            </div>
            <p className="text-sm text-[var(--wex-muted)] max-w-sm leading-relaxed">
              {textoOradoras?.descricao ||
                'Preletoras e mentoras reunidas para equipar mulheres em liderança, restauração familiar e impacto social.'}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Portrait Frame (5 cols) */}
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 overflow-hidden">
                {estadoOradoras === 'loading' && <Skeleton className="absolute inset-0" />}
                {estadoOradoras !== 'loading' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeOradora.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    {activeOradora.fotoUrl && !failedImages[activeOradora.id] ? (
                      <img
                        src={activeOradora.fotoUrl}
                        alt={activeOradora.nome}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [activeOradora.id]: true }))
                        }
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 15%' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--wex-surface-2)]">
                        <span className="font-[family-name:var(--font-moderna-display)] text-6xl font-bold text-[var(--wex-muted-2)]">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A]/85 via-[#0B0B0A]/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-[var(--wex-on-dark)]">
                      <h3 className="font-[family-name:var(--font-moderna-display)] text-2xl font-bold">
                        {activeOradora.nome}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[var(--wex-on-dark)]/80">
                        {activeOradora.cargo}
                      </p>
                      <p className="mt-3 pt-3 border-t border-[#F7F7F5]/20 text-xs sm:text-sm text-[var(--wex-on-dark)]/85 leading-relaxed">
                        {activeOradora.foco}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                )}
              </div>
            </Reveal>

            {/* Right Interactive 3-Row Roster (7 cols) */}
            <Reveal delay={100} className="lg:col-span-7 flex flex-col justify-between">
              {estadoOradoras === 'loading' && <SkeletonRows />}

              {estadoOradoras === 'error' && (
                <div className="py-12 text-center border-y border-[var(--wex-line)]/12">
                  <ImageOff className="w-8 h-8 mx-auto text-[var(--wex-muted-2)]" />
                  <p className="mt-4 text-sm text-[var(--wex-muted)]">
                    Não foi possível carregar as oradoras.
                  </p>
                  <button
                    type="button"
                    onClick={carregar}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </button>
                </div>
              )}

              {estadoOradoras === 'vazio' && (
                <p className="py-10 text-center text-sm text-[var(--wex-muted)] border-y border-[var(--wex-line)]/12">
                  As oradoras serão anunciadas em breve.
                </p>
              )}

              {estadoOradoras === 'ok' && (
              <>
              <div className="divide-y divide-[var(--wex-line)]/12 border-y border-[var(--wex-line)]/12">
                {oradoras.map((oradora, idx) => {
                  const isActive = oradora.id === activeOradora.id;
                  return (
                    <button
                      key={oradora.id}
                      type="button"
                      onClick={() => setSelectedOradoraId(oradora.id)}
                      onMouseEnter={() => setSelectedOradoraId(oradora.id)}
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
                            {oradora.nome}
                          </span>
                          <span className="block mt-1 text-xs sm:text-sm font-medium text-[#B95E26]">
                            {oradora.cargo}
                          </span>
                          <span className="block mt-2.5 text-xs sm:text-sm text-[var(--wex-muted)] leading-relaxed">
                            {oradora.foco}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`font-[family-name:var(--font-caverna-mono)] text-xs shrink-0 ${
                          isActive ? 'text-[#B95E26]' : 'text-[var(--wex-muted-2)]'
                        }`}
                      >
                        {isActive ? 'Ativa' : 'Ver'}
                      </span>
                    </button>
                  );
                })}
              </div>
              </>
              )}

              {/* Compact Quick Portrait Strip */}
              {estadoOradoras === 'ok' && oradoras.length > 0 && (
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                {oradoras.map((o) => {
                  const isActive = o.id === activeOradora.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedOradoraId(o.id)}
                      aria-label={`Selecionar ${o.nome}`}
                      className={`aspect-[3/4] overflow-hidden border transition-all cursor-pointer ${
                        isActive ? 'border-[#B95E26] opacity-100' : 'border-[var(--wex-line)]/12 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {o.fotoUrl && !failedImages[o.id] ? (
                        <img
                          src={o.fotoUrl}
                          alt={o.nome}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center 15%' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--wex-surface-2)] flex items-center justify-center text-xs font-bold text-[var(--wex-muted)]">
                          {o.nome.slice(0, 2)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
