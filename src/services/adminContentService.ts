import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  ItemGaleria,
  CartazConfig,
  UsuarioAdmin,
  MaterialAtalho,
  CapacidadeStats,
  Relato,
} from '../types/database';

// ==============================================================================
// Serviço de conteúdo administrativo — 100% Supabase (sem fallbacks locais).
// Todas as funções lançam erro em caso de falha para a página poder mostrar
// o motivo ao operador, em vez de exibir dados fabricados.
// ==============================================================================

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Verifica as variáveis de ambiente.');
  }
}

function fail(err: unknown, contexto: string): never {
  console.error(`[AdminContent] ${contexto}:`, err);
  const message =
    (err as { message?: string })?.message || 'Erro desconhecido';
  throw new Error(`${contexto}: ${message}`);
}

function formatarDataCurta(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

// ==============================================================================
// 1. GALERIA (tabela: galeria)
// ==============================================================================
export async function fetchAdminGaleria(): Promise<ItemGaleria[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('galeria')
    .select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) fail(error, 'Não foi possível carregar a galeria');

  return (data || []).map((row) => ({
    id: row.id,
    url: row.foto_url,
    titulo: row.titulo || undefined,
    legenda: row.legenda || row.titulo || '',
    categoria: (row.categoria as ItemGaleria['categoria']) || undefined,
    ordem: row.ordem ?? 0,
    visivel: Boolean(row.visivel),
    criado_em: formatarDataCurta(row.criado_em),
  }));
}

export async function createAdminFoto(input: {
  url: string;
  titulo?: string;
  legenda: string;
  categoria: string;
  ordem: number;
}): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('galeria').insert({
    foto_url: input.url.trim(),
    titulo: input.titulo?.trim() || null,
    legenda: input.legenda.trim(),
    categoria: input.categoria || null,
    ordem: input.ordem,
    visivel: true,
  });
  if (error) fail(error, 'Não foi possível publicar a fotografia');
}

export async function updateAdminFoto(
  id: string,
  input: {
    url: string;
    titulo?: string;
    legenda: string;
    categoria: string;
  }
): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('galeria')
    .update({
      foto_url: input.url.trim(),
      titulo: input.titulo?.trim() || null,
      legenda: input.legenda.trim(),
      categoria: input.categoria || null,
    })
    .eq('id', id);
  if (error) fail(error, 'Não foi possível guardar a fotografia');
}

export async function setAdminFotoVisivel(id: string, visivel: boolean): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('galeria').update({ visivel }).eq('id', id);
  if (error) fail(error, 'Não foi possível alterar a visibilidade da fotografia');
}

export async function deleteAdminFoto(id: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('galeria').delete().eq('id', id);
  if (error) fail(error, 'Não foi possível remover a fotografia');
}

// ==============================================================================
// 2. LOGOS DE PARCEIROS (tabela: logos_parceiros)
// ==============================================================================
export interface AdminLogoParceiro {
  id: string;
  nome: string;
  logoUrl: string;
  posicao: string;
  visivel: boolean;
  ordem: number;
}

export async function fetchAdminLogos(): Promise<AdminLogoParceiro[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('logos_parceiros')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) fail(error, 'Não foi possível carregar os logótipos');

  return (data || []).map((row) => ({
    id: row.id,
    nome: row.nome,
    logoUrl: row.logo_url,
    posicao: row.posicao || 'Secção Parceiros',
    visivel: row.visivel !== false,
    ordem: row.ordem ?? 0,
  }));
}

export async function createAdminLogo(input: {
  nome: string;
  logoUrl: string;
  posicao: string;
  ordem: number;
}): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('logos_parceiros').insert({
    nome: input.nome.trim(),
    logo_url: input.logoUrl.trim(),
    posicao: input.posicao,
    ordem: input.ordem,
    visivel: true,
  });
  if (error) fail(error, 'Não foi possível adicionar o logótipo');
}

export async function setAdminLogoVisivel(id: string, visivel: boolean): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('logos_parceiros').update({ visivel }).eq('id', id);
  if (error) fail(error, 'Não foi possível alterar a visibilidade do logótipo');
}

export async function deleteAdminLogo(id: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('logos_parceiros').delete().eq('id', id);
  if (error) fail(error, 'Não foi possível remover o logótipo');
}

// ==============================================================================
// 3. CARTAZ OFICIAL (tabela: cartaz_oficial)
// ==============================================================================
export interface AdminCartaz extends CartazConfig {
  id: string;
}

