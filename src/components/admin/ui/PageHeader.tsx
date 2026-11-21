import React from 'react'

interface PageHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
  actions?: React.ReactNode
}

export default function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 ml-0 sm:ml-11">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
