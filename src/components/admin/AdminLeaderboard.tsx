import React from 'react'
import { RankingEntry, PRIZE_NAMES, PrizeName } from '../../types/database'

interface AdminLeaderboardProps {
  ranking: RankingEntry[]
}

const PODIUM_PRIZES: PrizeName[] = ['pack_completo', 'agenda', 'camisa']

export default function AdminLeaderboard({ ranking }: AdminLeaderboardProps) {
  const top5 = ranking.slice(0, 5)
  if (top5.length === 0) return null

  const maxCount = top5[0]?.convidadas_count || 1

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="divide-y divide-slate-800">
        {top5.map((entry, i) => {
          const barWidth = Math.round((entry.convidadas_count / maxCount) * 100)
          return (
            <div
              key={entry.id}
              className={`px-4 sm:px-5 py-3 ${i === 0 ? 'first' : ''}`}
            >
              <div className="hidden sm:grid grid-cols-[32px_1fr_90px_140px] items-center gap-3">
                <p
                  className={`text-sm font-bold text-center ${
                    i === 0 ? 'text-cyan-400' : 'text-slate-600'
                  }`}
                >
                  {i + 1}º
                </p>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">
                    {entry.nome}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {i < 3 ? `Premio: ${PRIZE_NAMES[PODIUM_PRIZES[i]]}` : 'Sem premio atribuido'}
                  </p>
                </div>
                <p className="text-[13px] text-slate-400 text-right tabular-nums">
                  {entry.convidadas_count} convidadas
                </p>
                <div className="h-[6px] rounded-[3px] bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-[3px] bg-cyan-400"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              <div className="sm:hidden space-y-2">
                <div className="flex items-center gap-3">
                  <p
                    className={`text-sm font-bold w-6 text-center ${
                      i === 0 ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {i + 1}º
                  </p>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">
                      {entry.nome}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {i < 3 ? `Premio: ${PRIZE_NAMES[PODIUM_PRIZES[i]]}` : 'Sem premio atribuido'}
                    </p>
                  </div>
                  <p className="text-[13px] text-cyan-400 font-bold tabular-nums">
                    {entry.convidadas_count}
                  </p>
                </div>
                <div className="pl-9">
                  <div className="h-[6px] rounded-[3px] bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-[3px] bg-cyan-400"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
