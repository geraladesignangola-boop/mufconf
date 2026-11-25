import React, { useEffect, useMemo, useRef, useState } from 'react'
import ExcelJS from 'exceljs'
import { motion, AnimatePresence } from 'motion/react'
import {
  Download,
  LogOut,
  Bell,
  Eye,
  EyeOff,
  UserCheck,
  Zap,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getCurrentAdmin, signInAdmin, signOut } from '../lib/auth'
import { fetchAdminEventDetails } from '../services/adminContentService'
import { useReferral } from '../hooks/useReferral'
import {
  AdminParticipantOverview,
  DashboardStats,
  Notification,
  ParticipantDetail,
  PRIZE_NAMES,
  RankingEntry,
  ReferralLink,
} from '../types/database'
import AdminSidebar, { AdminTab, getTabLabel, getTabIcon } from '../components/admin/AdminSidebar'
import { PODIUM_PRIZES, ParticipantFilter } from '../components/admin/constants'
import AdminDashboard from '../components/admin/AdminDashboard'
import CheckInDashboard from '../components/admin/CheckInDashboard'
import PremiosPage from '../components/admin/PremiosPage'
import DefinicoesPage from '../components/admin/DefinicoesPage'
import IngressosVagasPage from '../components/admin/IngressosVagasPage'
import OradorasAdminPage from '../components/admin/OradorasAdminPage'
import ProgramacaoAdminPage from '../components/admin/ProgramacaoAdminPage'
import ParceirosAdminPage from '../components/admin/ParceirosAdminPage'
import LogosParceirosPage from '../components/admin/LogosParceirosPage'
import GaleriaAdminPage from '../components/admin/GaleriaAdminPage'
import CartazAdminPage from '../components/admin/CartazAdminPage'
import ConteudoAdminPage from '../components/admin/ConteudoAdminPage'
import BlocosSitePage from '../components/admin/BlocosSitePage'
import MateriaisAtalhosPage from '../components/admin/MateriaisAtalhosPage'
import RelatoriosPage from '../components/admin/RelatoriosPage'
import RelatosPage from '../components/admin/RelatosPage'
import UtilizadoresAdminPage from '../components/admin/UtilizadoresAdminPage'
import DadosSensiveisPage from '../components/admin/DadosSensiveisPage'
import BaseDeDadosPage from '../components/admin/BaseDeDadosPage'
import LogsAuditoriaPage from '../components/admin/LogsAuditoriaPage'
import RankingSection from '../components/admin/RankingSection'
import NotificationsSection from '../components/admin/NotificationsSection'
import NotificationsBell from '../components/admin/NotificationsBell'
import ParticipantsSection from '../components/admin/ParticipantsSection'
import ParticipantModal from '../components/admin/ParticipantModal'
import BulkSendModal from '../components/admin/BulkSendModal'
import { Button, fieldClasses, labelClasses } from '../components/admin/ui'
import { usePageMeta } from '../hooks/usePageMeta'

