import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { invalidatePublicSecoesCache } from './publicDataService';
import type {
  OradoraAdmin,
  ItemProgramacao,
  Parceiro,
  SecaoConteudo,
  SecaoItem,
  LogAuditoria,
} from '../types/database';

// ==============================================================================
// 1. ORADORAS & MENTORAS
// ==============================================================================

/** Ids reais em base de dados são UUID; ids de demonstração (`gilsa`, `oradora-…`)
 * não o são — nesse caso é feito INSERT para que a edição persista. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id?: string | null): boolean {
  return Boolean(id && UUID_RE.test(id));
}

function mapOradoraRow(row: any): OradoraAdmin {
  return {
    id: row.id,
    nome: row.nome,
    cargo: row.cargo,
    subtitulo: row.subtitulo || '',
    biografia: row.biografia || '',
    fotoUrl: row.foto_url,
    isMain: Boolean(row.is_main),
    ordem: row.ordem || 0,
    visivel: Boolean(row.visivel),
  };
}

export async function fetchAdminOradoras(): Promise<OradoraAdmin[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('oradoras')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro ao listar oradoras:', error);
    throw new Error(`Não foi possível carregar as oradoras: ${error.message}`);
  }
  return (data || []).map(mapOradoraRow);
}

/** Cria ou atualiza uma oradora e devolve o registo persistido (com o id real). */
export async function saveAdminOradora(oradora: Partial<OradoraAdmin>): Promise<OradoraAdmin> {
  if (!isSupabaseConfigured) return oradora as OradoraAdmin;
  const payload = {
    nome: oradora.nome,
    cargo: oradora.cargo,
    subtitulo: oradora.subtitulo || null,
    biografia: oradora.biografia || null,
    foto_url: oradora.fotoUrl,
    is_main: Boolean(oradora.isMain),
    ordem: oradora.ordem || 0,
    visivel: oradora.visivel !== false,
  };

  if (isUuid(oradora.id)) {
    const { data, error } = await supabase
      .from('oradoras')
      .update(payload)
      .eq('id', oradora.id)
      .select()
      .single();
    if (error) throw new Error(`Não foi possível guardar a oradora: ${error.message}`);
    return mapOradoraRow(data);
  }

  const { data, error } = await supabase.from('oradoras').insert(payload).select().single();
  if (error) throw new Error(`Não foi possível criar a oradora: ${error.message}`);
  return mapOradoraRow(data);
}

export async function deleteAdminOradora(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from('oradoras').delete().eq('id', id);
  if (error) throw new Error(`Não foi possível remover a oradora: ${error.message}`);
}

// ==============================================================================
// 2. PROGRAMAÇÃO & CRONOGRAMA
// ==============================================================================

function mapProgramacaoRow(row: any): ItemProgramacao {
  let per: 'Manhã' | 'Tarde' | 'Noite' = 'Manhã';
  if (row.periodo === 'tarde') per = 'Tarde';
  if (row.periodo === 'encerramento' || row.periodo === 'noite') per = 'Noite';

  return {
    id: row.id,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    periodo: per,
    titulo: row.titulo,
    descricao: row.descricao || '',
    oradoraNome: row.oradora_nome || '',
    local: row.local || '',
    ordem: row.ordem || 0,
    visivel: Boolean(row.visivel),
  };
}

export async function fetchAdminProgramacao(): Promise<ItemProgramacao[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('programacao')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro ao listar programação:', error);
    throw new Error(`Não foi possível carregar a programação: ${error.message}`);
  }
  return (data || []).map(mapProgramacaoRow);
}

/** Cria ou atualiza uma sessão e devolve o registo persistido (com o id real). */
export async function saveAdminProgramacaoItem(
  item: Partial<ItemProgramacao>
): Promise<ItemProgramacao> {
  if (!isSupabaseConfigured) return item as ItemProgramacao;
  let rawPeriodo = 'manha';
  if (item.periodo === 'Tarde') rawPeriodo = 'tarde';
  if (item.periodo === 'Noite') rawPeriodo = 'encerramento';

  const payload = {
    hora_inicio: item.horaInicio,
    hora_fim: item.horaFim,
    periodo: rawPeriodo,
    titulo: item.titulo,
    descricao: item.descricao || null,
    oradora_nome: item.oradoraNome || null,
    local: item.local || null,
    ordem: item.ordem || 0,
    visivel: item.visivel !== false,
  };

  if (isUuid(item.id)) {
    const { data, error } = await supabase
      .from('programacao')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();
    if (error) throw new Error(`Não foi possível guardar a sessão: ${error.message}`);
    return mapProgramacaoRow(data);
  }

  const { data, error } = await supabase.from('programacao').insert(payload).select().single();
  if (error) throw new Error(`Não foi possível criar a sessão: ${error.message}`);
  return mapProgramacaoRow(data);
}

export async function deleteAdminProgramacaoItem(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from('programacao').delete().eq('id', id);
  if (error) throw new Error(`Não foi possível remover a sessão: ${error.message}`);
}

