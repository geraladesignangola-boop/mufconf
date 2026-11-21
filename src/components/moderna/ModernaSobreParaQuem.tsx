import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import visaoImg from '../../assets/images/moderna_hero_architecture_1795039044169.jpg';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { Reveal } from '../ui/Reveal';

const COMPONENTES = [
  {
    num: '01',
    title: 'Autoridade com vivência',
    text: 'Ensino de preletoras e mentoras com experiência prática, partilhando princípios aplicáveis à realidade de mulheres em diversas áreas.',
  },
  {
    num: '02',
    title: 'Rede que permanece',
    text: 'Acolhimento genuíno, criação de contactos profissionais e acompanhamento contínuo entre participantes e comunidades.',
  },
  {
    num: '03',
    title: 'Excelência na organização',
    text: 'Pontualidade, conforto no Centro de Convenções Talatona e uma programação dinâmica do credenciamento ao encerramento.',
  },
];

const EIXOS = [
  {
    id: '01',
    tab: '01 · Liderança',
    title: 'Liderança Feminina & Visão',
    desc: 'Capacitação prática e encorajamento para assumires posições de influência com clareza de propósito na família, na igreja e na sociedade.',
  },
  {
    id: '02',
    tab: '02 · Emocional',
    title: 'Resiliência & Gestão Emocional',
    desc: 'Renovação da identidade e ferramentas concretas para lidar com pressões diárias, equilibrar trabalho, fé e fortalecer a saúde emocional.',
  },
  {
    id: '03',
    tab: '03 · Empreendedorismo',
    title: 'Empreendedorismo & Impacto Comunitário',
    desc: 'Inovação, gestão responsável e conexões estratégicas com mulheres e organizações que constroem soluções reais em Angola.',
  },
  {
    id: '04',
    tab: '04 · Espiritual',
    title: 'Vida Familiar & Fortalecimento Espiritual',
    desc: 'Ensino bíblico sólido voltado à restauração familiar, comunhão e aprofundamento na fé para viver o teu propósito diário.',
  },
];

