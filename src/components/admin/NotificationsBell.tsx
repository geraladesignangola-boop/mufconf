import React, { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, UserPlus, UserCog, UserMinus } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

interface EventoInscricao {
  id: string
  tipo: 'INSERT' | 'UPDATE' | 'DELETE'
  nome: string
  codigo?: string
  at: number
  lida: boolean
}

const LIMITE_EVENTOS = 30
let contadorId = 0

function descricaoEvento(ev: EventoInscricao): string {
  switch (ev.tipo) {
    case 'INSERT':
      return 'Nova inscrição'
    case 'UPDATE':
      return 'Inscrição actualizada'
    case 'DELETE':
      return 'Inscrição removida'
  }
}

function IconeEvento({ tipo }: { tipo: EventoInscricao['tipo'] }) {
  const base = 'w-3.5 h-3.5 flex-shrink-0'
  if (tipo === 'INSERT') return <UserPlus className={`${base} text-emerald-400`} />
  if (tipo === 'DELETE') return <UserMinus className={`${base} text-red-400`} />
  return <UserCog className={`${base} text-cyan-400`} />
}

export default function NotificationsBell({ onNavigate }: { onNavigate?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [eventos, setEventos] = useState<EventoInscricao[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  const naoLidas = eventos.filter((e) => !e.lida).length

  // Subscreve alterações em tempo real na tabela `inscricoes` (Supabase Realtime).
  useEffect(() => {
    if (!isSupabaseConfigured) return

    // Semeia o painel com as inscrições mais recentes (já marcadas como lidas).
    supabase
      .from('inscricoes')
      .select('id, nome, codigo, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data?.length) return
        setEventos((prev) => {
          const existentes = new Set(prev.map((e) => e.id))
          const semeados: EventoInscricao[] = data
            .filter((r: any) => !existentes.has(String(r.id)))
            .map((r: any) => ({
              id: String(r.id),
              tipo: 'INSERT' as const,
              nome: r.nome || 'Participante',
              codigo: r.codigo || undefined,
              at: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
              lida: true,
            }))
          return [...prev, ...semeados].slice(0, LIMITE_EVENTOS)
        })
      })

    const canal = supabase
      .channel('admin-inscricoes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inscricoes' },
        (payload) => {
          const novo = payload.new as any
          const antigo = payload.old as any
          const registo = novo?.id ? novo : antigo
          if (!registo?.id) return
          setEventos((prev) => {
            const restantes = prev.filter((e) => e.id !== String(registo.id))
            return [
              {
                id: String(registo.id),
                tipo: payload.eventType as EventoInscricao['tipo'],
                nome: registo.nome || 'Participante',
                codigo: registo.codigo || registo.referral_code || undefined,
                at: Date.now(),
                lida: false,
              },
              ...restantes,
            ].slice(0, LIMITE_EVENTOS)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  // Fecha ao clicar fora ou com Escape.
  useEffect(() => {
    if (!aberto) return
    const onPointerDown = (e: PointerEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [aberto])

  const marcarTodasLidas = () => {
    setEventos((prev) => prev.map((e) => ({ ...e, lida: true })))
  }

  const abrirEvento = (ev: EventoInscricao) => {
    setEventos((prev) => prev.map((e) => (e.id === ev.id ? { ...e, lida: true } : e)))
    setAberto(false)
    onNavigate?.()
  }

  return (
    <div ref={contentRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações — ${naoLidas} por ler` : 'Notificações'}
        aria-expanded={aberto}
        aria-haspopup="true"
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Actualizações de inscrições"
          className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
            <p className="text-xs font-bold text-white">Actualizações de inscrições</p>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasLidas}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {eventos.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">
                Sem actualizações por agora.
              </p>
            ) : (
              eventos.map((ev) => (
                <button
                  key={`${ev.id}-${ev.at}`}
                  type="button"
                  role="menuitem"
                  onClick={() => abrirEvento(ev)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/70 ${
                    ev.lida ? 'opacity-60' : ''
                  }`}
                >
                  <span className="mt-0.5">
                    <IconeEvento tipo={ev.tipo} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      {!ev.lida && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {ev.nome}
                      </span>
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {descricaoEvento(ev)}
                      {ev.codigo ? ` · ${ev.codigo}` : ''}
                      {' · '}
                      {new Date(ev.at).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