// ==============================================================================
// 3. PARCEIROS & PROPOSTAS
// ==============================================================================

function mapParceiroRow(row: any): Parceiro {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    responsavel: row.responsavel || '',
    contacto: row.contacto,
    email: row.email || '',
    contribuicao: row.contribuicao || '',
    estado: row.estado,
    logoUrl: row.logo_url || '',
    ordem: row.ordem || 0,
    visivel: Boolean(row.visivel),
    criado_em: row.criado_em,
  };
}

export async function fetchAdminParceiros(): Promise<Parceiro[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('parceiros')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro ao listar parceiros:', error);
    throw new Error(`Não foi possível carregar os parceiros: ${error.message}`);
  }
  return (data || []).map(mapParceiroRow);
}

/**
 * Cria ou atualiza um parceiro e devolve o registo persistido (com o id real).
 * Ids não-UUID (demonstração) originam INSERT, para que a edição persista.
 */
export async function saveAdminParceiro(parceiro: Partial<Parceiro>): Promise<Parceiro> {
  if (!isSupabaseConfigured) return parceiro as Parceiro;

  const payload = {
    nome: parceiro.nome,
    categoria: parceiro.categoria,
    responsavel: parceiro.responsavel || null,
    contacto: parceiro.contacto,
    email: parceiro.email || null,
    contribuicao: parceiro.contribuicao || null,
    estado: parceiro.estado,
    logo_url: parceiro.logoUrl || null,
    ordem: parceiro.ordem || 0,
    visivel: parceiro.visivel !== false,
  };

  if (isUuid(parceiro.id)) {
    const { data, error } = await supabase
      .from('parceiros')
      .update(payload)
      .eq('id', parceiro.id)
      .select()
      .single();
    if (error) throw new Error(`Não foi possível guardar o parceiro: ${error.message}`);
    return mapParceiroRow(data);
  }

  const { data, error } = await supabase.from('parceiros').insert(payload).select().single();
  if (error) throw new Error(`Não foi possível criar o parceiro: ${error.message}`);
  return mapParceiroRow(data);
}

export async function deleteAdminParceiro(id: string) {
  if (!isSupabaseConfigured || !isUuid(id)) return;
  const { error } = await supabase.from('parceiros').delete().eq('id', id);
  if (error) throw new Error(`Não foi possível remover o parceiro: ${error.message}`);
}

