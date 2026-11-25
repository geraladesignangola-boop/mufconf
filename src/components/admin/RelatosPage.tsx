import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MessageSquareWarning,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react'
import { Relato, RelatoEstado } from '../../types/database'
import { fetchAdminRelatos, updateAdminRelato } from '../../services/adminContentService'
import { PageHeader, Card, Badge, Button, EmptyState } from './ui'

const ESTADOS: { id: RelatoEstado | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'novo', label: 'Novos' },
  { id: 'em_curso', label: 'Em curso' },
  { id: 'resolvido', label: 'Resolvidos' },
]

const ESTADO_TONE = {
  novo: 'cyan' as const,
  em_curso: 'warning' as const,
  resolvido: 'success' as const,
}

const ESTADO_LABEL: Record<RelatoEstado, string> = {
  novo: 'Novo',
  em_curso: 'Em curso',
  resolvido: 'Resolvido',
}

function formatarData(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * Relatos enviados pelo site (problemas de inscrição e comentários).
 * O admin pode filtrar, mudar o estado e deixar uma nota interna.
 */
export default function RelatosPage() {
  const [relatos, setRelatos] = useState<Relato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<RelatoEstado | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'problema' | 'comentario'>('todos')
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [notaDraft, setNotaDraft] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const dados = await fetchAdminRelatos()
      setRelatos(dados)
      setNotaDraft(Object.fromEntries(dados.map((r) => [r.id, r.admin_notes || ''])))
    } catch (err) {
      setErro((err as Error).message)
      setRelatos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrados = useMemo(() => {
    return relatos.filter((r) => {
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false
      if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false
      return true
    })
  }, [relatos, filtroEstado, filtroTipo])

  const contagens = useMemo(
    () => ({
      todos: relatos.length,
      novo: relatos.filter((r) => r.estado === 'novo').length,
      em_curso: relatos.filter((r) => r.estado === 'em_curso').length,
      resolvido: relatos.filter((r) => r.estado === 'resolvido').length,
      problemas: relatos.filter((r) => r.tipo === 'problema').length,
    }),
    [relatos]
  )

  const alterarEstado = async (relato: Relato, estado: RelatoEstado) => {
    if (guardandoId) return
    setGuardandoId(relato.id)
    setErro('')
    try {
      await updateAdminRelato(relato.id, { estado })
      setRelatos((prev) =>
        prev.map((r) =>
          r.id === relato.id
            ? {
                ...r,
                estado,
                resolvido_em: estado === 'resolvido' ? new Date().toISOString() : null,
              }
            : r
        )
      )
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setGuardandoId(null)
    }
  }

  const guardarNota = async (relato: Relato) => {
    if (guardandoId) return
    setGuardandoId(relato.id)
    setErro('')
    try {
      const nota = notaDraft[relato.id] ?? ''
      await updateAdminRelato(relato.id, { admin_notes: nota.trim() || null })
      setRelatos((prev) =>
        prev.map((r) => (r.id === relato.id ? { ...r, admin_notes: nota.trim() || null } : r))
      )
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setGuardandoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessageSquareWarning className="w-5 h-5" />}
        title="Relatos de Problemas e Comentários"
        description="Mensagens enviadas pelas participantes no formulário de inscrição."
        actions={
          <Button
            variant="secondary"
            onClick={carregar}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {ESTADOS.map((estado) => (
          <button
            key={estado.id}
            onClick={() => setFiltroEstado(estado.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filtroEstado === estado.id
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {estado.label}
            <span className="ml-1.5 tabular-nums">
              {estado.id === 'todos' ? contagens.todos : contagens[estado.id as RelatoEstado]}
            </span>
          </button>
        ))}

        <span className="w-px h-5 bg-slate-800 mx-1" />

        {(['todos', 'problema', 'comentario'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filtroTipo === tipo
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {tipo === 'todos' ? 'Todos os tipos' : tipo === 'problema' ? 'Problemas' : 'Comentários'}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-5">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />A carregar relatos…
          </p>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={<MessageSquare className="w-10 h-10" />}
            title={relatos.length === 0 ? 'Nenhum relato recebido.' : 'Nenhum relato com estes filtros.'}
            description={
              relatos.length === 0
                ? 'As mensagens enviadas no formulário de inscrição aparecem aqui.'
                : 'Altera os filtros para veres outros relatos.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((relato) => {
            const guardando = guardandoId === relato.id
            return (
              <Card key={relato.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {relato.tipo === 'problema' ? (
                        <Badge tone="danger">
                          <AlertTriangle className="w-3 h-3" /> Problema
                        </Badge>
                      ) : (
                        <Badge tone="info">
                          <MessageSquare className="w-3 h-3" /> Comentário
                        </Badge>
                      )}
                      <Badge tone={ESTADO_TONE[relato.estado]}>{ESTADO_LABEL[relato.estado]}</Badge>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {formatarData(relato.criado_em)}
                      </span>
                    </div>

                    <p className="mt-2.5 text-sm font-semibold text-white flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      {relato.nome}
                      {relato.contacto && (
                        <span className="font-normal text-slate-400">· {relato.contacto}</span>
                      )}
                    </p>

                    {relato.inscrito_nome && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Ligada à inscrição de {relato.inscrito_nome}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                      {relato.mensagem}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {(['novo', 'em_curso', 'resolvido'] as RelatoEstado[]).map((estado) => (
                      <Button
                        key={estado}
                        size="sm"
                        variant={
                          relato.estado === estado
                            ? 'primary'
                            : estado === 'resolvido'
                            ? 'success'
                            : 'secondary'
                        }
                        disabled={guardando || relato.estado === estado}
                        onClick={() => alterarEstado(relato, estado)}
                      >
                        {estado === 'novo' ? 'Marcar novo' : estado === 'em_curso' ? 'Em curso' : 'Resolver'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Nota interna (visível apenas para admins) */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`nota-${relato.id}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      Nota interna
                    </label>
                    <input
                      id={`nota-${relato.id}`}
                      type="text"
                      value={notaDraft[relato.id] ?? ''}
                      onChange={(e) =>
                        setNotaDraft((prev) => ({ ...prev, [relato.id]: e.target.value }))
                      }
                      placeholder="Ex.: contactada por WhatsApp, devolução feita…"
                      className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={guardando}
                    loading={guardando}
                    onClick={() => guardarNota(relato)}
                  >
                    {guardando ? 'A guardar…' : 'Guardar nota'}
                  </Button>
                </div>

                {relato.estado === 'resolvido' && relato.resolvido_em && (
                  <p className="mt-2 text-[11px] text-emerald-500/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolvido em {formatarData(relato.resolvido_em)}
                  </p>
                )}
                {relato.estado !== 'resolvido' && (
                  <p className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {ESTADO_LABEL[relato.estado]}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
