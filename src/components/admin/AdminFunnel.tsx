import React from 'react'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { DashboardStats } from '../../types/database'

interface AdminFunnelProps {
  stats: DashboardStats | null
  /** Inscrições registadas hoje (valor real, vindo de get_daily_registrations). */
  todayRegistrations?: number
}

interface FunnelStage {
  value: number
  label: string
  delta?: string
}

export default function AdminFunnel({ stats, todayRegistrations = 0 }: AdminFunnelProps) {
  const stages: FunnelStage[] = [
    { value: stats?.total_links || 0, label: 'Links gerados' },
    { value: stats?.total_clicks || 0, label: 'Cliques totais' },
    {
      value: stats?.total_inscritos || 0,
      label: 'Inscritas',
      delta: todayRegistrations > 0 ? `+${todayRegistrations} hoje` : undefined,
    },
    { value: stats?.total_referrals || 0, label: 'Referrals gerados' },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        Funil da campanha
      </p>

      <div className="hidden md:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-0">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.label}>
            <div className="text-center">
              <p className="text-2xl font-black text-cyan-400">{stage.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stage.label}</p>
              {stage.delta && (
                <p className="text-[11px] text-emerald-500 font-semibold mt-1">{stage.delta}</p>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="flex flex-col items-center px-2">
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {stages[i + 1].value > 0 && stage.value > 0
                    ? `${Math.round((stages[i + 1].value / stage.value) * 100)}%`
                    : '0%'}
                </p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="md:hidden space-y-3">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.label}>
            <div className="bg-slate-950/50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-cyan-400">{stage.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stage.label}</p>
              {stage.delta && (
                <p className="text-[11px] text-emerald-500 font-semibold mt-1">{stage.delta}</p>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <div className="h-px flex-1 bg-slate-800" />
                <ArrowDown className="w-4 h-4" />
                <span className="text-[10px]">
                  {stages[i + 1].value > 0 && stage.value > 0
                    ? `${Math.round((stages[i + 1].value / stage.value) * 100)}%`
                    : '0%'}
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