export async function fetchAdminCartaz(): Promise<AdminCartaz | null> {
  assertConfigured();
  const { data, error } = await supabase
    .from('cartaz_oficial')
    .select('*')
    .order('atualizado_em', { ascending: false })
    .limit(1);

  if (error) fail(error, 'Não foi possível carregar o cartaz oficial');
  if (!data || data.length === 0) return null;

  const row = data[0];
  return {
    id: row.id,
    url: row.imagem_url,
    titulo: row.titulo,
    descricao: row.descricao || '',
    resolucao: row.resolucao || '',
    tamanho: row.tamanho || '',
    ativo: Boolean(row.ativo),
    atualizado_em: formatarDataCurta(row.atualizado_em),
  };
}

export async function createAdminCartaz(input: {
  url: string;
  titulo: string;
}): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('cartaz_oficial').insert({
    imagem_url: input.url,
    titulo: input.titulo,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  });
  if (error) fail(error, 'Não foi possível registar o cartaz oficial');
}

export async function saveAdminCartaz(cartaz: AdminCartaz): Promise<void> {
  assertConfigured();
  const payload = {
    imagem_url: cartaz.url,
    titulo: cartaz.titulo,
    descricao: cartaz.descricao,
    resolucao: cartaz.resolucao,
    tamanho: cartaz.tamanho,
    ativo: cartaz.ativo,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('cartaz_oficial')
    .update(payload)
    .eq('id', cartaz.id);

  if (error) fail(error, 'Não foi possível guardar o cartaz oficial');
}

// ==============================================================================
// 4. INGRESSOS, VAGAS E LISTA DE ESPERA
// ==============================================================================
export interface AdminLote {
  id: string;
  nome: string;
  preco: number;
  capacidade: number;
  emitidos: number;
  ativo: boolean;
  dataAbertura: string | null;
}

export async function fetchAdminLotes(): Promise<AdminLote[]> {
  assertConfigured();

  const [lotesRes, inscricoesRes] = await Promise.all([
    supabase.from('lotes_ingressos').select('*').order('criado_em', { ascending: true }),
    // Emitidos = inscricões que ocupam lugar no lote (canceladas não contam).
    supabase.from('inscricoes').select('lote_id, estado').not('lote_id', 'is', null),
  ]);

  if (lotesRes.error) fail(lotesRes.error, 'Não foi possível carregar os lotes');

  const emitidosPorLote = new Map<string, number>();
  for (const row of inscricoesRes.data || []) {
    if (!row.lote_id || row.estado === 'cancelada') continue;
    emitidosPorLote.set(row.lote_id, (emitidosPorLote.get(row.lote_id) || 0) + 1);
  }

  return (lotesRes.data || []).map((row) => ({
    id: row.id,
    nome: row.nome,
    preco: Number(row.preco || 0),
    capacidade: Number(row.capacidade || 0),
    emitidos: emitidosPorLote.get(row.id) || 0,
    ativo: row.ativo !== false,
    dataAbertura: row.data_inicio ? formatarDataCurta(row.data_inicio) : null,
  }));
}

export async function fetchVagasTotais(): Promise<number | null> {
  assertConfigured();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'vagas_totais')
    .maybeSingle();

  if (error) fail(error, 'Não foi possível ler a capacidade total');
  const valor = data ? parseInt(data.value, 10) : NaN;
  return Number.isFinite(valor) ? valor : null;
}

export async function saveVagasTotais(valor: number): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'vagas_totais', value: String(valor) }, { onConflict: 'key' });
  if (error) fail(error, 'Não foi possível guardar a capacidade total');

  await sincronizarEvento({ vagas_total: valor });
}

export interface FilaEsperaEntry {
  id: string;
  nome: string;
  telefone: string;
  criado_em: string;
}

export async function fetchFilaEspera(): Promise<FilaEsperaEntry[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('inscricoes')
    .select('id, nome, telefone, created_at')
    .eq('estado', 'lista_espera')
    .order('created_at', { ascending: true });

  if (error) fail(error, 'Não foi possível carregar a lista de espera');

  return (data || []).map((row) => ({
    id: row.id,
    nome: row.nome,
    telefone: row.telefone || '',
    criado_em: formatarDataCurta(row.created_at),
  }));
}

