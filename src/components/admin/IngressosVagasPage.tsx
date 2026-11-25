import React, { useEffect, useState } from 'react'
import {
  Ticket,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Percent,
  Loader2,
  X,
} from 'lucide-react'
import { DashboardStats, CapacidadeStats } from '../../types/database'
import {
  AdminLote,
  FilaEsperaEntry,
  fetchAdminLotes,
  saveVagasTotais,
  fetchFilaEspera,
  promoverFilaEspera,
  fetchCapacidadeStats,
} from '../../services/adminContentService'
import { PageHeader, Card, StatCard, Badge, Button, EmptyState, fieldClasses, labelClasses } from './ui'

interface IngressosVagasProps {
  stats: DashboardStats | null
}

export default function IngressosVagasPage({ stats }: IngressosVagasProps) {
  const [capacidade, setCapacidade] = useState<CapacidadeStats | null>(null)
  const [isEditingCapacidade, setIsEditingCapacidade] = useState(false)
  const [novaCapacidade, setNovaCapacidade] = useState('0')
  const [savingCapacidade, setSavingCapacidade] = useState(false)

  const [lotes, setLotes] = useState<AdminLote[]>([])
  const [filaEspera, setFilaEspera] = useState<FilaEsperaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Fonte única: RPC `get_capacidade_stats` — mesmo critério de "ocupa vaga"
  // usado na inscrição pública (exclui canceladas e lista de espera).
  const capacidadeTotal = capacidade?.capacidade ?? 0
  const totalInscritos = capacidade?.confirmadas ?? 0
  const vagasRestantes = capacidade?.livres ?? 0
  const taxaOcupacao = capacidade?.ocupacao ?? 0
  const listaEsperaCount = capacidade?.lista_espera ?? 0
  const canceladasCount = capacidade?.canceladas ?? 0

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      const [lotesData, capacidadeData, esperaData] = await Promise.all([
        fetchAdminLotes(),
        fetchCapacidadeStats(),
        fetchFilaEspera(),
      ])
      setLotes(lotesData)
      setCapacidade(capacidadeData)
      setFilaEspera(esperaData)
    } catch (err) {
      setErro((err as Error).message)
      setLotes([])
      setFilaEspera([])
      setCapacidade(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleSalvarCapacidade = async () => {
    const val = parseInt(novaCapacidade, 10)
    if (isNaN(val) || val <= 0) {
      alert('Indica uma capacidade maior que zero.')
      return
    }

    setSavingCapacidade(true)
    setErro('')
    try {
      await saveVagasTotais(val)
      setIsEditingCapacidade(false)
      // Recarrega tudo: a capacidade muda a ocupação, as vagas livres e o alerta.
      await carregar()
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSavingCapacidade(false)
    }
  }

  const handlePromoverEspera = async (id: string, nome: string) => {
    if (!window.confirm(`Confirmas a promoção de ${nome} da lista de espera para inscrita confirmada?`)) {
      return
    }
    setErro('')
    try {
      await promoverFilaEspera(id)
      setFilaEspera((prev) => prev.filter((item) => item.id !== id))
      // A promoção ocupa uma vaga — as contagens têm de ser atualizadas.
      const [capacidadeData, esperaData] = await Promise.all([
        fetchCapacidadeStats(),
        fetchFilaEspera(),
      ])
      setCapacidade(capacidadeData)
      setFilaEspera(esperaData)
      alert(`${nome} promovida com sucesso!`)
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  const statusLote = (lote: AdminLote): 'Ativo' | 'Esgotado' | 'Inativo' => {
    if (!lote.ativo) return 'Inativo'
    if (lote.capacidade > 0 && lote.emitidos >= lote.capacidade) return 'Esgotado'
    return 'Ativo'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={<Ticket className="w-5 h-5" />}
        title="Ingressos, Lotes e Controlo de Vagas"
        description="Gestão da capacidade do evento, distribuição de lotes e lista de espera."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setNovaCapacidade(String(capacidadeTotal))
              setIsEditingCapacidade(true)
            }}
          >
            Ajustar Capacidade Global
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {loading && (
        <Card className="p-5">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            A carregar lotes, vagas e lista de espera a partir do Supabase…
          </p>
        </Card>
      )}

      {/* Faixa de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Capacidade do Evento"
          value={capacidadeTotal}
          note="Definida nas definições"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Inscrições Confirmadas"
          value={totalInscritos}
          note="Ocupam vaga (sem canceladas)"
          tone="accent"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatCard
          label="Vagas Livres"
          value={vagasRestantes}
          note="Disponíveis para adesão"
          tone={vagasRestantes > 30 ? 'success' : 'danger'}
          icon={<Ticket className="w-4 h-4" />}
        />
        <StatCard
          label="Taxa de Ocupação"
          value={`${taxaOcupacao}%`}
          progress={taxaOcupacao}
          icon={<Percent className="w-4 h-4" />}
        />
      </div>

      {/* Contagens por estado — leitura rápida do que não ocupa vaga */}
      {capacidade && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900 text-[12px] text-slate-400">
          <span>
            <span className="font-bold text-slate-200 tabular-nums">{listaEsperaCount}</span> em lista de espera
          </span>
          <span>
            <span className="font-bold text-slate-200 tabular-nums">{canceladasCount}</span> canceladas
          </span>
          <span>
            <span className="font-bold text-slate-200 tabular-nums">{capacidade.presentes}</span> já fizeram check-in
          </span>
        </div>
      )}

      {/* Alerta de Lotação */}
      {taxaOcupacao >= 90 && (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Capacidade quase esgotada ({taxaOcupacao}%)</p>
            <p className="text-sm text-slate-400 mt-1">
              Restam apenas {vagasRestantes} vagas. As inscrições subsequentes serão direcionadas automaticamente para a lista de espera.
            </p>
          </div>
        </div>
      )}

      {/* Tabela de Lotes de Inscrição */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-cyan-400" />
            Lotes Oficiais de Ingressos
          </h3>
          <span className="text-[11px] text-slate-500 tabular-nums">
            Total distribuído: {lotes.reduce((sum, l) => sum + l.capacidade, 0)} vagas
          </span>
        </div>

        {lotes.length === 0 && !loading ? (
          <div className="p-5">
            <EmptyState
              icon={<Ticket className="w-10 h-10" />}
              title="Nenhum lote de ingressos registado."
              description="Os lotes criados na base de dados aparecem aqui."
            />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
              <tr className="border-b border-slate-800/60">
                <th className="px-5 py-3 font-bold">Lote / Descrição</th>
                <th className="px-5 py-3 font-bold">Preço</th>
                <th className="px-5 py-3 font-bold text-right">Emitidos / Capacidade</th>
                <th className="px-5 py-3 font-bold">Progresso</th>
                <th className="px-5 py-3 font-bold whitespace-nowrap">Abertura</th>
                <th className="px-5 py-3 font-bold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const progresso =
                  lote.capacidade > 0
                    ? Math.min(100, Math.round((lote.emitidos / lote.capacidade) * 100))
                    : 0
                const status = statusLote(lote)
                return (
                  <tr key={lote.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-white">{lote.nome}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {lote.preco > 0 ? `${lote.preco} Kz` : 'Gratuito'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-right tabular-nums">
                      <span className="font-bold text-cyan-400">{lote.emitidos}</span> / {lote.capacidade}
                    </td>
                    <td className="px-5 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${progresso}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right">{progresso}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap tabular-nums">
                      {lote.dataAbertura || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge
                        tone={status === 'Ativo' ? 'success' : status === 'Esgotado' ? 'neutral' : 'cyan'}
                      >
                        {status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {/* Lista de Espera */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Fila de Espera Prioritária ({filaEspera.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mulheres inscritas após o preenchimento da capacidade oficial.
            </p>
          </div>
        </div>

        <div className="p-5">
          {filaEspera.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-10 h-10" />}
              title="Nenhuma participante na lista de espera no momento."
            />
          ) : (
            <div className="space-y-2">
              {filaEspera.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{item.nome}</p>
                      <p className="text-[11px] text-slate-500">{item.telefone} &middot; Inscrita a {item.criado_em}</p>
                    </div>
                  </div>

                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handlePromoverEspera(item.id, item.nome)}
                    icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Promover para Inscrita
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Edição de Capacidade */}
      {isEditingCapacidade && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Ajustar Capacidade do Evento</h3>
              <button
                onClick={() => setIsEditingCapacidade(false)}
                aria-label="Fechar diálogo"
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400">
              Altera o número total de lugares permitidos no evento. Isto atualizará imediatamente a contagem de vagas livres no site.
            </p>

            <div>
              <label className={labelClasses}>Nova Capacidade Total (lugares)</label>
              <input
                type="number"
                value={novaCapacidade}
                onChange={(e) => setNovaCapacidade(e.target.value)}
                className={fieldClasses}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <Button variant="secondary" onClick={() => setIsEditingCapacidade(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarCapacidade} loading={savingCapacidade}>
                {savingCapacidade ? 'A guardar…' : 'Salvar Alteração'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
