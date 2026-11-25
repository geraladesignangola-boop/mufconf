import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Menu, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPublicEventConfig, PublicEventConfig } from '../services/publicDataService';
import { useSecaoTexto } from '../hooks/useSecaoTexto';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { usePageMeta } from '../hooks/usePageMeta';
import { EVENT_JSON_LD, ORGANIZATION_JSON_LD, WEBSITE_JSON_LD } from '../lib/seo';

import ThemeToggle from '../components/ThemeToggle';
import logoMulheresDeFogo from '../assets/images/logo_mulheres_de_fogo.png';

import ModernaHero from '../components/moderna/ModernaHero';
import ModernaSobreParaQuem from '../components/moderna/ModernaSobreParaQuem';
import ModernaJornadaMentoras from '../components/moderna/ModernaJornadaMentoras';
import ModernaFlyers from '../components/moderna/ModernaFlyers';
import ModernaParcerias from '../components/moderna/ModernaParcerias';
import ModernaGaleria from '../components/moderna/ModernaGaleria';
import ModernaLogisticaInscricao from '../components/moderna/ModernaLogisticaInscricao';
import ModernaMateriaisAtalhos from '../components/moderna/ModernaMateriaisAtalhos';
import ModernaApoioParticipante from '../components/moderna/ModernaApoioParticipante';