export default function AdminPanel() {
  usePageMeta({
    title: 'Painel de Administração — Mulheres de Fogo',
    description: 'Área restrita da comissão organizadora.',
    path: '/admin',
    noindex: true,
  })
  const { getReferralLink } = useReferral()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0)
  const [isBooting, setIsBooting] = useState(true)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [participants, setParticipants] = useState<AdminParticipantOverview[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [participantFilter, setParticipantFilter] = useState<ParticipantFilter>('all')

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [participantDetail, setParticipantDetail] = useState<ParticipantDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [isSendingBilhete, setIsSendingBilhete] = useState(false)
  const [adminNotesDraft, setAdminNotesDraft] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('')
  const [eventoDetalhes, setEventoDetalhes] = useState<{ data: string; local: string } | null>(null)
  // Evita que o upsert em debounce grave o valor por omissão antes de o valor
  // guardado em `app_settings` ter sido lido, ou que o leia por cima de uma
  // edição já feita pelo operador.
  const whatsappLinkReady = useRef(false)
  const whatsappLinkEdited = useRef(false)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set())
  const [showBulkSendModal, setShowBulkSendModal] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const admin = await getCurrentAdmin()
        if (admin) {
          setIsAuthenticated(true)
          setAdminEmail(admin.email || '')
          setIsSuperAdmin(admin.role === 'super_admin')
          await fetchData()
          const { data: setting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'whatsapp_group_link')
            .single()
          if (setting?.value && !whatsappLinkEdited.current) {
            setWhatsappGroupLink(setting.value)
          }
          const { data: inscricoesSetting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'inscricoes_abertas')
            .single()
          if (inscricoesSetting?.value) setInscricoesAbertas(inscricoesSetting.value !== 'false')
          whatsappLinkReady.current = true
          fetchAdminEventDetails()
            .then((d) => setEventoDetalhes({ data: d.data, local: d.local }))
            .catch(() => {})
        } else {
          await signOut()
        }
      } finally {
        setIsBooting(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    setAdminNotesDraft(participantDetail?.participant.admin_notes || '')
  }, [participantDetail])

  // NOX-012: debounce — evita um upsert a `app_settings` em cada tecla digitada.
  useEffect(() => {
    if (!isAuthenticated || !whatsappLinkReady.current) return
    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'whatsapp_group_link', value: whatsappGroupLink }, { onConflict: 'key' })
      if (error) {
        console.warn('[Admin] Falha ao guardar o link do grupo:', error.message)
        setDataError(`Não foi possível guardar o link do grupo de WhatsApp: ${error.message}`)
      } else {
        setDataError('')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [whatsappGroupLink, isAuthenticated])

  const handleToggleInscricoes = async () => {
    const newValue = !inscricoesAbertas
    const valorAnterior = inscricoesAbertas
    setInscricoesAbertas(newValue)
    setDataError('')
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'inscricoes_abertas', value: String(newValue) }, { onConflict: 'key' })
    if (error) {
      setInscricoesAbertas(valorAnterior)
      setDataError(`Não foi possível alterar o estado das inscrições: ${error.message}`)
    }
  }

  // Segurança extra: se a sessão restaurada não for super_admin, nunca fica
  // numa secção restrita (o separador já está oculto na navegação).
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && activeTab === 'utilizadores') {
      setActiveTab('dashboard')
    }
  }, [isAuthenticated, isSuperAdmin, activeTab])

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return participants.filter((participant) => {
      const matchesSearch = !term
        || [participant.nome, participant.email, participant.whatsapp, participant.igreja || '', participant.localizacao || '', participant.recomendacao || '']
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesFilter =
        participantFilter === 'all'
        || (participantFilter === 'podium' && participant.prize_achieved)
        || (participantFilter === 'linked' && participant.total_links > 1)
        || (participantFilter === 'no_links' && participant.total_links <= 1)
        || (participantFilter === 'group_added' && participant.group_added_at)
        || (participantFilter === 'group_pending' && !participant.group_added_at)

      return matchesSearch && matchesFilter
    })
  }, [participants, searchTerm, participantFilter])

  const podiumEntries = ranking.slice(0, 3)
  const podiumPositionById = new Map<string, number>(podiumEntries.map((entry, index) => [entry.id, index + 1]))

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastLoginAttempt < 5000) {
      setAuthError('Aguarde 5 segundos antes de tentar novamente.')
      return
    }
    setLastLoginAttempt(now)
    setIsLoading(true)
    setAuthError('')

    try {
      const { user, admin } = await signInAdmin(email, password)
      setAdminEmail(user?.email || email)
      setIsSuperAdmin(admin?.role === 'super_admin')
      setIsAuthenticated(true)
      await fetchData()
    } catch (err: any) {
      setAuthError(err.message || 'Credenciais invalidas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setAdminEmail('')
    setIsSuperAdmin(false)
    setStats(null)
    setRanking([])
    setNotifications([])
    setParticipants([])
    setSelectedParticipantId(null)
    setParticipantDetail(null)
    setAdminNotesDraft('')
    setDataError('')
    setDetailError('')
    setActiveTab('dashboard')
  }

  const handleNotifyAll = async () => {
    const confirmed = window.confirm(
      'Confirmas o envio de notificacoes para todas as participantes?'
    )
    if (!confirmed) return

    try {
      setDataError('')
      const { data: allParticipants } = await supabase
        .from('inscricoes')
        .select('id, nome, email, whatsapp')

      if (!allParticipants || allParticipants.length === 0) {
        setDataError('Nenhuma participante encontrada.')
        return
      }

      let sentCount = 0
      let falhas = 0
      for (const p of allParticipants) {
        const msg = `Olá ${p.nome}!\n\nLembrete: A Imersão WEX acontece ${eventoDetalhes?.data ? `no dia ${eventoDetalhes.data}` : 'em breve'}${eventoDetalhes?.local ? ` em ${eventoDetalhes.local}` : ''}. Não esqueças!\n\nMulheres de Fogo`
        const digits = (p.whatsapp || '').replace(/\D/g, '')

        const { error } = await supabase.from('notifications').insert({
          participant_id: p.id,
          type: 'reminder',
          message: msg,
          whatsapp_link: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null,
          email_link: `mailto:${p.email}?subject=Lembrete%20Imersao%20WEX`,
        })
        if (error) {
          falhas++
          console.error('Falha ao criar notificação:', p.id, error.message)
        } else {
          sentCount++
        }
      }

      if (falhas > 0) {
        alert(`${sentCount} notificações criadas; ${falhas} falharam.`)
        setDataError(`${falhas} notificações não puderam ser criadas.`)
      } else {
        alert(`${sentCount} notificações criadas com sucesso.`)
      }
      await fetchData()
    } catch (err) {
      console.error('Erro ao notificar todas:', err)
      setDataError('Nao foi possivel criar as notificacoes.')
    }
  }

  const handleAddToGroup = async (participant: AdminParticipantOverview) => {
    if (participant.group_added_at) {
      const adicionadoPor = participant.group_added_by_nome || 'outro admin'
      const data = new Date(participant.group_added_at).toLocaleDateString('pt-PT')
      alert(`Este participante já foi adicionado ao grupo por ${adicionadoPor} em ${data}.`)
      return
    }

    if (!whatsappGroupLink) {
      alert('Configura o link do grupo de WhatsApp em Definicoes primeiro.')
      return
    }
    const digits = (participant.whatsapp || '').replace(/\D/g, '')
    if (!digits) {
      alert('Este participante nao tem numero de WhatsApp registado.')
      return
    }
    const msg = `*Woman Experience 2026*\n\nOlá, *${participant.nome}*!\n\nA sua inscrição para a *Imersão WEX – Woman Experience 2026* foi confirmada com sucesso.\n\nEstamos muito felizes por tê-la connosco nesta experiência preparada para inspirar, conectar e transformar mulheres extraordinárias.\n\nAgora falta apenas um pequeno passo para que não perca este momento especial.\n\n*Reserve este momento para si*\n\nAo guardar o evento no seu calendário, receberá lembretes automáticos para que possa organizar-se com tranquilidade.\n\n*Faça parte da nossa comunidade oficial*\n${whatsappGroupLink}\n\nNo grupo vamos partilhar:\n- Bastidores da preparação\n- Informações importantes\n- Novidades exclusivas\n- Orientações para o dia do evento\n\n*${eventoDetalhes?.data || 'data a confirmar'}*${eventoDetalhes?.local ? `\n${eventoDetalhes.local}` : ''}\n\nEsperamos por si!\n\nCom carinho,\n*Equipa Woman Experience*`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('inscricoes')
        .update({
          group_added_at: new Date().toISOString(),
          group_added_by: user?.id
        })
        .eq('id', participant.id)

      if (error) throw new Error(error.message)

      setParticipants(prev =>
        prev.map(p => p.id === participant.id
          ? { ...p, group_added_at: new Date().toISOString(), group_added_by_nome: 'Você' }
          : p
        ))
    } catch (error) {
      console.error('Erro ao registrar adição ao grupo:', error)
      setDataError(
        `O WhatsApp foi aberto, mas não foi possível registar ${participant.nome} no grupo: ${(error as Error).message}`
      )
    }
  }

  const handleNotifySelected = () => {
    if (selectedParticipantIds.size === 0) {
      alert('Seleciona pelo menos uma participante na tabela.')
      return
    }
    if (!whatsappGroupLink) {
      alert('Configura o link do grupo de WhatsApp em Definicoes primeiro.')
      return
    }
    setShowBulkSendModal(true)
  }

  const handleSendToSingle = (participant: AdminParticipantOverview) => {
    const digits = (participant.whatsapp || '').replace(/\D/g, '')
    if (!digits) return
    const msg = `*Woman Experience 2026*\n\nOlá, *${participant.nome}*!\n\nA sua inscrição para a *Imersão WEX – Woman Experience 2026* foi confirmada com sucesso.\n\nEstamos muito felizes por tê-la connosco nesta experiência preparada para inspirar, conectar e transformar mulheres extraordinárias.\n\nAgora falta apenas um pequeno passo para que não perca este momento especial.\n\n*Reserve este momento para si*\n\nAo guardar o evento no seu calendário, receberá lembretes automáticos para que possa organizar-se com tranquilidade.\n\n*Faça parte da nossa comunidade oficial*\n${whatsappGroupLink}\n\nNo grupo vamos partilhar:\n- Bastidores da preparação\n- Informações importantes\n- Novidades exclusivas\n- Orientações para o dia do evento\n\n*${eventoDetalhes?.data || 'data a confirmar'}*${eventoDetalhes?.local ? `\n${eventoDetalhes.local}` : ''}\n\nEsperamos por si!\n\nCom carinho,\n*Equipa Woman Experience*`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const loadFallbackStats = async (): Promise<DashboardStats> => {
    const [
      { count: totalInscritos },
      { count: totalReferrals },
      { count: totalLinks },
      { data: linkCounters },
      { count: prizesAchieved },
      { count: prizesPending },
    ] = await Promise.all([
      supabase.from('inscricoes').select('*', { count: 'exact', head: true }).neq('estado', 'cancelada'),
      supabase.from('referrals').select('*', { count: 'exact', head: true }),
      supabase.from('referral_links').select('*', { count: 'exact', head: true }),
      supabase.from('referral_links').select('total_clicks, facebook_clicks, instagram_clicks, whatsapp_clicks, direct_clicks'),
      supabase.from('prize_claims').select('*', { count: 'exact', head: true }).neq('status', 'delivered'),
      supabase.from('prize_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const soma = (campo: string): number =>
      (linkCounters || []).reduce((acc, row) => acc + (Number((row as any)[campo]) || 0), 0)

    const facebook = soma('facebook_clicks')
    const instagram = soma('instagram_clicks')
    const whatsapp = soma('whatsapp_clicks')
    const direct = soma('direct_clicks')
    const somaCanais = facebook + instagram + whatsapp + direct
    const totalClicks = Math.max(soma('total_clicks'), somaCanais)

    const { data: topReferrer } = await supabase
      .from('inscricoes')
      .select('nome, convidadas_count')
      .neq('estado', 'cancelada')
      .order('convidadas_count', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return {
      total_inscritos: totalInscritos || 0,
      total_referrals: totalReferrals || 0,
      total_prizes_achieved: prizesAchieved || 0,
      prizes_pending_delivery: prizesPending || 0,
      total_links: totalLinks || 0,
      total_clicks: totalClicks,
      facebook_clicks: facebook,
      instagram_clicks: instagram,
      whatsapp_clicks: whatsapp,
      direct_clicks: direct + (totalClicks - somaCanais),
      top_referrer_nome: topReferrer?.nome || '',
      top_referrer_count: topReferrer?.convidadas_count || 0,
    }
  }

  const loadFallbackParticipants = async (): Promise<AdminParticipantOverview[]> => {
    const { data } = await supabase
      .from('inscricoes')
      .select('*')
      .order('created_at', { ascending: false })

    return (data || []).map((participant) => ({
      ...participant,
      referred_by_nome: null,
      total_links: 1,
      total_clicks: 0,
      facebook_clicks: 0,
      instagram_clicks: 0,
      whatsapp_clicks: 0,
      direct_clicks: 0,
      latest_link_id: null,
      latest_link_token: participant.referral_code,
      latest_link_label: 'Link principal',
      latest_link_created_at: participant.created_at,
      prize_level: null,
      prize_achieved: false,
      group_added_by_nome: null,
    }))
  }

  const fetchData = async () => {
    try {
      setDataError('')

      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats')
      // `get_dashboard_stats` devolve JSONB (objecto). Versões antigas devolviam
      // uma linha em array — por isso aceitamos as duas formas.
      const statsRow = Array.isArray(statsData) ? statsData[0] : statsData
      if (statsRow) {
        setStats(statsRow as DashboardStats)
      } else if (statsError) {
        setStats(await loadFallbackStats())
      }

      const { data: rankingData, error: rankingError } = await supabase.rpc('get_referral_ranking')
      if (rankingData) {
        setRanking(rankingData as RankingEntry[])
      } else if (rankingError) {
        const { data: fallbackRanking } = await supabase
          .from('inscricoes')
          .select('id, nome, email, whatsapp, convidadas_count, meta_convidadas')
          .gt('convidadas_count', 0)
          .order('convidadas_count', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50)

        setRanking((fallbackRanking || []).map((entry) => ({
          ...entry,
          percentage: entry.meta_convidadas && entry.meta_convidadas > 0
            ? Math.round((entry.convidadas_count / entry.meta_convidadas) * 1000) / 10
            : 0,
          prize_achieved: false,
        })) as RankingEntry[])
      }

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (notifData) {
        setNotifications(notifData as Notification[])
      }

      const { data: participantsData, error: participantsError } = await supabase.rpc('get_admin_participants_overview')
      if (participantsData) {
        setParticipants(participantsData as AdminParticipantOverview[])
      } else if (participantsError) {
        setParticipants(await loadFallbackParticipants())
      }
    } catch (error) {
      console.error(error)
      setDataError('Nao foi possivel carregar os dados do painel.')
    }
  }

  const openParticipant = async (participantId: string) => {
    setSelectedParticipantId(participantId)
    setParticipantDetail(null)
    setDetailError('')
    setCopyMessage('')
    setIsDetailLoading(true)

    try {
      const { data, error } = await supabase.rpc('get_admin_participant_detail', {
        target_id: participantId,
      })
      if (error) throw error
      const detail = data?.[0] as ParticipantDetail | undefined
      if (!detail) {
        throw new Error('not_found')
      }
      setParticipantDetail(detail)
    } catch (error) {
      console.error(error)
      const { data: participantRow } = await supabase
        .from('inscricoes')
        .select('*')
        .eq('id', participantId)
        .maybeSingle()

      if (participantRow) {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('participant_id', participantId)
          .order('created_at', { ascending: false })

        setParticipantDetail({
          participant: {
            ...participantRow,
            referred_by_nome: null,
            total_links: 1,
            total_clicks: 0,
            facebook_clicks: 0,
            instagram_clicks: 0,
            whatsapp_clicks: 0,
            direct_clicks: 0,
          },
          links: [],
          notifications: (notificationsData || []) as Notification[],
          click_summary: {
            total_links: 1,
            total_clicks: 0,
            facebook_clicks: 0,
            instagram_clicks: 0,
            whatsapp_clicks: 0,
            direct_clicks: 0,
          },
        })
        setDetailError('Migrations novas ainda nao aplicadas; a vista detalhada esta em modo basico.')
      } else {
        setDetailError('Nao foi possivel carregar este participante.')
      }
    } finally {
      setIsDetailLoading(false)
    }
  }

  const closeParticipantModal = () => {
    setSelectedParticipantId(null)
    setParticipantDetail(null)
    setDetailError('')
    setAdminNotesDraft('')
    setCopyMessage('')
    setIsDetailLoading(false)
  }

  const markAsSent = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_sent', { notification_id: notificationId })
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Erro ao marcar notificacao:', err)
      setDataError('Nao foi possivel marcar a notificacao como enviada.')
    }
  }

  const handleFinalizePodium = async () => {
    const shouldFinalize = window.confirm(
      'Confirmas a apuracao final do podio? Isto vai substituir os premios anteriores.'
    )

    if (!shouldFinalize) return

    try {
      setIsFinalizing(true)
      setDataError('')
      const { error } = await supabase.rpc('assign_podium_prizes')
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Erro ao apurar o podio:', err)
      setDataError('Nao foi possivel fechar o podio agora.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const saveAdminNotes = async () => {
    if (!selectedParticipantId) return

    try {
      setIsSavingNotes(true)
      setDetailError('')
      const { error } = await supabase
        .from('inscricoes')
        .update({ admin_notes: adminNotesDraft })
        .eq('id', selectedParticipantId)

      if (error) throw error
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Notas guardadas com sucesso.')
    } catch (error) {
      console.error(error)
      setDetailError('Nao foi possivel guardar as notas.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(successMessage)
      setTimeout(() => setCopyMessage(''), 2000)
    } catch {
      setDetailError('Nao foi possivel copiar o link agora.')
    }
  }

  const handleCopyLatestLink = async () => {
    const latestLink = participantDetail?.links?.[0]
    if (!latestLink) return
    await copyToClipboard(getReferralLink(latestLink.token), 'Link copiado.')
  }

  const handleResendLatestLink = async () => {
    if (!selectedParticipantId || !participantDetail) return
    const latestLink = participantDetail.links?.[0]
    const referralLink = latestLink?.token || participantDetail.participant.referral_code

    try {
      setIsSendingLink(true)
      setDetailError('')
      const { error } = await supabase.rpc('admin_send_referral_link', {
        p_participant_id: selectedParticipantId,
        p_referral_link_id: latestLink?.id || null,
        p_link_url: getReferralLink(referralLink, 'whatsapp'),
      })
      if (error) throw error
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Link reenviado com sucesso.')
    } catch (error) {
      console.error(error)
      setDetailError('Nao foi possivel reenviar o link.')
    } finally {
      setIsSendingLink(false)
    }
  }

  const handleResendBilhete = async () => {
    if (!selectedParticipantId || !participantDetail) return
    const p = participantDetail.participant

    try {
      setIsSendingBilhete(true)
      setDetailError('')

      const msg = `Olá, *${p.nome}*!\n\nAqui está o teu bilhete para a *Imersão WEX – Woman Experience 2026*.\n\n*Nº de inscrição:* ${p.codigo || p.referral_code}\n${eventoDetalhes?.data ? `*Data:* ${eventoDetalhes.data}\n` : ''}${eventoDetalhes?.local ? `*Local:* ${eventoDetalhes.local}\n` : ''}\nApresenta o QR Code do teu bilhete no credenciamento.\n\nCom carinho,\n*Equipa Woman Experience*`
      const digits = (p.whatsapp || p.telefone || '').replace(/\D/g, '')

      const { error } = await supabase.from('notifications').insert({
        participant_id: p.id,
        type: 'reminder',
        message: msg,
        whatsapp_link: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null,
        email_link: `mailto:${p.email}?subject=O%20teu%20bilhete%20-%20Imers%C3%A3o%20WEX`,
      })
      if (error) throw error

      await fetchData()
      setCopyMessage('Bilhete reenviado — notificação criada para a participante.')
    } catch (error) {
      console.error(error)
      setDetailError('Nao foi possivel reenviar o bilhete.')
    } finally {
      setIsSendingBilhete(false)
    }
  }

  const handleGenerateAndSendLink = async () => {
    if (!selectedParticipantId) return

    try {
      setIsGeneratingLink(true)
      setDetailError('')
      const { data, error } = await supabase.rpc('admin_generate_referral_link', {
        p_participant_id: selectedParticipantId,
        p_label: 'Link reemitido',
      })
      if (error) throw error

      const newLink = data?.[0] as ReferralLink | undefined
      if (!newLink) {
        throw new Error('link_not_created')
      }

      const { error: sendError } = await supabase.rpc('admin_send_referral_link', {
        p_participant_id: selectedParticipantId,
        p_referral_link_id: newLink.id,
        p_link_url: getReferralLink(newLink.token, 'whatsapp'),
      })
      if (sendError) throw new Error(sendError.message)
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Novo link gerado e enviado.')
    } catch (error) {
      console.error(error)
      setDetailError('Nao foi possivel gerar o novo link.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleExportCSV = async () => {
    if (participants.length === 0) return

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Inscricoes WEX')

    sheet.mergeCells('A1:R1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'Inscrições WEX — Painel de Participantes'
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 35

    const headers = [
      'Nome', 'Email', 'Telefone', 'WhatsApp', 'Morada', 'Localização',
      'Igreja', 'Recomendação', 'Observações', 'Faixa Etária', 'Como Soube',
      'Convidadas', 'Links', 'Cliques', 'Último Link', 'Pódio', 'Prémio', 'Data Inscrição'
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22D3EE' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    headerRow.height = 28

    participants.forEach((p) => {
      const podium = podiumPositionById.get(p.id)
      const prizeKey = typeof podium === 'number' ? PODIUM_PRIZES[podium - 1] : null

      const row = sheet.addRow([
        p.nome, p.email, p.telefone, p.whatsapp, p.morada,
        p.localizacao || '', p.igreja || '', p.recomendacao || '',
        p.observacoes || '', p.faixa_etaria, p.como_soube,
        p.convidadas_count, p.total_links, p.total_clicks,
        p.latest_link_token || '',
        podium ? `${podium}º lugar` : '--',
        prizeKey ? PRIZE_NAMES[prizeKey] : 'Aguardando apuração',
        new Date(p.created_at).toLocaleString('pt-PT')
      ])

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        }
        cell.alignment = { horizontal: [12, 13, 14].includes(colNumber) ? 'right' : 'left' }
      })
    })

    sheet.columns.forEach((col) => { col.width = 20 })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Inscricoes_WEX_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // --- Estados de arranque ---

  if (isBooting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Zap className="w-6 h-6 text-slate-950 animate-pulse" strokeWidth={2.5} />
          </div>
          <p className="text-sm">A validar sessão administrativa...</p>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
            <ShieldCheck className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configuração em falta</h1>
          <p className="text-slate-500 text-sm mb-6">
            As variáveis de ambiente do Supabase não estão configuradas no Vercel.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm hover:bg-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à página principal
          </a>
        </div>
      </div>
    )
  }

  // --- Ecrã de autenticação ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambiente de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          className="w-full max-w-md bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/25">
              <Zap className="w-8 h-8 text-slate-950" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
            <p className="mt-1.5 text-slate-500 text-sm">Imersão WEX · Mulheres de Fogo</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className={labelClasses}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClasses}
                placeholder="admin@wex.ao"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className={labelClasses}>
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClasses} pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-500 hover:text-cyan-400 transition-colors"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            <Button type="submit" loading={isLoading} className="w-full !py-3 !text-sm uppercase tracking-wider">
              {isLoading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-600">
            Acesso restrito à equipa de organização
          </p>
        </motion.div>
      </div>
    )
  }

  // --- Painel autenticado ---

  const ActiveIcon = getTabIcon(activeTab)
  const activeLabel = getTabLabel(activeTab)

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        hiddenTabs={isSuperAdmin ? [] : ['utilizadores']}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:ml-0">
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pl-10 md:pl-0">
            <span className="hidden sm:flex p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                <span className="hidden sm:inline">Painel</span>
                <span className="hidden sm:inline text-slate-700">/</span>
                <span className="truncate text-slate-500">{activeLabel}</span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-white truncate leading-tight">{activeLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {activeTab === 'dashboard' && (
              <Button size="sm" onClick={handleNotifyAll} icon={<Bell className="w-3.5 h-3.5" />}>
                <span className="hidden sm:inline">Notificar todas</span>
                <span className="sm:hidden">Notificar</span>
              </Button>
            )}
            {activeTab === 'checkin' && (
              <Button
                size="sm"
                onClick={() => window.open('/checkin', '_blank', 'noopener,noreferrer')}
                icon={<UserCheck className="w-3.5 h-3.5" />}
              >
                <span className="hidden sm:inline">Abrir Check-in</span>
                <span className="sm:hidden">Abrir</span>
              </Button>
            )}
            {(activeTab === 'participants' || activeTab === 'relatorios') && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExportCSV}
                disabled={participants.length === 0}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                <span className="hidden sm:inline">Exportar .xlsx</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            )}

            {/* Sino de notificações em tempo real (inscrições) */}
            <NotificationsBell onNavigate={() => setActiveTab('participants')} />

            {/* Chip do utilizador autenticado */}
            <div className="hidden lg:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-950 border border-slate-800 ml-1">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-black text-slate-950 flex-shrink-0">
                {(adminEmail || 'A').charAt(0).toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-400 max-w-[140px] truncate">{adminEmail || 'Administrador'}</span>
            </div>

            <Button size="sm" variant="ghost" onClick={handleSignOut} icon={<LogOut className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {dataError && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {dataError}
            </div>
          )}

          {activeTab === 'dashboard' && <AdminDashboard stats={stats} ranking={ranking} />}

          {activeTab === 'participants' && (
            <ParticipantsSection
              participants={filteredParticipants}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              participantFilter={participantFilter}
              onFilterChange={setParticipantFilter}
              podiumPositionById={podiumPositionById}
              onSelectParticipant={openParticipant}
              selectedIds={selectedParticipantIds}
              onToggleSelect={(id) => {
                setSelectedParticipantIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }}
              onSelectAll={() => {
                if (selectedParticipantIds.size === filteredParticipants.length) {
                  setSelectedParticipantIds(new Set())
                } else {
                  setSelectedParticipantIds(new Set(filteredParticipants.map((p) => p.id)))
                }
              }}
              onNotifySelected={handleNotifySelected}
              onAddToGroup={handleAddToGroup}
            />
          )}

          {activeTab === 'ingressos' && <IngressosVagasPage stats={stats} />}

          {activeTab === 'checkin' && <CheckInDashboard />}

          {activeTab === 'ranking' && (
            <RankingSection
              ranking={ranking}
              isFinalizing={isFinalizing}
              onFinalize={handleFinalizePodium}
              podiumEntries={podiumEntries}
            />
          )}

          {activeTab === 'prizes' && <PremiosPage ranking={ranking} />}
          {activeTab === 'oradoras' && <OradorasAdminPage />}
          {activeTab === 'programacao' && <ProgramacaoAdminPage />}
          {activeTab === 'parceiros' && <ParceirosAdminPage />}
          {activeTab === 'logos_parceiros' && <LogosParceirosPage />}
          {activeTab === 'galeria' && <GaleriaAdminPage />}
          {activeTab === 'cartaz' && <CartazAdminPage />}
          {activeTab === 'conteudo' && <ConteudoAdminPage />}
          {activeTab === 'listas' && <BlocosSitePage />}
          {activeTab === 'materiais' && <MateriaisAtalhosPage />}

          {activeTab === 'notifications' && (
            <NotificationsSection notifications={notifications} onMarkAsSent={markAsSent} />
          )}

          {activeTab === 'relatos' && <RelatosPage />}

          {activeTab === 'relatorios' && (
            <RelatoriosPage stats={stats} participants={participants} onExportExcel={handleExportCSV} />
          )}

          {activeTab === 'settings' && (
            <DefinicoesPage
              stats={stats}
              whatsappGroupLink={whatsappGroupLink}
              onWhatsappGroupLinkChange={(valor) => {
                whatsappLinkEdited.current = true
                setWhatsappGroupLink(valor)
              }}
              inscricoesAbertas={inscricoesAbertas}
              onToggleInscricoes={handleToggleInscricoes}
            />
          )}

          {activeTab === 'utilizadores' && <UtilizadoresAdminPage />}
          {activeTab === 'dados_sensiveis' && (
            <DadosSensiveisPage
              participants={participants}
              onAnonimizado={(id, dados) =>
                setParticipants((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, ...dados } : p))
                )
              }
            />
          )}
          {activeTab === 'database' && <BaseDeDadosPage />}
          {activeTab === 'logs' && <LogsAuditoriaPage />}
        </main>
      </div>

      <AnimatePresence>
        {selectedParticipantId && (
          <ParticipantModal
            participantDetail={participantDetail}
            isDetailLoading={isDetailLoading}
            detailError={detailError}
            copyMessage={copyMessage}
            adminNotesDraft={adminNotesDraft}
            onAdminNotesChange={setAdminNotesDraft}
            isSavingNotes={isSavingNotes}
            isGeneratingLink={isGeneratingLink}
            isSendingLink={isSendingLink}
            podiumPositionById={podiumPositionById}
            onClose={closeParticipantModal}
            onSaveNotes={saveAdminNotes}
            onCopyLink={handleCopyLatestLink}
            onResendLink={handleResendLatestLink}
            onGenerateLink={handleGenerateAndSendLink}
            onCopyToClipboard={copyToClipboard}
            getReferralLink={getReferralLink}
            onAddToGroup={() => {
              if (participantDetail?.participant) handleAddToGroup(participantDetail.participant as AdminParticipantOverview)
            }}
            onResendBilhete={handleResendBilhete}
            isSendingBilhete={isSendingBilhete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkSendModal && (
          <BulkSendModal
            participants={participants.filter((p) => selectedParticipantIds.has(p.id))}
            whatsappGroupLink={whatsappGroupLink}
            onSend={handleSendToSingle}
            onClose={() => {
              setShowBulkSendModal(false)
              setSelectedParticipantIds(new Set())
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
