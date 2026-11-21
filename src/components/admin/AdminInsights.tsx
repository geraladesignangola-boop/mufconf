import React from 'react'
import { DashboardStats } from '../../types/database'

interface AdminInsightsProps {
  stats: DashboardStats | null
}

interface Insight {
  type: 'warn' | 'good' | 'info'
  title: string
  description: string
}

export default function AdminInsights({ stats }: AdminInsightsProps) {
  const insights: Insight[] = []

  if (stats) {
    if (stats.instagram_clicks === 0) {
      insights.push({
        type: 'warn',
        title: 'Instagram sem tracao',
        description: '0 inscricoes e 0 engajamento vindos deste canal.',
      })
    }

    if (stats.total_clicks > 0 && stats.whatsapp_clicks > 0) {
      const pct = Math.round((stats.whatsapp_clicks / stats.total_clicks) * 100)
      insights.push({
        type: 'good',
        title: 'WhatsApp e o canal principal',
        description: `${pct}% dos cliques totais (${stats.whatsapp_clicks} de ${stats.total_clicks}).`,
      })
    }

    if (stats.total_prizes_achieved === 0) {
      insights.push({
        type: 'info',
        title: '0 premios entregues',
        description: 'Confirma se o processo de atribuicao esta ativo.',
      })
    }

    if (stats.top_referrer_nome && stats.top_referrer_count > 0) {
      insights.push({
        type: 'good',
        title: `Top convidadora: ${stats.top_referrer_nome}`,
        description: `${stats.top_referrer_count} convidadas directas.`,
      })
    }

    if (stats.total_inscritos > 0 && stats.total_referrals > 0) {
      const referralPct = Math.round((stats.total_referrals / stats.total_inscritos) * 100)
      insights.push({
        type: 'info',
        title: `${referralPct}% taxa de referral`,
        description: `${stats.total_referrals} de ${stats.total_inscritos} inscritas convidaram outras.`,
      })
    }
  }

  const dotColorMap = {
    warn: 'bg-red-500',
    good: 'bg-emerald-500',
    info: 'bg-cyan-400',
  }

  // Sem alertas a coluna mantém a sua altura em vez de colapsar na grelha.
  if (insights.length === 0) {
    return (
      <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          O que precisa da tua atenção
        </p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          Tudo em ordem — nenhum alerta neste momento.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        O que precisa da tua atencao
      </p>
      {insights.map((insight) => (
        <div
          key={insight.title}
          className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-3 text-[13px]"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColorMap[insight.type]}`} />
          <p className="text-white">
            <span className="font-bold">{insight.title}</span>
            <span className="text-slate-500"> -- {insight.description}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
