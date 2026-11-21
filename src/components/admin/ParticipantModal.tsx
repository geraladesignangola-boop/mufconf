import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Loader2,
  Check,
  Copy,
  Send,
  RefreshCcw,
  History,
  Bell,
  Building2,
  NotebookPen,
  MessageCircle,
  CheckCircle,
  Users,
  Link2,
  TrendingUp,
  Crown,
  Ticket,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import { AdminParticipantOverview, ParticipantDetail } from '../../types/database'
import { PODIUM_PRIZES } from './constants'
import { Button, Badge, fieldClasses } from './ui'
import Bilhete from '../Bilhete'
import { fetchPublicEventConfig, PublicEventConfig } from '../../services/publicDataService'
import { exportarBilhete } from '../../lib/exportBilhete'

interface ParticipantModalProps {
  participantDetail: ParticipantDetail | null
  isDetailLoading: boolean
  detailError: string
  copyMessage: string
  adminNotesDraft: string
  onAdminNotesChange: (v: string) => void
  isSavingNotes: boolean
  isGeneratingLink: boolean
  isSendingLink: boolean
  podiumPositionById: Map<string, number>
  onClose: () => void
  onSaveNotes: () => void
  onCopyLink: () => void
  onResendLink: () => void
  onGenerateLink: () => void
  onCopyToClipboard: (value: string, msg: string) => void
  getReferralLink: (token: string) => string
  onAddToGroup: () => void
  onResendBilhete?: () => void
  isSendingBilhete?: boolean
}

