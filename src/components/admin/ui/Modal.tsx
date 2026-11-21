import React, { useEffect } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
}

/**
 * Modal reutilizável do painel admin.
 * - Fecha com tecla Escape
 * - Botão de fecho com aria-label
 * - Fundo escurecido com backdrop blur
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar diálogo"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">{footer}</div>
        )}
      </motion.div>
    </div>
  )
}

/** Campos de formulário padrão do painel (input / textarea / select / label). */
export const fieldClasses =
  'w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors'

export const labelClasses =
  'block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1'