// ==============================================================================
// 4. SECÇÕES & CONTEÚDO DINÂMICO
// ==============================================================================
export async function fetchAdminSecoes(): Promise<SecaoConteudo[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('secoes_conteudo')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Erro ao listar seções:', error);
    throw new Error(`Não foi possível carregar as secções: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    chave: row.chave,
    titulo: row.titulo,
    subtitulo: row.subtitulo || '',
    descricao: row.descricao || '',
    visivel: Boolean(row.visivel),
    ordem: row.ordem || 0,
    itens: extrairItensSecao(row.conteudo_json),
    campos: extrairCamposSecao(row.conteudo_json),
    listas: extrairListasSecao(row.conteudo_json),
    ultimaAtualizacao: row.atualizado_em || new Date().toISOString(),
  }));
}

/** Extrai o array `itens` de conteudo_json no formato normalizado SecaoItem. */
export function extrairItensSecao(conteudoJson: unknown): SecaoItem[] | undefined {
  const itens = (conteudoJson as { itens?: unknown })?.itens;
  if (!Array.isArray(itens)) return undefined;
  return itens
    .map((item: any) => ({
      numero: String(item?.numero ?? ''),
      selo: item?.selo ? String(item.selo) : undefined,
      titulo: String(item?.titulo ?? ''),
      descricao: String(item?.descricao ?? ''),
    }))
    .filter((item) => item.titulo.trim() !== '');
}

/** Extrai o mapa `campos` (chave → texto) de conteudo_json. */
export function extrairCamposSecao(conteudoJson: unknown): Record<string, string> | undefined {
  const campos = (conteudoJson as { campos?: unknown })?.campos;
  if (!campos || typeof campos !== 'object' || Array.isArray(campos)) return undefined;
  const mapa: Record<string, string> = {};
  Object.entries(campos as Record<string, unknown>).forEach(([k, v]) => {
    if (typeof v === 'string') mapa[k] = v;
  });
  return Object.keys(mapa).length > 0 ? mapa : undefined;
}

/** Extrai o mapa `listas` (chave → array de strings) de conteudo_json. */
export function extrairListasSecao(conteudoJson: unknown): Record<string, string[]> | undefined {
  const listas = (conteudoJson as { listas?: unknown })?.listas;
  if (!listas || typeof listas !== 'object' || Array.isArray(listas)) return undefined;
  const mapa: Record<string, string[]> = {};
  Object.entries(listas as Record<string, unknown>).forEach(([k, v]) => {
    if (Array.isArray(v)) mapa[k] = v.map((item) => String(item));
  });
  return Object.keys(mapa).length > 0 ? mapa : undefined;
}

/**
 * Grava o conteudo_json completo de uma secção (campos + listas + itens),
 * preservando as partes não enviadas. Lança erro se a chave não existir.
 */
export async function saveAdminSecaoBloco(
  chave: string,
  payload: { campos?: Record<string, string>; listas?: Record<string, string[]>; itens?: SecaoItem[] }
) {
  if (!isSupabaseConfigured) return;

  const { data: atual, error: readError } = await supabase
    .from('secoes_conteudo')
    .select('conteudo_json')
    .eq('chave', chave)
    .maybeSingle();
  if (readError) throw new Error(`Não foi possível ler a secção: ${readError.message}`);
  if (!atual) throw new Error(`A secção "${chave}" não existe na base de dados.`);

  const jsonAtual = (atual.conteudo_json as Record<string, unknown>) || {};
  const novoJson: Record<string, unknown> = { ...jsonAtual };
  if (payload.campos !== undefined) novoJson.campos = payload.campos;
  if (payload.listas !== undefined) novoJson.listas = payload.listas;
  if (payload.itens !== undefined) novoJson.itens = payload.itens;

  const { error } = await supabase
    .from('secoes_conteudo')
    .update({ conteudo_json: novoJson, atualizado_em: new Date().toISOString() })
    .eq('chave', chave);

  if (error) throw new Error(`Não foi possível guardar o conteúdo: ${error.message}`);
  invalidatePublicSecoesCache();
}

/**
 * Grava a lista de itens (conteudo_json.itens) de uma secção identificada
 * pela `chave`. Não altera título/subtítulo/descrição nem visibilidade.
 */
export async function saveAdminSecaoItens(chave: string, itens: SecaoItem[]) {
  return saveAdminSecaoBloco(chave, { itens });
}

/**
 * Grava o texto (título / subtítulo / descrição) de uma secção identificada
 * pela `chave`. Lança erro se a chave não existir na tabela, para evitar
 * silenciosamente um "sucesso" sem qualquer linha atualizada.
 */
export async function saveAdminSecao(
  chave: string,
  titulo: string,
  subtitulo: string,
  descricao: string
) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('secoes_conteudo')
    .update({ titulo, subtitulo, descricao, atualizado_em: new Date().toISOString() })
    .eq('chave', chave)
    .select('chave');

  if (error) throw new Error(`Não foi possível guardar o conteúdo: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(
      `A secção "${chave}" não existe na base de dados — nenhuma linha foi atualizada.`
    );
  }
  invalidatePublicSecoesCache();
}

export async function toggleAdminSecaoVisibilidade(chave: string, visivel: boolean) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('secoes_conteudo')
    .update({ visivel, atualizado_em: new Date().toISOString() })
    .eq('chave', chave)
    .select('chave');

  if (error) throw new Error(`Não foi possível alterar a visibilidade: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(
      `A secção "${chave}" não existe na base de dados — a visibilidade não foi alterada.`
    );
  }
  invalidatePublicSecoesCache();
}

// ==============================================================================
// 5. AUDITORIA & REGISTO DE LOGS
// ==============================================================================
export async function fetchAdminAuditLogs(): Promise<LogAuditoria[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('logs_auditoria')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      utilizador: row.utilizador_nome || 'Sistema',
      papel: row.papel || 'admin',
      acao: row.accao,
      entidade: row.entidade,
      detalhes: typeof row.detalhes === 'object' ? JSON.stringify(row.detalhes) : row.detalhes,
      criado_em: row.criado_em,
    }));
  } catch (err) {
    console.error('Erro ao listar logs:', err);
    return [];
  }
}

// ==============================================================================
// 6. DIAGNÓSTICO DA BASE DE DADOS
// ==============================================================================
export async function getDatabaseTablesHealth() {
  const tableNames = [
    'app_settings',
    'eventos',
    'lotes_ingressos',
    'inscricoes',
    'interaccoes',
    'oradoras',
    'programacao',
    'parceiros',
    'logos_parceiros',
    'galeria',
    'cartaz_oficial',
    'secoes_conteudo',
    'admins',
    'logs_auditoria',
    'referrals',
  ];

  if (!isSupabaseConfigured) {
    return tableNames.map((t) => ({
      nome: t,
      linhas: 0,
      rls: true,
      status: 'Desconectado (Modo Demo)',
    }));
  }

  const results = await Promise.all(
    tableNames.map(async (name) => {
      try {
        const { count, error } = await supabase
          .from(name)
          .select('*', { count: 'exact', head: true });

        return {
          nome: name,
          linhas: count || 0,
          rls: true,
          status: error ? 'Aviso de Acesso' : 'Operacional',
        };
      } catch {
        return {
          nome: name,
          linhas: 0,
          rls: true,
          status: 'Erro na Consulta',
        };
      }
    })
  );

  return results;
}