export default function ModernaSobreParaQuem() {
  const texto = useSecaoTexto('visao');
  const camposVisao = texto?.campos || {};
  const textoComponentes = useSecaoTexto('componentes');
  const textoEixos = useSecaoTexto('eixos');
  const [selectedEixo, setSelectedEixo] = useState('01');

  // Listas editáveis no admin (secoes_conteudo.conteudo_json); fallback nos
  // textos embutidos no código quando a secção ainda não existe na BD.
  const componentes =
    textoComponentes && textoComponentes.visivel !== false && textoComponentes.itens.length > 0
      ? textoComponentes.itens.map((item) => ({
          num: item.numero,
          title: item.titulo,
          text: item.descricao,
        }))
      : COMPONENTES;

  const eixos =
    textoEixos && textoEixos.visivel !== false && textoEixos.itens.length > 0
      ? textoEixos.itens.map((item) => ({
          id: item.numero,
          tab: item.selo ? `${item.numero} · ${item.selo}` : item.numero,
          title: item.titulo,
          desc: item.descricao,
        }))
      : EIXOS;

  const eixosOcultos = textoEixos?.visivel === false;
  const componentesOcultos = textoComponentes?.visivel === false;
  const active = eixos.find((p) => p.id === selectedEixo) || eixos[0];

  const scrollToForm = () => {
    const el = document.getElementById('moderna-inscricao');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="moderna-visao" className="bg-[var(--wex-surface)] text-[var(--wex-ink)] border-b border-[var(--wex-line)]/12">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        {/* Part 1: Propósito e Experiência */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Architectural Detail & Theme Pull-Quote (5 cols) */}
          <Reveal className="lg:col-span-5 flex flex-col justify-between border border-[var(--wex-line)]/12 bg-[var(--wex-surface-2)]">
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src={camposVisao.imagem_url || visaoImg}
                alt="Detalhe arquitetónico de pedra clara e bronze anodizado"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-7 sm:p-9">
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                {camposVisao.selo_tema || 'Tema Oficial 2026'}
              </p>
              <blockquote className="mt-4 font-[family-name:var(--font-moderna-display)] text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--wex-ink)] leading-snug text-balance">
                {camposVisao.citacao || '“Desperte a sua essência, viva o seu propósito.”'}
              </blockquote>
              <p className="mt-4 text-xs text-[var(--wex-muted)] leading-relaxed">
                {camposVisao.citacao_apoio || 'Um espaço seguro e profissional para fortalecer a fé, a visão e o propósito de mulheres de diferentes áreas e comunidades.'}
              </p>
            </div>
          </Reveal>

          {/* Right Três Componentes (7 cols) */}
          <Reveal delay={120} className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[var(--wex-muted-2)] uppercase tracking-wider">
                {texto?.titulo ? `01 · ${texto.titulo}` : '01 · Propósito e Experiência'}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06] text-balance">
                {texto?.subtitulo || texto?.titulo || 'Três pilares que sustentam este encontro.'}
              </h2>
              {texto?.descricao && (
                <p className="mt-4 text-sm sm:text-[15px] text-[var(--wex-muted)] leading-relaxed max-w-lg">
                  {texto.descricao}
                </p>
              )}
            </div>

            {!componentesOcultos && (
            <div className="mt-10 divide-y divide-[var(--wex-line)]/12 border-y border-[var(--wex-line)]/12">
              {componentes.map((item) => (
                <div key={item.num} className="py-6 sm:py-7 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6">
                  <span className="sm:col-span-2 font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] tabular-nums pt-1">
                    {item.num}
                  </span>
                  <div className="sm:col-span-10">
                    <h3 className="font-[family-name:var(--font-moderna-display)] text-xl font-bold text-[var(--wex-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-[15px] text-[var(--wex-muted)] leading-relaxed max-w-prose">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            )}
          </Reveal>
        </div>

        {/* Part 2: Temas e Resultados (Interactive Segmented Reader) */}
        {!eixosOcultos && (
        <div id="moderna-temas" className="mt-24 pt-20 border-t border-[var(--wex-line)]/12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                {`02 · ${textoEixos?.titulo || 'Eixos Temáticos & Resultados'}`}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--wex-ink)] leading-tight">
                {textoEixos?.subtitulo || textoEixos?.titulo || 'O que vais construir na conferência'}
              </h2>
              {textoEixos?.descricao && (
                <p className="mt-4 text-sm text-[var(--wex-muted)] leading-relaxed max-w-xl">
                  {textoEixos.descricao}
                </p>
              )}
            </div>

            {/* Interactive Segmented Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/10">
              {eixos.map((eixo) => {
                const isActive = eixo.id === selectedEixo;
                return (
                  <button
                    key={eixo.id}
                    type="button"
                    onClick={() => setSelectedEixo(eixo.id)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-2 text-xs font-semibold font-[family-name:var(--font-caverna-mono)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[var(--wex-cta-bg)] text-[var(--wex-cta-fg)]'
                        : 'text-[var(--wex-muted)] hover:text-[var(--wex-ink)]'
                    }`}
                  >
                    {eixo.tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacious Editorial Reader Stage */}
          <Reveal delay={100} className="mt-10 bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 p-8 sm:p-12 lg:p-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
              >
                <div className="lg:col-span-2">
                  <span className="font-[family-name:var(--font-moderna-display)] text-5xl sm:text-6xl font-extrabold text-[#B95E26] tabular-nums">
                    {active.id}
                  </span>
                </div>
                <div className="lg:col-span-7">
                  <h3 className="font-[family-name:var(--font-moderna-display)] text-2xl sm:text-3xl font-bold text-[var(--wex-ink)] leading-tight text-balance">
                    {active.title}
                  </h3>
                  <p className="mt-4 text-base text-[var(--wex-muted)] leading-relaxed max-w-2xl">
                    {active.desc}
                  </p>
                </div>
                <div className="lg:col-span-3 flex lg:justify-end">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-[0.12em] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Garantir Vaga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
        )}
      </div>
    </section>
  );
}