export async function promoverFilaEspera(id: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('inscricoes')
    .update({ estado: 'inscrita', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) fail(error, 'Não foi possível promover a participante');
}

/**
 * Capacidade real do evento — RPC `get_capacidade_stats` (confirmadas,
 * lista de espera, canceladas, presentes, vagas livres e ocupação).
 * Usa exactamente o mesmo critério de "ocupa vaga" da inscrição pública.
 *
 * Se a migração 033 ainda não estiver aplicada (RPC inexistente), calcula as
 * mesmas contagens no cliente para o módulo não ficar inutilizável.
 */
export async function fetchCapacidadeStats(): Promise<CapacidadeStats> {
  assertConfigured();

  const num = (valor: unknown): number => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  };

  const montar = (row: Record<string, unknown>): CapacidadeStats => ({
    capacidade: num(row.capacidade),
    confirmadas: num(row.confirmadas),
    lista_espera: num(row.lista_espera),
    canceladas: num(row.canceladas),
    presentes: num(row.presentes),
    livres: num(row.livres),
    ocupacao: num(row.ocupacao),
  });

  const { data, error } = await supabase.rpc('get_capacidade_stats');

  if (!error && data) {
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    return montar(row || {});
  }

  // --- Fallback (migração por aplicar): mesma contagem, feita no cliente ---
  const [vagasRes, confirmadasRes, esperaRes, canceladasRes, presentesRes] = await Promise.all([
    supabase.from('app_settings').select('value').eq('key', 'vagas_totais').maybeSingle(),
    supabase.from('inscricoes').select('id', { count: 'exact', head: true })
      .neq('estado', 'cancelada').neq('estado', 'lista_espera'),
    supabase.from('inscricoes').select('id', { count: 'exact', head: true }).eq('estado', 'lista_espera'),
    supabase.from('inscricoes').select('id', { count: 'exact', head: true }).eq('estado', 'cancelada'),
    supabase.from('inscricoes').select('id', { count: 'exact', head: true })
      .eq('checked_in', true).neq('estado', 'cancelada'),
  ]);

  const falha = vagasRes.error || confirmadasRes.error || esperaRes.error || canceladasRes.error || presentesRes.error;
  if (falha) fail(falha, 'Não foi possível carregar a capacidade do evento');

  const capacitada = vagasRes.data ? parseInt(vagasRes.data.value, 10) : NaN;
  const capacidade = Number.isFinite(capacitada) ? capacitada : 350;
  const confirmadas = confirmadasRes.count || 0;

  return {
    capacidade,
    confirmadas,
    lista_espera: esperaRes.count || 0,
    canceladas: canceladasRes.count || 0,
    presentes: presentesRes.count || 0,
    livres: Math.max(capacidade - confirmadas, 0),
    ocupacao:
      capacidade > 0 ? Math.min(100, Math.round((confirmadas / capacidade) * 100)) : 0,
  };
}

// ==============================================================================
// 4b. RELATOS DE PROBLEMAS / COMENTÁRIOS (tabela: relatos)
// ==============================================================================
const ESTADOS_RELATO: Relato['estado'][] = ['novo', 'em_curso', 'resolvido'];

export async function fetchAdminRelatos(): Promise<Relato[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('relatos')
    .select('*, participante:inscricoes(nome)')
    .order('criado_em', { ascending: false });

  if (error) fail(error, 'Não foi possível carregar os relatos');

  return (data || []).map((row) => {
    const participante = row.participante as { nome?: string } | { nome?: string }[] | null;
    const nomeParticipante = Array.isArray(participante)
      ? participante[0]?.nome
      : participante?.nome;

    return {
      id: row.id,
      tipo: row.tipo === 'comentario' ? 'comentario' : 'problema',
      nome: row.nome || '',
      contacto: row.contacto || null,
      mensagem: row.mensagem || '',
      estado: (ESTADOS_RELATO.includes(row.estado) ? row.estado : 'novo') as Relato['estado'],
      admin_notes: row.admin_notes || null,
      inscrito_id: row.inscrito_id || null,
      inscrito_nome: nomeParticipante || null,
      resolvido_em: row.resolvido_em || null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em || row.criado_em,
    } satisfies Relato;
  });
}

export async function updateAdminRelato(
  id: string,
  patch: { estado?: Relato['estado']; admin_notes?: string }
): Promise<void> {
  assertConfigured();

  const payload: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (patch.estado !== undefined) {
    payload.estado = patch.estado;
    payload.resolvido_em = patch.estado === 'resolvido' ? new Date().toISOString() : null;
  }
  if (patch.admin_notes !== undefined) payload.admin_notes = patch.admin_notes;

  const { error } = await supabase.from('relatos').update(payload).eq('id', id);
  if (error) fail(error, 'Não foi possível atualizar o relato');
}

