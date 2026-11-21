import React from 'react'
import { Gift, Trophy, Shirt, BookOpen, Calendar } from 'lucide-react'
import { RankingEntry, PRIZE_NAMES, PrizeName } from '../../types/database'
import { PageHeader, Card, Badge, EmptyState } from './ui'

interface PremiosPageProps {
  ranking: RankingEntry[]
}

const PODIUM_PRIZES: PrizeName[] = ['pack_completo', 'agenda', 'camisa']

const PRIZE_DETAILS: Record<PrizeName, { icon: React.ElementType; description: string; criteria: string }> = {
  pack_completo: {
    icon: BookOpen,
    description: 'Biblia de estudo capa premium com devocional incluido.',
    criteria: '1a classificada no ranking de convidadoras',
  },
  agenda: {
    icon: Calendar,
    description: 'Agenda espiritual 2026 com planos de leitura e reflexoes.',
    criteria: '2a classificada no ranking de convidadas',
  },
  camisa: {
    icon: Shirt,
    description: 'T-shirt exclusiva Mulheres de Fogo edicao limitada.',
    criteria: '3a classificada no ranking de convidadas',
  },
}

export default function PremiosPage({ ranking }: PremiosPageProps) {
  const podium = ranking.slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Gift className="w-5 h-5" />}
        title="Gestao de Premios"
        description="Premios atribuidos automaticamente com base no ranking de convidadoras."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {PODIUM_PRIZES.map((prizeKey, i) => {
          const detail = PRIZE_DETAILS[prizeKey]
          const Icon = detail.icon
          const winner = podium[i]

          return (
            <div
              key={prizeKey}
              className={`rounded-2xl border overflow-hidden ${
                i === 0
                  ? 'bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border-cyan-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
                <div className={`p-2 rounded-lg flex-shrink-0 ${i === 0 ? 'bg-cyan-500/15' : 'bg-slate-800'}`}>
                  <Icon className={`w-5 h-5 ${i === 0 ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {i + 1}o lugar
                  </p>
                  <p className="text-sm font-bold text-slate-100 truncate">{PRIZE_NAMES[prizeKey]}</p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-400">{detail.description}</p>
                <p className="text-[11px] text-slate-500">{detail.criteria}</p>

                {winner ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                      Atribuido a
                    </p>
                    <p className="text-sm font-bold text-white">{winner.nome}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {winner.convidadas_count} convidadas
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[11px] text-slate-500">
                      Aguardando apuramento do ranking.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            Classificacao actual
          </h3>
        </div>

        <div className="p-5">
          {ranking.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-10 h-10" />}
              title="Nenhuma classificação disponível."
            />
          ) : (
            <div className="space-y-2">
              {ranking.slice(0, 10).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3 py-1">
                  <span
                    className={`w-6 text-center text-sm font-bold tabular-nums ${
                      i < 3 ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {i + 1}o
                  </span>
                  <span className="flex-1 text-sm text-white truncate">{entry.nome}</span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {entry.convidadas_count} convidadas
                  </span>
                  {i < 3 && (
                    <Badge tone="cyan">{PRIZE_NAMES[PODIUM_PRIZES[i]]}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
