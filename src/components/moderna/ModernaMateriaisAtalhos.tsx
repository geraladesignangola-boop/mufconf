import React, { useCallback, useEffect, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  ImageOff,
  Link2,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import {
  fetchPublicCartaz,
  fetchPublicEventConfig,
  fetchPublicMateriaisAtalhos,
} from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { SkeletonCards } from '../ui/Skeleton';
import { Reveal } from '../ui/Reveal';
import type { CartazConfig, MaterialAtalho } from '../../types/database';

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function abrirUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function descarregarOuAbrir(url: string, forcarDownload: boolean) {
  const remoto = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
  if (remoto || !forcarDownload) {
    abrirUrl(url);
    return;
  }
  const nomeFicheiro = url.split('/').pop()?.split('?')[0] || 'material';
  triggerDownload(url, nomeFicheiro);
}

interface CartaoProps {
  key?: React.Key;
  titulo: string;
  descricao?: string;
  rotuloAcao: string;
  Icone: React.ElementType;
  onClick: () => void;
}

function Cartao({ titulo, descricao, rotuloAcao, Icone, onClick }: CartaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-[var(--wex-card)] border border-[var(--wex-line)]/12 p-6 flex flex-col justify-between gap-6 hover:border-[#B95E26]/60 transition-colors cursor-pointer h-full"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="p-3 bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 text-[#B95E26]">
          <Icone className="w-5 h-5" />
        </span>
        <ExternalLink className="w-4 h-4 text-[var(--wex-muted-2)] group-hover:text-[#B95E26] transition-colors" />
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-moderna-display)] text-lg font-bold text-[var(--wex-ink)] leading-snug">
          {titulo}
        </h3>
        {descricao && (
          <p className="mt-2 text-sm text-[var(--wex-muted)] leading-relaxed line-clamp-2">
            {descricao}
          </p>
        )}
        <p className="mt-3 font-[family-name:var(--font-caverna-mono)] text-[10px] uppercase tracking-wider text-[var(--wex-muted-2)]">
          {rotuloAcao}
        </p>
      </div>
    </button>
  );
}

export default function ModernaMateriaisAtalhos() {
  const texto = useSecaoTexto('materiais');
  const [itens, setItens] = useState<MaterialAtalho[]>([]);
  const [cartaz, setCartaz] = useState<CartazConfig | null>(null);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [estado, setEstado] = useState<'loading' | 'ok' | 'error'>('loading');

  const carregar = useCallback(async () => {
    setEstado('loading');
    try {
      const [materiais, cartazData, config] = await Promise.all([
        fetchPublicMateriaisAtalhos(),
        fetchPublicCartaz(),
        fetchPublicEventConfig(),
      ]);
      setItens(materiais);
      setCartaz(cartazData);
      setWhatsappGroupLink(config.whatsappGroupLink);
      setEstado('ok');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O link do grupo de WhatsApp vem de app_settings (editado em Definições);
  // os restantes atalhos são linhas da tabela materiais_atalhos.
  const atalhosFixos = whatsappGroupLink
    ? [{
        key: 'grupo',
        titulo: 'Entrar no Grupo de WhatsApp',
        url: whatsappGroupLink,
        Icone: MessageCircle,
      }]
    : [];

  return (
    <section id="moderna-materiais" className="bg-[var(--wex-surface)] border-b border-[var(--wex-line)]/12 py-20 lg:py-28">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header da Secção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[var(--wex-line)]/12">
          <div>
            <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
              {texto?.titulo ? `09 · ${texto.titulo}` : '09 · Materiais & Atalhos'}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06]">
              {texto?.subtitulo || texto?.titulo || 'Materiais & Atalhos'}
            </h2>
          </div>
          <p className="text-sm text-[var(--wex-muted)] max-w-sm leading-relaxed">
            {texto?.descricao ||
              'Documentos oficiais para descarregar e ligações rápidas para acompanhar o evento.'}
          </p>
        </div>

        {/* Cartaz oficial, materiais/atalhos do admin e atalhos fixos */}
        {estado === 'loading' && <SkeletonCards count={3} />}

        {estado === 'error' && (
          <div className="mt-10 py-14 text-center border border-[var(--wex-line)]/12 bg-[var(--wex-surface-2)]">
            <ImageOff className="w-8 h-8 mx-auto text-[var(--wex-muted-2)]" />
            <p className="mt-4 text-sm text-[var(--wex-muted)]">
              Não foi possível carregar os materiais. Verifica a tua ligação e tenta novamente.
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

        {estado === 'ok' && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cartaz?.url && (
            <Reveal delay={0}>
            <Cartao
              titulo={cartaz.titulo ? `Descarregar ${cartaz.titulo}` : 'Descarregar Cartaz Oficial'}
              descricao="Cartaz oficial da conferência em alta definição."
              rotuloAcao="Descarregar"
              Icone={Download}
              onClick={() => cartaz.url && descarregarOuAbrir(cartaz.url, true)}
            />
            </Reveal>
          )}

          {/* Materiais e atalhos geridos no painel admin */}
          {itens.map((item, idx) => (
            <Reveal key={item.id} delay={80 + idx * 60}>
            <Cartao
              titulo={item.titulo}
              descricao={item.descricao}
              rotuloAcao={item.tipo === 'material' ? 'Descarregar' : 'Abrir ligação'}
              Icone={item.tipo === 'material' ? FileText : Link2}
              onClick={() => item.url && descarregarOuAbrir(item.url, item.tipo === 'material')}
            />
            </Reveal>
          ))}

          {/* Atalhos fixos */}
          {atalhosFixos.map((atalho, idx) => (
            <Reveal key={atalho.key} delay={80 + (itens.length + idx) * 60}>
            <Cartao
              titulo={atalho.titulo}
              rotuloAcao="Abrir ligação"
              Icone={atalho.Icone}
              onClick={() => abrirUrl(atalho.url)}
            />
            </Reveal>
          ))}
        </div>
        )}

        {estado === 'ok' && !cartaz?.url && itens.length === 0 && atalhosFixos.length === 0 && (
          <p className="mt-10 py-10 text-center text-sm text-[var(--wex-muted)]">
            Os materiais serão publicados em breve.
          </p>
        )}
      </div>
    </section>
  );
}
