import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { PublicEventConfig } from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';

interface ModernaHeroProps {
  inscricoesAbertas: boolean;
  eventConfig?: PublicEventConfig | null;
}

export default function ModernaHero({ inscricoesAbertas, eventConfig }: ModernaHeroProps) {
  const texto = useSecaoTexto('hero');
  const campos = texto?.campos || {};
  const marqueeFixos = texto?.listas?.marquee_fixos?.length
    ? texto.listas.marquee_fixos
    : ['FORMATO PRESENCIAL', 'ENTRADA GRATUITA'];
  const localizacao = eventConfig?.eventoLocal || '';
  const dataEvento = eventConfig?.eventoData || '';
  const vagas = eventConfig?.vagasTotais || 0;
  const horario = eventConfig?.eventoHorario || '';

  // Subtítulo do hero (editável no admin) + localização das letras "LO" para a ligadura
  const subtitulo = texto?.subtitulo || 'Explosão Profética';
  const idxLo = subtitulo.toUpperCase().indexOf('LO');

  // Linha 1 do h1 — vem do campo "Título" da secção `hero` (Conteúdo Site)
  const tituloHero = (
    texto?.titulo || 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
  )
    .trim()
    .toUpperCase();
  const tituloLongo = tituloHero.length > 24;

  const marqueeItems = [
    // Título da secção editável no módulo "Conteúdo do Site"
    (
      texto?.titulo || 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
    ).toUpperCase(),
    dataEvento.toUpperCase(),
    localizacao.toUpperCase(),
    horario.toUpperCase(),
    vagas > 0 ? `${vagas} VAGAS` : '',
    ...marqueeFixos,
  ].filter(Boolean);

  const scrollTo = (id: string) => {
    // Se a secção de inscrição estiver oculta pelo admin, cai para a logística
    const alvo = document.getElementById(id) || document.getElementById('moderna-logistica');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="moderna-hero" className="bg-[var(--wex-surface)] text-[var(--wex-ink)] overflow-x-clip">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* Top Swiss Editorial Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left 7 cols: Headline + Manifesto */}
          <div className="lg:col-span-12 flex flex-col items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`mt-5 sm:mt-6 font-[family-name:var(--font-moderna-display)] font-extrabold leading-[0.95] text-[var(--wex-ink)] text-balance text-center break-words ${
                  tituloLongo
                    ? 'tracking-[0.04em] sm:tracking-[0.08em]'
                    : 'tracking-[0.16em] sm:tracking-[0.36em]'
                }`}
                style={{ fontSize: 'clamp(1.2rem, 5vw, 2.6rem)' }}
              >
                {tituloHero}
                <span
                  className="block font-semibold text-transparent tracking-[-0.025em] mt-2 uppercase break-words leading-[1.02]"
                  style={{
                    /* Mobile-first: ~12vw com mínimo legível; no desktop atinge o
                       tamanho editorial (máx. 10.3rem). Em ecrãs estreitos o
                       subtítulo quebra naturalmente em duas linhas. */
                    fontSize: 'clamp(2.3rem, 12vw, 10.3rem)',
                    /* Degradê do subtítulo: #FFB739 → #FDF1C5 (Figma: escala X 151%, Y 86%) */
                    backgroundImage: 'linear-gradient(95deg, #FFB739 0%, #FDF1C5 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  {idxLo >= 0 ? (
                    <>
                      {subtitulo.slice(0, idxLo)}
                      <span className="ligadura-lo">{subtitulo.slice(idxLo, idxLo + 2)}</span>
                      {subtitulo.slice(idxLo + 2)}
                    </>
                  ) : (
                    subtitulo
                  )}
                </span>
              </motion.h1>
            </div>

            <div className="mt-8 pt-6 sm:mt-10 sm:pt-7 border-t border-[var(--wex-line)]/12 w-full max-w-3xl flex flex-col items-center gap-5 sm:gap-6 text-center">
              <div className="max-w-2xl space-y-3">
                <p className="text-base sm:text-lg font-semibold text-[var(--wex-ink)] leading-snug">
                  {campos.slogan || '“Desperte a sua essência, viva o seu propósito.”'}
                </p>
                <p className="text-sm text-[var(--wex-muted)] leading-relaxed">
                  {texto?.descricao ||
                    'Uma conferência presencial centrada em fé, identidade, propósito, liderança e capacitação. Um ambiente acolhedor com momentos de inspiração, aprendizagem, comunhão e criação de contactos.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 shrink-0">
                {inscricoesAbertas ? (
                  <button
                    type="button"
                    onClick={() => scrollTo('moderna-inscricao')}
                    className="px-6 py-3.5 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Garantir Vaga</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="px-5 py-3.5 bg-[var(--wex-surface-2)] text-[var(--wex-muted-2)] text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap shrink-0">
                    Lista de Espera
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Horizontal Ribbon */}
      <div className="border-y border-[var(--wex-line)]/12 bg-[var(--wex-surface-2)] overflow-hidden py-3">
        <div className="moderna-marquee-track flex w-max items-center gap-8 whitespace-nowrap font-[family-name:var(--font-caverna-mono)] text-[11px] tracking-[0.16em] text-[var(--wex-ink)]/80">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((text, idx) => (
            <span key={`${text}-${idx}`} className="inline-flex items-center gap-8">
              <span>{text}</span>
              <span aria-hidden="true" className="text-[#B95E26]">
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
