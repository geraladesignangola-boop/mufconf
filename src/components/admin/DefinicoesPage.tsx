import React, { useEffect, useState } from 'react'
import {
  Settings,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Users,
  Link2,
  Bell,
  Shield,
  ExternalLink,
  MessageCircle,
  Lock,
  LockOpen,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react'
import { DashboardStats } from '../../types/database'
import {
  AdminEventDetails,
  fetchAdminEventDetails,
  saveAdminEventDetails,
} from '../../services/adminContentService'
import { PageHeader, Card, StatCard, Button, fieldClasses, labelClasses } from './ui'

interface DefinicoesPageProps {
  stats: DashboardStats | null
  whatsappGroupLink: string
  onWhatsappGroupLinkChange: (value: string) => void
  inscricoesAbertas: boolean
  onToggleInscricoes: () => void
}

export default function DefinicoesPage({ stats, whatsappGroupLink, onWhatsappGroupLinkChange, inscricoesAbertas, onToggleInscricoes }: DefinicoesPageProps) {
  const [details, setDetails] = useState<AdminEventDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ data: '', horario: '', local: '' })

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setDetails(await fetchAdminEventDetails())
    } catch (err) {
      setErro((err as Error).message)
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirEdicao = () => {
    if (!details) return
    setDraft({ data: details.data, horario: details.horario, local: details.local })
    setEditando(true)
  }

  const handleGuardarDetalhes = async () => {
    if (!draft.data.trim() || !draft.horario.trim() || !draft.local.trim()) {
      alert('Data, horário e local são obrigatórios.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      await saveAdminEventDetails(draft)
      setDetails((prev) => (prev ? { ...prev, ...draft } : prev))
      setEditando(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Settings className="w-5 h-5" />}
        title="Definicoes da Campanha"
        description="Informacoes gerais e configuracoes da campanha de inscricao."
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {/* Faixa de KPIs */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Metricas da campanha
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total inscritas"
            value={String(stats?.total_inscritos || 0)}
            icon={<Users className="w-4 h-4" />}
            tone="accent"
          />
          <StatCard
            label="Links gerados"
            value={String(stats?.total_links || 0)}
            icon={<Link2 className="w-4 h-4" />}
          />
          <StatCard
            label="Total referrals"
            value={String(stats?.total_referrals || 0)}
            icon={<Bell className="w-4 h-4" />}
          />
          <StatCard
            label="Premios atribuidos"
            value={String(stats?.total_prizes_achieved || 0)}
            icon={<Shield className="w-4 h-4" />}
            tone="success"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Controlo de Inscrições */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            {inscricoesAbertas ? (
              <LockOpen className="w-4 h-4 text-emerald-500" />
            ) : (
              <Lock className="w-4 h-4 text-red-500" />
            )}
            <h3 className="text-sm font-bold text-slate-100">Controlo de Inscrições</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400">
              Quando fechadas, ninguém consegue inscrever-se no site. O formulário fica desabilitado com a mensagem "Inscrições Encerradas".
            </p>
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${inscricoesAbertas ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-200 font-medium">
                  {inscricoesAbertas ? 'Inscrições Abertas' : 'Inscrições Fechadas'}
                </span>
              </div>
              <button
                onClick={onToggleInscricoes}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  inscricoesAbertas ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    inscricoesAbertas ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Detalhes do evento */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Detalhes do evento</h3>
            </span>
            {!loading && details && !editando && (
              <Button variant="secondary" size="sm" onClick={abrirEdicao}>
                Editar
              </Button>
            )}
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                A carregar do Supabase…
              </p>
            ) : editando ? (
              <>
                <div>
                  <label className={labelClasses}>Data</label>
                  <input
                    type="text"
                    value={draft.data}
                    onChange={(e) => setDraft({ ...draft, data: e.target.value })}
                    placeholder="Ex: 5 de Dezembro de 2026"
                    className={fieldClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Horário</label>
                  <input
                    type="text"
                    value={draft.horario}
                    onChange={(e) => setDraft({ ...draft, horario: e.target.value })}
                    placeholder="Ex: 08h00 às 20h00"
                    className={fieldClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Local</label>
                  <input
                    type="text"
                    value={draft.local}
                    onChange={(e) => setDraft({ ...draft, local: e.target.value })}
                    placeholder="Ex: Centro de Convenções Talatona, Luanda"
                    className={fieldClasses}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditando(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleGuardarDetalhes} loading={saving}>
                    {saving ? 'A guardar…' : 'Guardar'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Data"
                  value={details?.data || 'Por definir'}
                />
                <InfoRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Horario"
                  value={details?.horario || 'Por definir'}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Local"
                  value={details?.local || 'Por definir'}
                />
                <InfoRow
                  icon={<Ticket className="w-4 h-4" />}
                  label="Entrada"
                  value={details?.entrada || 'Por definir'}
                />
                <InfoRow
                  icon={<Users className="w-4 h-4" />}
                  label="Vagas"
                  value={details?.vagas ? String(details.vagas) : 'Por definir'}
                />
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Links de partilha */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Links de partilha</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400">
              Partilha estes links para promover a campanha de inscricao.
            </p>
            <div className="space-y-2">
              <LinkRow
                label="Pagina principal"
                url={typeof window !== 'undefined' ? window.location.origin : ''}
              />
              <LinkRow
                label="Pagina de convite"
                url={typeof window !== 'undefined' ? `${window.location.origin}/convite` : ''}
              />
              <LinkRow
                label="Painel administrativo"
                url={typeof window !== 'undefined' ? `${window.location.origin}/admin` : ''}
              />
            </div>
          </div>
        </Card>

        {/* Canais de comunicacao + grupo oficial */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Canais de comunicacao</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">WhatsApp</p>
                <p className="text-sm text-slate-200">+244 932 583 167</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Email</p>
                <p className="text-sm text-slate-200">geral@womanexperience.ao</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Instagram</p>
                <p className="text-sm text-slate-200">@muf.mulheresdefogo</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Facebook</p>
                <p className="text-sm text-slate-200">Mulheres de Fogo AO</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-100">Grupo de WhatsApp</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Insere o link de convite do grupo. Este link sera enviado quando clicares em "Adicionar" na tabela de participantes.
              </p>
              <input
                type="url"
                value={whatsappGroupLink}
                onChange={(e) => onWhatsappGroupLinkChange(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                aria-label="Link do grupo de WhatsApp"
                className={fieldClasses}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-cyan-400/70 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  // NOX-010: feedback visível em vez de falha silenciosa na cópia.
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    window.setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
      <span className="text-[11px] text-slate-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-300 flex-1 truncate font-mono">{url}</span>
      <button
        onClick={copyToClipboard}
        aria-live="polite"
        title={
          status === 'error'
            ? 'Não foi possível copiar — tenta selecionar manualmente'
            : status === 'copied'
              ? 'Copiado!'
              : 'Copiar link'
        }
        className={`text-xs font-bold flex items-center gap-1 cursor-pointer flex-shrink-0 transition-colors ${
          status === 'copied'
            ? 'text-emerald-400'
            : status === 'error'
              ? 'text-red-400'
              : 'text-cyan-400 hover:text-cyan-300'
        }`}
      >
        {status === 'copied' ? (
          <>
            <Check className="w-3 h-3" />
            Copiado
          </>
        ) : status === 'error' ? (
          <>
            <X className="w-3 h-3" />
            Erro
          </>
        ) : (
          <>
            <ExternalLink className="w-3 h-3" />
            Copiar
          </>
        )}
      </button>
    </div>
  )
}
