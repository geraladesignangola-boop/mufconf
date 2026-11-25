import React from 'react'
import { DailyClick } from '../../types/database'

interface AdminBarChartProps {
  data: DailyClick[]
}

export default function AdminBarChart({ data }: AdminBarChartProps) {
  const hasData = data.length > 0
  const maxTotal = hasData ? Math.max(...data.map((d) => d.total), 1) : 1
  const hasClicks = data.some((d) => d.total > 0)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        Cliques por dia da semana
      </p>
      {hasData ? (
      <>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height: 120 }}>
        {data.map((d) => {
          const heightPct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
          const isMax = d.total === maxTotal && d.total > 0
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end h-full gap-1"
            >
              <span className="text-[9px] text-slate-400 tabular-nums mb-1">{d.total}</span>
              <div
                className={`w-full rounded-t-md transition-all ${
                  isMax ? 'bg-cyan-400' : 'bg-slate-800'
                }`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              <span className="text-[9px] sm:text-[10px] text-slate-600 truncate w-full text-center">
                {d.day_of_week}
              </span>
            </div>
          )
        })}
      </div>
      {!hasClicks && (
        <p className="mt-2 text-center text-[10px] text-slate-600">
          Nenhum clique registado nos últimos dias.
        </p>
      )}
      </>
      ) : (
        <div className="flex h-[120px] items-center justify-center text-xs text-slate-500">
          Não foi possível carregar os cliques.
        </div>
      )}
    </div>
  )
}
