import React from 'react'

export type BadgeTone = 'cyan' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface BadgeProps {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  neutral: 'bg-slate-800 text-slate-400 border border-slate-700',
}

export default function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