export default function ModernaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  const [eventConfig, setEventConfig] = useState<PublicEventConfig | null>(null);
  const textoFooter = useSecaoTexto('footer');
  const camposFooter = textoFooter?.campos || {};
  const secaoAtiva = useScrollSpy([
    'moderna-hero',
    'moderna-visao',
    'moderna-programacao',
    'moderna-oradoras',
    'moderna-flyers',
    'moderna-parcerias',
    'moderna-logistica',
    'apoio-participante',
    'moderna-materiais',
    'moderna-galeria',
  ]);
  const [secoesVisiveis, setSecoesVisiveis] = useState<Record<string, boolean>>({
    hero: true,
    visao: true,
    programacao: true,
    oradoras: true,
    flyers: true,
    parcerias: true,
    galeria: true,
    logistica: true,
    inscricao: true,
    materiais: true,
    footer: true,
  });

  usePageMeta({
    title: 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição | Luanda, Angola',
    description:
      'Conferência de fé, identidade, propósito, liderança e capacitação para mulheres. 5 de Dezembro de 2026, Talatona Shopping, Luanda. Inscrição gratuita.',
    path: '/',
    jsonLd: [EVENT_JSON_LD, ORGANIZATION_JSON_LD, WEBSITE_JSON_LD],
  });

  useEffect(() => {
    const fetchStatusAndSections = async () => {
      const config = await fetchPublicEventConfig();
      setEventConfig(config);
      setInscricoesAbertas(config.inscricoesAbertas);

      if (!isSupabaseConfigured) return;
      try {
        const { data: secoesData } = await supabase
          .from('secoes_conteudo')
          .select('chave, visivel');

        if (secoesData && secoesData.length > 0) {
          const map: Record<string, boolean> = {};
          secoesData.forEach((s) => {
            // normaliza chaves com ou sem -section
            const key = s.chave.replace('-section', '');
            map[key] = s.visivel;
            map[s.chave] = s.visivel;
          });
          setSecoesVisiveis((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // fallback limpo
      }
    };
    fetchStatusAndSections();
  }, []);

  // Fecha o menu mobile com Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const navLinkClass = (id: string) =>
    `transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      secaoAtiva === id
        ? 'text-[var(--wex-ink)] font-semibold'
        : 'text-[var(--wex-muted)] hover:text-[var(--wex-ink)]'
    }`;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--wex-surface)] text-[var(--wex-ink)] font-[family-name:var(--font-caverna-body)] selection:bg-[#B95E26]/20 selection:text-[var(--wex-ink)]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 w-full bg-[var(--wex-surface)]/92 backdrop-blur-md border-b border-[var(--wex-line)]/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => scrollTo('moderna-hero')}
            className="shrink-0 cursor-pointer"
            aria-label="MULHERES DE FOGO — início"
          >
            <img
              src={logoMulheresDeFogo}
              alt="Mulheres de Fogo"
              className="h-9 w-auto"
            />
          </button>

          {/* Zone 2: 5 Concise Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[var(--wex-muted)]">
            {secoesVisiveis.visao !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-visao')}
                className={navLinkClass('moderna-visao')} aria-current={secaoAtiva === 'moderna-visao' ? 'true' : undefined}
              >
                Propósito
              </button>
            )}
            {secoesVisiveis.programacao !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-programacao')}
                className={navLinkClass('moderna-programacao')} aria-current={secaoAtiva === 'moderna-programacao' ? 'true' : undefined}
              >
                Programação
              </button>
            )}
            {secoesVisiveis.oradoras !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-oradoras')}
                className={navLinkClass('moderna-oradoras')} aria-current={secaoAtiva === 'moderna-oradoras' ? 'true' : undefined}
              >
                Oradoras
              </button>
            )}
            {secoesVisiveis.flyers !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-flyers')}
                className={navLinkClass('moderna-flyers')} aria-current={secaoAtiva === 'moderna-flyers' ? 'true' : undefined}
              >
                Flyers
              </button>
            )}
            {secoesVisiveis.parcerias !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-parcerias')}
                className={navLinkClass('moderna-parcerias')} aria-current={secaoAtiva === 'moderna-parcerias' ? 'true' : undefined}
              >
                Parcerias
              </button>
            )}
            {secoesVisiveis.logistica !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-logistica')}
                className={navLinkClass('moderna-logistica')} aria-current={secaoAtiva === 'moderna-logistica' ? 'true' : undefined}
              >
                Acesso
              </button>
            )}
            {secoesVisiveis.galeria !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-galeria')}
                className={navLinkClass('moderna-galeria')} aria-current={secaoAtiva === 'moderna-galeria' ? 'true' : undefined}
              >
                Galeria
              </button>
            )}
            {secoesVisiveis.materiais !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-materiais')}
                className={navLinkClass('moderna-materiais')} aria-current={secaoAtiva === 'moderna-materiais' ? 'true' : undefined}
              >
                Materiais
              </button>
            )}
          </nav>

          {/* Zone 3: Theme toggle + Single Primary Action */}
          <div className="hidden md:flex items-center shrink-0 gap-2">
            <ThemeToggle />
            {secoesVisiveis.inscricao !== false && (
              <button
                type="button"
                onClick={() => scrollTo('moderna-inscricao')}
                className="px-5 py-2 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] font-semibold text-xs uppercase tracking-[0.12em] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {inscricoesAbertas ? 'Garantir Vaga' : 'Lista de Espera'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-mobile"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 text-[var(--wex-ink)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="menu-mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[var(--wex-surface)] border-t border-[var(--wex-line)]/10 overflow-hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-3 text-sm font-medium text-[var(--wex-muted)]">
                {secoesVisiveis.visao !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-visao')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Propósito
                  </button>
                )}
                {secoesVisiveis.programacao !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-programacao')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Programação
                  </button>
                )}
                {secoesVisiveis.oradoras !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-oradoras')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Oradoras
                  </button>
                )}
                {secoesVisiveis.flyers !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-flyers')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Flyers
                  </button>
                )}
                {secoesVisiveis.parcerias !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-parcerias')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Parcerias
                  </button>
                )}
                {secoesVisiveis.logistica !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-logistica')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Acesso
                  </button>
                )}
                {secoesVisiveis.galeria !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-galeria')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Galeria
                  </button>
                )}
                {secoesVisiveis.materiais !== false && (
                  <button type="button" onClick={() => scrollTo('moderna-materiais')} className="py-1.5 text-left hover:text-[var(--wex-ink)]">
                    Materiais
                  </button>
                )}
                {secoesVisiveis.inscricao !== false && (
                  <button
                    type="button"
                    onClick={() => scrollTo('moderna-inscricao')}
                    className="mt-2 py-3 bg-[var(--wex-cta-bg)] text-[var(--wex-cta-fg)] font-semibold text-xs uppercase tracking-[0.12em]"
                  >
                    {inscricoesAbertas ? 'Garantir Vaga' : 'Lista de Espera'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {secoesVisiveis.hero !== false && (
          <ModernaHero
            inscricoesAbertas={inscricoesAbertas}
            eventConfig={eventConfig}
          />
        )}
        {secoesVisiveis.visao !== false && <ModernaSobreParaQuem />}
        {(secoesVisiveis.programacao !== false || secoesVisiveis.oradoras !== false) && (
          <ModernaJornadaMentoras />
        )}
        {secoesVisiveis.flyers !== false && <ModernaFlyers />}
        {secoesVisiveis.parcerias !== false && <ModernaParcerias />}
        {(secoesVisiveis.logistica !== false || secoesVisiveis.inscricao !== false) && (
          <ModernaLogisticaInscricao
            mostrarLogistica={secoesVisiveis.logistica !== false}
            mostrarInscricao={secoesVisiveis.inscricao !== false}
          />
        )}
        <ModernaApoioParticipante />
        {secoesVisiveis.materiais !== false && <ModernaMateriaisAtalhos />}
        {secoesVisiveis.galeria !== false && <ModernaGaleria />}
      </main>

      {/* Quiet Architectural Footer */}
      {secoesVisiveis.footer !== false && (
      <footer className="bg-[var(--wex-dark-block)] text-[#A2A09A] border-t border-[#F7F7F5]/12 py-14 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#F7F7F5]/10">
            <div className="md:col-span-5">
              <p className="font-[family-name:var(--font-moderna-display)] text-lg font-extrabold text-[var(--wex-on-dark)]">
                {textoFooter?.titulo ||
                  'CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2ª EDIÇÃO'}
              </p>
              <p className="mt-3 text-sm text-[#A2A09A] max-w-sm leading-relaxed">
                {textoFooter?.subtitulo || '“Desperte a sua essência, viva o seu propósito.”'}
              </p>
              <p className="mt-2 text-xs text-[#8D8B84]">
                {camposFooter.morada ||
                  textoFooter?.descricao ||
                  'Via A1, Talatona, Luanda, Angola · Centro de Convenções Talatona'}
              </p>
            </div>

            <div className="md:col-span-4 space-y-2 text-sm">
              <p className="font-[family-name:var(--font-caverna-mono)] text-[11px] uppercase tracking-wider text-[var(--wex-muted-2)]">
                {camposFooter.lbl_atendimento || 'Atendimento & Organização'}
              </p>
              <p>
                <a
                  href={camposFooter.fone_href || 'tel:+244932583167'}
                  className="text-[var(--wex-on-dark)] hover:text-[#B95E26] font-[family-name:var(--font-caverna-mono)] tabular-nums"
                >
                  {camposFooter.fone_display || '+244 932 583 167'}
                </a>
              </p>
              <p>
                <a
                  href={camposFooter.email_href || 'mailto:geral@womanexperience.ao'}
                  className="text-[var(--wex-on-dark)] hover:text-[#B95E26] font-[family-name:var(--font-caverna-mono)]"
                >
                  {camposFooter.email_display || 'geral@womanexperience.ao'}
                </a>
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-sm">
              <p className="font-[family-name:var(--font-caverna-mono)] text-[11px] uppercase tracking-wider text-[var(--wex-muted-2)]">
                {camposFooter.lbl_ligacoes || 'Ligações'}
              </p>
              <div className="flex flex-col gap-1.5">
                <a
                  href={camposFooter.ig_url || 'https://www.instagram.com/muf.mulheresdefogo/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--wex-on-dark)] transition-colors"
                >
                  {camposFooter.ig_label || 'Instagram'}
                </a>
                <a
                  href={camposFooter.fb_url || 'https://www.facebook.com/profile.php?id=61583199112349'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--wex-on-dark)] transition-colors"
                >
                  {camposFooter.fb_label || 'Facebook'}
                </a>
                <button
                  type="button"
                  onClick={() => scrollTo('apoio-participante')}
                  className="text-left hover:text-[var(--wex-on-dark)] transition-colors cursor-pointer"
                >
                  Bilhete e ajuda
                </button>
                <Link to="/termos" className="hover:text-[var(--wex-on-dark)] transition-colors">
                  Termos & Privacidade
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--wex-muted-2)]">
            <p>
              {(camposFooter.copyright ||
                '© {ano} Conferência Explosão Profética Mulheres de Fogo — 2ª Edição · Centro de Convenções Talatona, Luanda.'
              ).replace('{ano}', String(new Date().getFullYear()))}
            </p>
            <button
              type="button"
              onClick={() => scrollTo('moderna-hero')}
              className="inline-flex items-center gap-1.5 text-[#A2A09A] hover:text-[var(--wex-on-dark)] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{camposFooter.voltar_topo || 'Voltar ao topo'}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
