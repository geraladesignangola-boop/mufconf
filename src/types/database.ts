export interface Inscricao {
  id: string
  codigo?: string | null
  nome: string
  email: string
  telefone: string
  whatsapp: string
  morada: string
  municipio_bairro?: string | null
  igreja?: string | null
  localizacao?: string | null
  recomendacao?: string | null
  observacoes?: string | null
  admin_notes?: string | null
  faixa_etaria: '18-25' | '26-35' | '36-45' | '46+'
  como_soube: 'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro'
  expectativa?: string | null
  referral_code: string
  meta_convidadas: number | null
  convidadas_count: number
  referred_by?: string | null
  group_added_at?: string | null
  group_added_by?: string | null
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  created_at: string
}

export interface ReferralLink {
  id: string
  participant_id: string
  token: string
  label: string
  source: 'legacy' | 'admin' | 'manual' | 'share'
  created_by_admin?: string | null
  created_at: string
  total_clicks?: number
  facebook_clicks?: number
  instagram_clicks?: number
  whatsapp_clicks?: number
  direct_clicks?: number
}

export interface Notification {
  id: string
  participant_id: string
  type: 'prize_achieved' | 'reminder'
  message: string
  whatsapp_link?: string
  email_link?: string
  read: boolean
  sent: boolean
  created_at: string
}

export interface Admin {
  id: string
  nome: string
  email: string
  role: 'admin' | 'super_admin'
  created_at: string
}

export interface Oradora {
  id: string
  nome: string
  cargo: string
  subtitulo?: string
  fotoUrl?: string
  isMain?: boolean
}

export interface ReferrerInfo {
  id: string
  nome: string
  meta_convidadas: number | null
  convidadas_count: number
  referral_code?: string
  referral_link_id?: string | null
  referral_link_token?: string | null
  referral_link_label?: string | null
  total_links?: number
  total_clicks?: number
  facebook_clicks?: number
  instagram_clicks?: number
  whatsapp_clicks?: number
  direct_clicks?: number
}

export interface DashboardStats {
  total_inscritos: number
  total_referrals: number
  total_prizes_achieved: number
  prizes_pending_delivery: number
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
  top_referrer_nome: string
  top_referrer_count: number
}

export interface RankingEntry {
  id: string
  nome: string
  email: string
  whatsapp: string
  convidadas_count: number
  meta_convidadas: number | null
  percentage: number
  prize_achieved: boolean
}

export interface AdminParticipantOverview extends Inscricao {
  referred_by_nome?: string | null
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
  latest_link_id?: string | null
  latest_link_token?: string | null
  latest_link_label?: string | null
  latest_link_created_at?: string | null
  prize_level?: string | null
  prize_achieved: boolean
  group_added_by_nome?: string | null
}

export interface ParticipantDetailSummary {
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
}

export interface ParticipantDetail {
  participant: Inscricao & {
    referred_by_nome?: string | null
    total_links?: number
    total_clicks?: number
    facebook_clicks?: number
    instagram_clicks?: number
    whatsapp_clicks?: number
    direct_clicks?: number
    group_added_by_nome?: string | null
  }
  links: ReferralLink[]
  notifications: Notification[]
  click_summary: ParticipantDetailSummary
}

export type PrizeName = 'camisa' | 'agenda' | 'pack_completo'

export const PRIZE_NAMES: Record<PrizeName, string> = {
  pack_completo: '1º lugar - Bíblia',
  agenda: '2º lugar - Agenda',
  camisa: '3º lugar - T-shirt',
}

export interface DailyRegistration {
  date: string
  day_of_week: string
  count: number
}

export interface DailyClick {
  date: string
  day_of_week: string
  total: number
  whatsapp: number
  facebook: number
  instagram: number
  direct: number
}

// Check-in system types
export interface CheckInParticipant {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
}

export interface CheckInStats {
  total_inscritos: number
  total_checked_in: number
  percentual: number
}

export interface CheckInReportEntry {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  created_at: string
}

export interface OfflineCheckIn {
  participant_id: string
  participant_nome: string
  staff_name: string
  timestamp: string
}

// ============================================
// Tipos para os Módulos Expandidos do Painel
// ============================================

export interface Parceiro {
  id: string
  nome: string
  categoria: 'Platina' | 'Ouro' | 'Prata' | 'Bronze' | 'Institucional'
  responsavel?: string
  contacto: string
  email?: string
  contribuicao?: string
  estado: 'Confirmado' | 'Em análise' | 'Pendente' | 'Recusado'
  logoUrl?: string
  ordem: number
  visivel: boolean
  criado_em: string
}

export interface ItemProgramacao {
  id: string
  horaInicio: string
  horaFim: string
  periodo: 'Manhã' | 'Tarde' | 'Noite'
  titulo: string
  descricao?: string
  oradoraNome?: string
  local?: string
  ordem: number
  visivel: boolean
}

export interface ItemGaleria {
  id: string
  url: string
  titulo?: string
  legenda: string
  categoria?: 'Edição 2025' | 'Bastidores' | 'Mentoria' | 'Comunidade' | 'Flyers'
  ordem: number
  visivel: boolean
  criado_em: string
}

export interface OradoraAdmin {
  id: string
  nome: string
  cargo: string
  subtitulo?: string
  biografia?: string
  fotoUrl: string
  isMain?: boolean
  ordem: number
  visivel: boolean
}

/** Item genérico de uma lista editável guardada em secoes_conteudo.conteudo_json. */
export interface SecaoItem {
  numero: string
  selo?: string
  titulo: string
  descricao: string
}

export interface SecaoConteudo {
  id: string
  chave: string
  titulo: string
  subtitulo: string
  descricao: string
  visivel: boolean
  ordem: number
  itens?: SecaoItem[]
  campos?: Record<string, string>
  listas?: Record<string, string[]>
  ultimaAtualizacao: string
}

export interface UsuarioAdmin {
  id: string
  nome: string
  email: string
  papel: 'desenvolvedor' | 'gestor' | 'checkin'
  ativo: boolean
  ultimoAcesso?: string
  criado_em: string
}

export interface LogAuditoria {
  id: string
  utilizador: string
  papel: string
  acao: string
  entidade: string
  detalhes?: string
  criado_em: string
}

export interface MaterialAtalho {
  id: string
  tipo: 'material' | 'atalho'
  titulo: string
  descricao?: string
  url: string
  ordem: number
  visivel: boolean
  criado_em: string
}

export interface CartazConfig {
  url: string
  titulo: string
  descricao: string
  resolucao: string
  tamanho: string
  ativo: boolean
  atualizado_em: string
}
