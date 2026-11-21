import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  /** Torna o card clicável com hover visual */
  interactive?: boolean
  /** React consome `key` fora dos props; declarado porque não há @types/react a injetá-lo */
  key?: any
}

export function Card({ children, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900 ${
        interactive ? 'transition-all hover:border-cyan-400/30 hover:bg-slate-900/80' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface SectionTitleProps {
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function SectionTitle({ icon, children, action, className = '' }: SectionTitleProps) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        {icon && <span className="text-cyan-400">{icon}</span>}
        {children}
      </h3>
      {action}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  note?: string
  icon?: React.ReactNode
  /** Cor do valor: 'default' | 'accent' | 'success' | 'danger' */
  tone?: 'default' | 'accent' | 'success' | 'danger'
  progress?: number
  className?: string
}

const toneClasses = {
  default: 'text-slate-100',
  accent: 'text-cyan-400',
  success: 'text-emerald-400',
  danger: 'text-red-400',
}

export function StatCard({ label, value, note, icon, tone = 'default', progress, className = '' }: StatCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</p>
        {icon && <span className="text-cyan-400/70">{icon}</span>}
      </div>
      <p className={`text-2xl font-black mt-1 ${toneClasses[tone]}`}>{value}</p>
      {typeof progress === 'number' && (
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {note && <p className="text-[11px] text-slate-500 mt-0.5">{note}</p>}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-slate-700 mb-2 flex justify-center">{icon}</div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      {description && <p className="text-slate-600 text-xs mt-1">{description}</p>}
    </div>
  )
}
