import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DashboardStats,
  DailyRegistration,
  DailyClick,
  RankingEntry,
} from '../../types/database'
import { Users, TrendingUp, Share2, Gift } from 'lucide-react'
import AdminFunnel from './AdminFunnel'
import AdminInsights from './AdminInsights'
import AdminTrendChart from './AdminTrendChart'
import AdminDonutChart from './AdminDonutChart'
import AdminBarChart from './AdminBarChart'
import AdminLeaderboard from './AdminLeaderboard'
import { StatCard } from './ui'

interface AdminDashboardProps {
  stats: DashboardStats | null
  ranking: RankingEntry[]
}

export default function AdminDashboard({ stats, ranking }: AdminDashboardProps) {
  const [dailyRegistrations, setDailyRegistrations] = useState<DailyRegistration[]>([])
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([])
  const [todayRegistrations, setTodayRegistrations] = useState(0)

  useEffect(() => {
    const loadDailyData = async () => {
      const [regResult, clickResult] = await Promise.all([
        supabase.rpc('get_daily_registrations', { p_days: 7 }),
        supabase.rpc('get_daily_clicks', { p_days: 7 }),
      ])

      if (regResult.data) {
        setDailyRegistrations(regResult.data as DailyRegistration[])
        const today = regResult.data[regResult.data.length - 1]
        setTodayRegistrations(today?.count || 0)
      }

      if (clickResult.data) {
        setDailyClicks(clickResult.data as DailyClick[])
      }
    }

    loadDailyData()
  }, [])

  const conversionRate = stats && stats.total_clicks > 0
    ? Math.round((stats.total_inscritos / stats.total_clicks) * 100)
    : 0

  const referralRate = stats && stats.total_inscritos > 0
    ? Math.round((stats.total_referrals / stats.total_inscritos) * 100)
    : 0

  const prizesAchieved = stats?.total_prizes_achieved || 0

  return (
    <div className="space-y-5">
      {/* 1. Métricas principais — a hierarquia começa pelos números que interessam */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Inscritas"
          value={stats?.total_inscritos || 0}
          note="total acumulado"
          icon={<Users className="w-4 h-4" />}
          tone="accent"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          note="cliques → inscrições"
          icon={<TrendingUp className="w-4 h-4" />}
          progress={conversionRate}
        />
        <StatCard
          label="Taxa de referral"
          value={`${referralRate}%`}
          note="inscritas que convidam"
          icon={<Share2 className="w-4 h-4" />}
          progress={referralRate}
        />
        <StatCard
          label="Prémios entregues"
          value={prizesAchieved}
          note={prizesAchieved === 0 ? 'nenhum atribuído até agora' : 'atribuídos'}
          icon={<Gift className="w-4 h-4" />}
          tone={prizesAchieved === 0 ? 'danger' : 'success'}
        />
      </div>

      {/* 2. Funil da campanha — fluxo horizontal, ganha com a largura total */}
      <AdminFunnel stats={stats} />

      {/* 3. Tendência (largo) + alertas (coluna lateral) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 min-w-0">
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Tendência de inscrições
            </p>
            <span className="text-slate-600 normal-case font-normal text-[11px]">últimos 7 dias</span>
          </div>
          <AdminTrendChart data={dailyRegistrations} totalToday={todayRegistrations} />
        </section>

        <div className="min-w-0">
          <AdminInsights stats={stats} />
        </div>
      </div>

      {/* 4. Tráfego: origem dos cliques + distribuição semanal */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <AdminDonutChart stats={stats} />
        <AdminBarChart data={dailyClicks} />
      </div>

      {/* 5. Ranking */}
      <section>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Ranking de convidadoras
          </p>
          <span className="text-slate-600 normal-case font-normal text-[11px]">top 5</span>
        </div>
        <AdminLeaderboard ranking={ranking} />
      </section>
    </div>
  )
}