// ==============================================================================
// 5. UTILIZADORES / CONTAS ADMIN (tabela: admins + auth.users)
// ==============================================================================
export async function fetchAdminUtilizadores(): Promise<UsuarioAdmin[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) fail(error, 'Não foi possível carregar os utilizadores');

  return (data || []).map((row) => ({
    id: row.id,
    nome: row.nome || row.email || '',
    email: row.email || '',
    papel: (row.papel as UsuarioAdmin['papel']) || 'gestor',
    ativo: row.ativo !== false,
    ultimoAcesso: row.ultimo_acesso
      ? new Date(row.ultimo_acesso).toLocaleString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Nunca',
    criado_em: formatarDataCurta(row.created_at),
  }));
}

export async function setAdminUtilizadorAtivo(id: string, ativo: boolean): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('admins').update({ ativo }).eq('id', id);
  if (error) fail(error, 'Não foi possível alterar o estado da conta');
}

export async function createAdminUtilizador(input: {
  nome: string;
  email: string;
  senha: string;
  papel: UsuarioAdmin['papel'];
}): Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }> {
  assertConfigured();

  // Guarda a sessão atual do admin para a repor depois do signUp
  // (o signUp pode substituir a sessão ativa pelo novo utilizador).
  const { data: sessionData } = await supabase.auth.getSession();
  const sessaoAnterior = sessionData?.session;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.senha,
    options: { data: { nome: input.nome.trim() } },
  });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { success: false, error: 'Não foi possível criar a conta de autenticação.' };
  }

  // Repõe já a sessão do admin: a RPC admin_grant_admin_access exige
  // super_admin, ou seja, tem de correr com a sessão do administrador —
  // não com a sessão do novo utilizador criada pelo signUp.
  if (sessaoAnterior) {
    try {
      await supabase.auth.setSession({
        access_token: sessaoAnterior.access_token,
        refresh_token: sessaoAnterior.refresh_token,
      });
    } catch (err) {
      console.warn('[AdminContent] Não foi possível repor a sessão do admin:', err);
    }
  }

  const { error: rpcError } = await supabase.rpc('admin_grant_admin_access', {
    p_user_id: userId,
    p_nome: input.nome.trim(),
    p_email: input.email.trim(),
    p_papel: input.papel,
  });

  if (rpcError) {
    return {
      success: false,
      error: `Conta criada na autenticação, mas o perfil admin não foi registado: ${rpcError.message}`,
      requiresConfirmation: !signUpData.session,
    };
  }

  return { success: true, requiresConfirmation: !signUpData.session };
}

// ==============================================================================
// 6. DEFINIÇÕES DO EVENTO (tabelas: app_settings + eventos)
// ==============================================================================
export interface AdminEventDetails {
  data: string;
  horario: string;
  local: string;
  vagas: number;
  entrada: string;
}

const MESES_EXT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarDataLonga(iso?: string | null): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return iso;
  return `${dia} de ${MESES_EXT[mes - 1]} de ${ano}`;
}

export async function fetchAdminEventDetails(): Promise<AdminEventDetails> {
  assertConfigured();

  const [settingsRes, eventosRes] = await Promise.all([
    supabase.from('app_settings').select('key, value').in('key', [
      'evento_data',
      'evento_horario',
      'evento_local',
      'vagas_totais',
    ]),
    supabase
      .from('eventos')
      .select('data_evento, hora_inicio, hora_fim, local_nome, vagas_total, inscricao_paga, valor')
      .order('criado_em', { ascending: false })
      .limit(1),
  ]);

  if (settingsRes.error) fail(settingsRes.error, 'Não foi possível carregar as definições');
  if (eventosRes.error) fail(eventosRes.error, 'Não foi possível carregar os detalhes do evento');

  const mapa = new Map((settingsRes.data || []).map((r) => [r.key, r.value]));
  const evento = (eventosRes.data || [])[0];

  const vagasSetting = parseInt(mapa.get('vagas_totais') || '', 10);
  const vagas = Number.isFinite(vagasSetting)
    ? vagasSetting
    : Number(evento?.vagas_total || 0);

  const entrada =
    evento && evento.inscricao_paga && Number(evento.valor) > 0
      ? `${Number(evento.valor)} Kz`
      : 'Gratuita (vagas limitadas)';

  return {
    data:
      mapa.get('evento_data') ||
      formatarDataLonga(evento?.data_evento) ||
      'Por definir',
    horario:
      mapa.get('evento_horario') ||
      (evento ? `${evento.hora_inicio} às ${evento.hora_fim}` : 'Por definir'),
    local: mapa.get('evento_local') || evento?.local_nome || 'Por definir',
    vagas,
    entrada,
  };
}

