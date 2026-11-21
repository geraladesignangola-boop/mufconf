import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { resolveImageUrl } from './imageUrlService';
import type { OradoraAdmin, ItemProgramacao, ItemGaleria, CartazConfig, MaterialAtalho, SecaoItem } from '../types/database';

// ==============================================================================
// SERVIÇOS DE BUSCA E INTEGRAÇÃO DO SITE PÚBLICO
// ==============================================================================

export interface PublicEventConfig {
  inscricoesAbertas: boolean;
  checkinAberto: boolean;
  vagasTotais: number;
  whatsappGroupLink: string;
  eventoTitulo: string;
  eventoData: string;
  eventoHorario: string;
  eventoLocal: string;
}

const EMPTY_EVENT_CONFIG: PublicEventConfig = {
  inscricoesAbertas: true,
  checkinAberto: false,
  vagasTotais: 0,
  whatsappGroupLink: '',
  eventoTitulo: '',
  eventoData: '',
  eventoHorario: '',
  eventoLocal: '',
};

/**
 * Procura as configurações gerais ativas do evento
 */
export async function fetchPublicEventConfig(): Promise<PublicEventConfig> {
  if (!isSupabaseConfigured) return EMPTY_EVENT_CONFIG;

  try {
    const { data, error } = await supabase.from('app_settings').select('key, value');
    if (error || !data) return EMPTY_EVENT_CONFIG;

    const map = new Map(data.map((item) => [item.key, item.value]));
    return {
      inscricoesAbertas: map.get('inscricoes_abertas') !== 'false',
      checkinAberto: map.get('checkin_aberto') === 'true',
      vagasTotais: parseInt(map.get('vagas_totais') || '0', 10),
      whatsappGroupLink: map.get('whatsapp_group_link') || '',
      eventoTitulo: map.get('evento_titulo') || '',
      eventoData: map.get('evento_data') || '',
      eventoHorario: map.get('evento_horario') || '',
      eventoLocal: map.get('evento_local') || '',
    };
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar configurações.', err);
    return EMPTY_EVENT_CONFIG;
  }
}

export interface PublicSecaoTexto {
  chave: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  visivel: boolean;
  itens: SecaoItem[];
  campos: Record<string, string>;
  listas: Record<string, string[]>;
}

function extrairMapaTexto(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};
  const mapa: Record<string, string> = {};
  Object.entries(valor as Record<string, unknown>).forEach(([k, v]) => {
    if (typeof v === 'string') mapa[k] = v;
  });
  return mapa;
}

function extrairMapaListas(valor: unknown): Record<string, string[]> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};
  const mapa: Record<string, string[]> = {};
  Object.entries(valor as Record<string, unknown>).forEach(([k, v]) => {
    if (Array.isArray(v)) mapa[k] = v.map((item) => String(item));
  });
  return mapa;
}

/** Extrai itens de listas editáveis guardadas em conteudo_json (formato normalizado). */
function extrairItensPublicos(conteudoJson: unknown): SecaoItem[] {
  const itens = (conteudoJson as { itens?: unknown })?.itens;
  if (!Array.isArray(itens)) return [];
  return itens
    .map((item: any) => ({
      numero: String(item?.numero ?? ''),
      selo: item?.selo ? String(item.selo) : undefined,
      titulo: String(item?.titulo ?? ''),
      descricao: String(item?.descricao ?? ''),
    }))
    .filter((item) => item.titulo.trim() !== '');
}

let secoesPublicasCache: Promise<Record<string, PublicSecaoTexto>> | null = null;

/** Limpa a cache das secções públicas (usado pelo admin após guardar alterações). */
export function invalidatePublicSecoesCache() {
  secoesPublicasCache = null;
}

/**
 * Procura os textos (título / subtítulo / descrição) de cada secção da landing
 * page, exatamente como são editados no painel admin (tabela secoes_conteudo).
 * O resultado é colocado em cache a nível de módulo — todas as secções da
 * página partilham um único pedido.
 */
export function fetchPublicSecoes(): Promise<Record<string, PublicSecaoTexto>> {
  if (!isSupabaseConfigured) return Promise.resolve({});

  if (!secoesPublicasCache) {
    secoesPublicasCache = (async () => {
      try {
        const { data, error } = await supabase
          .from('secoes_conteudo')
          .select('chave, titulo, subtitulo, descricao, visivel, conteudo_json')
          .order('ordem', { ascending: true });

        if (error || !data) return {};
        const map: Record<string, PublicSecaoTexto> = {};
        data.forEach((row) => {
          map[row.chave] = {
            chave: row.chave,
            titulo: row.titulo || '',
            subtitulo: row.subtitulo || '',
            descricao: row.descricao || '',
            visivel: row.visivel !== false,
            itens: extrairItensPublicos(row.conteudo_json),
            campos: extrairMapaTexto((row.conteudo_json as any)?.campos),
            listas: extrairMapaListas((row.conteudo_json as any)?.listas),
          };
        });
        return map;
      } catch (err) {
        console.warn('[PublicDataService] Erro ao carregar textos das secções:', err);
        return {};
      }
    })();
  }

  return secoesPublicasCache;
}

/**
 * Procura oradoras ativas da base de dados
 */
export async function fetchPublicOradoras(): Promise<OradoraAdmin[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('oradoras')
      .select('*')
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar oradoras');
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      nome: row.nome,
      cargo: row.cargo,
      subtitulo: row.subtitulo || '',
      biografia: row.biografia || '',
      fotoUrl: resolveImageUrl(row.foto_url),
      isMain: Boolean(row.is_main),
      ordem: row.ordem || 0,
      visivel: Boolean(row.visivel),
    }));
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar oradoras.', err);
    throw err;
  }
}