export default function ParticipantModal({
  participantDetail,
  isDetailLoading,
  detailError,
  copyMessage,
  adminNotesDraft,
  onAdminNotesChange,
  isSavingNotes,
  isGeneratingLink,
  isSendingLink,
  podiumPositionById,
  onClose,
  onSaveNotes,
  onCopyLink,
  onResendLink,
  onGenerateLink,
  onCopyToClipboard,
  getReferralLink,
  onAddToGroup,
  onResendBilhete,
  isSendingBilhete = false,
}: ParticipantModalProps) {
  const podiumPosition = participantDetail
    ? podiumPositionById.get(participantDetail.participant.id)
    : undefined

  const [eventConfig, setEventConfig] = useState<PublicEventConfig | null>(null)
  const [exportando, setExportando] = useState<'pdf' | 'png' | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const bilheteRef = useRef<HTMLDivElement>(null)

  const exportar = async (formato: 'pdf' | 'png') => {
    if (!bilheteRef.current || exportando) return
    setExportMenuOpen(false)
    setExportando(formato)
    try {
      const base = `bilhete-${p?.codigo || p?.referral_code || p?.id || 'inscricao'}`
      await exportarBilhete(bilheteRef.current, formato, base)
    } catch (err) {
      console.error('Erro ao exportar bilhete:', err)
    } finally {
      setExportando(null)
    }
  }

  useEffect(() => {
    let ativo = true
    fetchPublicEventConfig().then((config) => {
      if (ativo) setEventConfig(config)
    })
    return () => {
      ativo = false
    }
  }, [])

  const p = participantDetail?.participant

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${participantDetail?.participant.nome || 'participante'}`}
        className="w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl custom-scrollbar"
      >
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {participantDetail?.participant.nome || 'Participante'}
              </h3>
              {participantDetail?.click_summary && (
                <Badge tone="cyan">{participantDetail.click_summary.total_clicks} cliques</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 truncate">{participantDetail?.participant.email}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar diálogo"
            className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              A carregar detalhes...
            </div>
          ) : detailError ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {detailError}
            </div>
          ) : participantDetail ? (
            <>
              {copyMessage && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {copyMessage}
                </div>
              )}

              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard label="Convidadas" value={participantDetail.participant.convidadas_count} icon={<Users className="w-3.5 h-3.5" />} />
                <MetricCard label="Links" value={participantDetail.click_summary.total_links} icon={<Link2 className="w-3.5 h-3.5" />} />
                <MetricCard label="Cliques" value={participantDetail.click_summary.total_clicks} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <MetricCard
                  label="Pódio"
                  value={podiumPosition ? `${podiumPosition}º` : '--'}
                  icon={<Crown className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Bilhete de inscrição */}
              {p && (
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Ticket className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white">Bilhete de inscrição</h4>
                  </div>
                  <div ref={bilheteRef} className="max-w-[720px] mx-auto">
                    <Bilhete
                      nome={p.nome}
                      telefone={p.whatsapp || p.telefone}
                      email={p.email}
                      igreja={p.igreja}
                      municipio={p.municipio_bairro || p.localizacao || p.morada}
                      faixaEtaria={p.faixa_etaria}
                      numeroInscricao={p.codigo || p.referral_code}
                      qrValue={`MDF2026|${p.referral_code}|${p.nome}`}
                      evento={{
                        data: eventConfig?.eventoData || undefined,
                        horario: eventConfig?.eventoHorario || undefined,
                        local: eventConfig?.eventoLocal || undefined,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <div className="relative">
                      <Button
                        variant="secondary"
                        onClick={() => setExportMenuOpen((v) => !v)}
                        disabled={exportando !== null}
                        loading={exportando !== null}
                        icon={exportando ? undefined : <Download className="w-4 h-4" />}
                      >
                        {exportando ? 'A exportar…' : 'Baixar bilhete'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                      </Button>

                      <AnimatePresence>
                        {exportMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-44 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => exportar('pdf')}
                              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-amber-400" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => exportar('png')}
                              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800"
                            >
                              <ImageIcon className="w-4 h-4 text-amber-400" />
                              <span>PNG</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {onResendBilhete && (
                      <Button
                        variant="success"
                        onClick={onResendBilhete}
                        disabled={isSendingBilhete}
                        loading={isSendingBilhete}
                        icon={isSendingBilhete ? undefined : <Send className="w-4 h-4" />}
                      >
                        Reenviar bilhete
                      </Button>
                    )}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Cadastro */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white">Dados do cadastro</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <DetailItem label="Email" value={participantDetail.participant.email} />
                    <DetailItem label="Telefone" value={participantDetail.participant.telefone} />
                    <DetailItem label="WhatsApp" value={participantDetail.participant.whatsapp} />
                    <DetailItem label="Morada" value={participantDetail.participant.morada} />
                    <DetailItem label="Localização" value={participantDetail.participant.localizacao || '--'} />
                    <DetailItem label="Igreja" value={participantDetail.participant.igreja || '--'} />
                    <DetailItem label="Recomendação" value={participantDetail.participant.recomendacao || '--'} />
                    <DetailItem label="Faixa Etária" value={participantDetail.participant.faixa_etaria} />
                    <DetailItem label="Como soube" value={participantDetail.participant.como_soube} />
                    <DetailItem label="Expectativa" value={participantDetail.participant.expectativa || '--'} />
                    <DetailItem label="Observações" value={participantDetail.participant.observacoes || '--'} />
                    <DetailItem label="Referência" value={participantDetail.participant.referred_by_nome || '--'} />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-cyan-400" />
                      <h5 className="text-sm font-bold text-slate-100">Notas internas do admin</h5>
                    </div>
                    <textarea
                      value={adminNotesDraft}
                      onChange={(e) => onAdminNotesChange(e.target.value)}
                      rows={5}
                      aria-label="Notas internas do admin"
                      className={`${fieldClasses} resize-none`}
                      placeholder="Notas internas, follow-up, estado do contacto..."
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={onSaveNotes}
                        disabled={isSavingNotes}
                        loading={isSavingNotes}
                        icon={isSavingNotes ? undefined : <Check className="w-4 h-4" />}
                      >
                        Guardar notas
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Links e cliques */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <History className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-white">Links e cliques</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MetricCard label="WhatsApp" value={participantDetail.click_summary.whatsapp_clicks} compact />
                    <MetricCard label="Facebook" value={participantDetail.click_summary.facebook_clicks} compact />
                    <MetricCard label="Instagram" value={participantDetail.click_summary.instagram_clicks} compact />
                    <MetricCard label="Diretos" value={participantDetail.click_summary.direct_clicks} compact />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={onCopyLink} icon={<Copy className="w-4 h-4" />} className="w-full">
                      Copiar link
                    </Button>
                    <Button
                      variant="success"
                      onClick={onResendLink}
                      disabled={isSendingLink}
                      loading={isSendingLink}
                      icon={isSendingLink ? undefined : <Send className="w-4 h-4" />}
                      className="w-full"
                    >
                      Reenviar link
                    </Button>
                    <Button
                      onClick={onGenerateLink}
                      disabled={isGeneratingLink}
                      loading={isGeneratingLink}
                      icon={isGeneratingLink ? undefined : <RefreshCcw className="w-4 h-4" />}
                      className="w-full"
                    >
                      Gerar novo link
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={onAddToGroup}
                      disabled={!!participantDetail.participant.group_added_at}
                      icon={
                        participantDetail.participant.group_added_at ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )
                      }
                      className={`w-full ${
                        participantDetail.participant.group_added_at
                          ? 'opacity-60 cursor-not-allowed'
                          : '!text-emerald-400 !border-emerald-500/30 hover:!bg-emerald-500/10'
                      }`}
                    >
                      {participantDetail.participant.group_added_at
                        ? `Adicionado${participantDetail.participant.group_added_by_nome ? ` por ${participantDetail.participant.group_added_by_nome}` : ''}`
                        : 'Adicionar ao grupo'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-slate-100">Histórico de links</h5>
                    {participantDetail.links.length === 0 ? (
                      <p className="text-sm text-slate-500">Ainda não existem links extra.</p>
                    ) : (
                      <div className="space-y-2">
                        {participantDetail.links.map((link, index) => (
                          <div key={link.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-100">
                                  {link.label}
                                  {index === 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] uppercase tracking-wider">
                                      Atual
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 break-all">{getReferralLink(link.token)}</p>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onCopyToClipboard(getReferralLink(link.token), 'Link copiado do histórico.')}
                                icon={<Copy className="w-3.5 h-3.5" />}
                                className="flex-shrink-0"
                              >
                                Copiar
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] text-slate-400">
                              <StatPill label="Cliques" value={link.total_clicks || 0} />
                              <StatPill label="WhatsApp" value={link.whatsapp_clicks || 0} />
                              <StatPill label="Facebook" value={link.facebook_clicks || 0} />
                              <StatPill label="Instagram" value={link.instagram_clicks || 0} />
                              <StatPill label="Diretos" value={link.direct_clicks || 0} />
                            </div>

                            <div className="text-[11px] text-slate-600 flex flex-wrap gap-3">
                              <span>Fonte: {link.source}</span>
                              <span>Gerado: {new Date(link.created_at).toLocaleString('pt-PT')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Notificações */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Bell className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-white">Notificações da participante</h4>
                </div>

                {participantDetail.notifications.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem notificações registadas.</p>
                ) : (
                  <div className="space-y-3">
                    {participantDetail.notifications.map((notification) => (
                      <div key={notification.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-sm text-slate-100 whitespace-pre-wrap break-words">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {new Date(notification.created_at).toLocaleString('pt-PT')} · {notification.type}
                            </p>
                          </div>
                          <Badge tone={notification.sent ? 'success' : 'cyan'}>
                            {notification.sent ? 'Enviado' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

// --- Micro-componentes locais ---

function MetricCard({
  label,
  value,
  compact = false,
  icon,
}: {
  label: string
  value: number | string
  compact?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
        {icon && <span className="text-cyan-400/70">{icon}</span>}
      </div>
      <p className={`${compact ? 'text-base' : 'text-xl'} font-bold text-white mt-1`}>{value}</p>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className="text-sm font-bold text-slate-100">{value}</p>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
      <p className="text-sm font-medium text-slate-100 mt-1 break-words">{value}</p>
    </div>
  )
}

/** Reexporta para compatibilidade com o código que importava de AdminPanel. */
export { PODIUM_PRIZES }
export type { AdminParticipantOverview }