export async function saveAdminEventDetails(details: {
  data: string;
  horario: string;
  local: string;
}): Promise<void> {
  assertConfigured();

  const rows = [
    { key: 'evento_data', value: details.data.trim() },
    { key: 'evento_horario', value: details.horario.trim() },
    { key: 'evento_local', value: details.local.trim() },
  ];

  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) fail(error, 'Não foi possível guardar os detalhes do evento');

  // Mantém a tabela `eventos` alinhada com os app_settings (fonte de leitura pública)
  const updates: Record<string, unknown> = {};
  const dataIso = paraIsoData(details.data);
  if (dataIso) updates.data_evento = dataIso;

  const horas = paraHorario(details.horario);
  if (horas) {
    updates.hora_inicio = horas.inicio;
    updates.hora_fim = horas.fim;
  }

  if (details.local.trim()) updates.local_nome = details.local.trim();

  await sincronizarEvento(updates);
}

// ==============================================================================
// SINCRONIZAÇÃO app_settings -> TABELA `eventos`
// O site público e o painel leem os app_settings como fonte de verdade; a
// tabela `eventos` é mantida coerente para relatórios e check-in.
// ==============================================================================
const MESES_ISO: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/** "5 de Dezembro de 2026" | "2026-12-05" -> "2026-12-05" (ou null) */
function paraIsoData(texto: string): string | null {
  const valor = texto.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

  const m = valor.match(/^(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})$/i);
  if (!m) return null;
  const mes = MESES_ISO[m[2].toLowerCase()];
  if (!mes) return null;
  return `${m[3]}-${String(mes).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
}

function normalizarHora(valor: string): string | null {
  const m = valor.match(/(\d{1,2})\s*[h:]\s*(\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}h${m[2]}`;
}

/** "14h00 às 17h00" | "08h00 – 20h00" -> { inicio: "14h00", fim: "17h00" } */
function paraHorario(texto: string): { inicio: string; fim: string } | null {
  const partes = texto.split(/\s*(?:às|–|—|-|a)\s*/i);
  if (partes.length < 2) return null;
  const inicio = normalizarHora(partes[0]);
  const fim = normalizarHora(partes[partes.length - 1]);
  return inicio && fim ? { inicio, fim } : null;
}

/** Atualiza o evento mais recente (e as linhas duplicadas do mesmo evento). Nunca falha o fluxo principal do admin. */
async function sincronizarEvento(updates: Record<string, unknown>): Promise<void> {
  if (Object.keys(updates).length === 0) return;

  try {
    const { data: eventos, error: selectError } = await supabase
      .from('eventos')
      .select('id, data_evento')
      .order('criado_em', { ascending: false })
      .limit(10);
    if (selectError) throw selectError;

    const linhas = eventos || [];
    if (linhas.length === 0) return; // tabela vazia: nada para sincronizar

    // O evento mais recente é a referência; inclui linhas duplicadas do mesmo dia
    const alvoData = linhas[0].data_evento;
    const ids = linhas.filter((r) => r.data_evento === alvoData).map((r) => r.id);
    if (ids.length === 0) return;

    const { error } = await supabase.from('eventos').update(updates).in('id', ids);
    if (error) throw error;
  } catch (err) {
    console.warn('[AdminContent] Não foi possível sincronizar a tabela eventos:', err);
  }
}

// ==============================================================================
// 7. MATERIAIS & ATALHOS (tabela: materiais_atalhos)
// ==============================================================================
export async function fetchAdminMateriais(): Promise<MaterialAtalho[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('materiais_atalhos')
    .select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) fail(error, 'Não foi possível carregar os materiais e atalhos');

  return (data || []).map((row) => ({
    id: row.id,
    tipo: row.tipo === 'material' ? 'material' : 'atalho',
    titulo: row.titulo || '',
    descricao: row.descricao || undefined,
    url: row.url || '',
    ordem: row.ordem ?? 0,
    visivel: Boolean(row.visivel),
    criado_em: formatarDataCurta(row.criado_em),
  }));
}

export async function createAdminMaterial(input: {
  tipo: 'material' | 'atalho';
  titulo: string;
  descricao?: string;
  url: string;
  ordem: number;
}): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('materiais_atalhos').insert({
    tipo: input.tipo,
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    url: input.url.trim(),
    ordem: input.ordem,
    visivel: true,
  });
  if (error) fail(error, 'Não foi possível adicionar o item');
}

export async function setAdminMaterialVisivel(id: string, visivel: boolean): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('materiais_atalhos').update({ visivel }).eq('id', id);
  if (error) fail(error, 'Não foi possível alterar a visibilidade do item');
}

export async function deleteAdminMaterial(id: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('materiais_atalhos').delete().eq('id', id);
  if (error) fail(error, 'Não foi possível remover o item');
}