/**
 * Procura cronograma / programação ativa da base de dados
 */
export async function fetchPublicProgramacao(): Promise<ItemProgramacao[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('programacao')
      .select('*')
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar programação');
    if (!data) return [];

    return data.map((row) => {
      let periodoFormatado: 'Manhã' | 'Tarde' | 'Noite' = 'Manhã';
      if (row.periodo === 'tarde') periodoFormatado = 'Tarde';
      if (row.periodo === 'encerramento' || row.periodo === 'noite') periodoFormatado = 'Noite';

      return {
        id: row.id,
        horaInicio: row.hora_inicio,
        horaFim: row.hora_fim,
        periodo: periodoFormatado,
        titulo: row.titulo,
        descricao: row.descricao || '',
        oradoraNome: row.oradora_nome || '',
        local: row.local || '',
        ordem: row.ordem || 0,
        visivel: Boolean(row.visivel),
      };
    });
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar programação.', err);
    throw err;
  }
}

/**
 * Procura nomes de parceiros ativos
 */
export async function fetchPublicPartnerLogos(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('parceiros')
      .select('nome')
      .eq('visivel', true)
      .eq('estado', 'Confirmado')
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar parceiros');
    if (!data) return [];
    return data.map((p) => p.nome);
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar parceiros.', err);
    throw err;
  }
}

export interface PublicLogoParceiro {
  id: string;
  nome: string;
  logoUrl: string;
}

/**
 * Procura os logótipos de parceiros geridos no painel admin (tabela logos_parceiros).
 * Devolve lista vazia quando não há dados, para o chamador decidir o fallback.
 */
export async function fetchPublicLogoParceiros(): Promise<PublicLogoParceiro[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('logos_parceiros')
      .select('id, nome, logo_url')
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar logos de parceiros');
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      nome: row.nome,
      logoUrl: resolveImageUrl(row.logo_url),
    }));
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar logos de parceiros:', err);
    throw err;
  }
}

/**
 * Submete uma proposta de patrocínio / parceria do site público
 */
export async function submitPublicPartnerApplication(payload: {
  empresa: string;
  responsavel: string;
  contacto: string;
  categoria: 'Diamante' | 'Ouro' | 'Prata' | 'Bronze' | 'Apoio';
  mensagem?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Serviço indisponível. Tenta novamente mais tarde.' };
  }

  try {
    const { error } = await supabase.from('parceiros').insert({
      nome: payload.empresa.trim(),
      responsavel: payload.responsavel.trim(),
      contacto: payload.contacto.trim(),
      categoria: payload.categoria,
      contribuicao: payload.mensagem?.trim() || null,
      estado: 'Em análise',
      visivel: false,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[PublicDataService] Erro ao submeter proposta:', err);
    return { success: false, error: err.message || 'Erro ao submeter proposta' };
  }
}

/**
 * Procura os itens da galeria de fotos aprovados pelo admin
 */
export async function fetchPublicGaleria(): Promise<ItemGaleria[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('galeria')
      .select('*')
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar galeria');
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      url: resolveImageUrl(row.foto_url),
      titulo: row.titulo || '',
      legenda: row.legenda || '',
      categoria: row.categoria || undefined,
      ordem: row.ordem || 0,
      visivel: Boolean(row.visivel),
      criado_em: row.criado_em || '',
    }));
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar galeria:', err);
    throw err;
  }
}

/**
 * Procura o cartaz oficial ativo configurado pelo admin.
 * Devolve `null` quando não existe nenhum cartaz ativo.
 */
export async function fetchPublicCartaz(): Promise<CartazConfig | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('cartaz_oficial')
      .select('*')
      .eq('ativo', true)
      .order('ano', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message || 'Erro ao carregar cartaz');
    if (!data) return null;

    return {
      url: resolveImageUrl(data.imagem_url),
      titulo: data.titulo || '',
      descricao: data.descricao || '',
      resolucao: data.resolucao || '',
      tamanho: data.tamanho || '',
      ativo: Boolean(data.ativo),
      atualizado_em: data.atualizado_em || '',
    };
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar cartaz oficial:', err);
    throw err;
  }
}

/**
 * Procura os lotes de ingressos ativos configurados pelo admin
 */
export async function fetchPublicLotes(): Promise<{ id: string; nome: string; preco: number; capacidade: number }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('lotes_ingressos')
      .select('id, nome, preco, capacidade')
      .eq('ativo', true)
      .order('criado_em', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar lotes');
    if (!data) return [];

    return data;
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar lotes.', err);
    throw err;
  }
}

/**
 * Procura os materiais e atalhos visíveis configurados no painel admin
 * (secção "Materiais & Atalhos" do site público).
 */
export async function fetchPublicMateriaisAtalhos(): Promise<MaterialAtalho[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('materiais_atalhos')
      .select('*')
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    if (error) throw new Error(error.message || 'Erro ao carregar materiais');
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      tipo: row.tipo === 'material' ? 'material' : 'atalho',
      titulo: row.titulo || '',
      descricao: row.descricao || undefined,
      url: row.url || '',
      ordem: row.ordem || 0,
      visivel: Boolean(row.visivel),
      criado_em: row.criado_em || '',
    }));
  } catch (err) {
    console.warn('[PublicDataService] Erro ao carregar materiais e atalhos:', err);
    throw err;
  }
}
