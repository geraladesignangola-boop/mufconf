import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Send, X, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { AdminParticipantOverview } from '../../types/database'
import { Button } from './ui'

interface BulkSendModalProps {
  participants: AdminParticipantOverview[]
  whatsappGroupLink: string
  onSend: (p: AdminParticipantOverview) => void
  onClose: () => void
}

export default function BulkSendModal({ participants, onSend, onClose }: BulkSendModalProps) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const handleSend = (p: AdminParticipantOverview) => {
    onSend(p)
    setSentIds((prev) => new Set(prev).add(p.id))
  }

  const validParticipants = participants.filter((p) => (p.whatsapp || '').replace(/\D/g, ''))
  const invalidParticipants = participants.filter((p) => !(p.whatsapp || '').replace(/\D/g, ''))

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        role="dialog"
        aria-modal="true"
        aria-label="Enviar convite em massa"
        className="w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                <Send className="w-4 h-4" />
              </span>
              <span className="truncate">Enviar convite</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {participants.length} selecionada(s) — {sentIds.size} enviada(s)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar diálogo"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-2 custom-scrollbar">
          {validParticipants.map((p) => {
            const digits = (p.whatsapp || '').replace(/\D/g, '')
            const isSent = sentIds.has(p.id)
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  isSent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100 truncate">{p.nome}</p>
                  <p className="text-[11px] text-slate-500">{p.whatsapp}</p>
                </div>
                {isSent ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" />
                    Enviado
                  </span>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleSend(p)}
                    disabled={!digits}
                    icon={<MessageCircle className="w-3 h-3" />}
                    className="whitespace-nowrap"
                  >
                    Enviar
                  </Button>
                )}
              </div>
            )
          })}

          {invalidParticipants.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
              <p className="text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {invalidParticipants.length} participante(s) sem número de WhatsApp:
              </p>
              {invalidParticipants.map((p) => (
                <p key={p.id} className="text-[11px] text-slate-500">
                  {p.nome}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 truncate">
            {sentIds.size === validParticipants.length && validParticipants.length > 0
              ? 'Todas enviadas!'
              : `Faltam ${validParticipants.length - sentIds.size}`}
          </p>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
