import React from 'react'
import { motion } from 'motion/react'
import { Crown, Medal, Award, Check, Trophy } from 'lucide-react'
import { PRIZE_NAMES, RankingEntry } from '../../types/database'
import { PODIUM_PRIZES } from './constants'
import { PageHeader, Button, Card } from './ui'

interface RankingSectionProps {
  ranking: RankingEntry[]
  isFinalizing: boolean
  onFinalize: () => void
  podiumEntries: RankingEntry[]
}

export default function RankingSection({ ranking, isFinalizing, onFinalize, podiumEntries }: RankingSectionProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Crown className="w-5 h-5" />}
        title="Ranking de Convidadoras"
        description="O pódio final fica com as 3 mulheres que trouxerem mais convidadas."
        actions={
          <Button
            onClick={onFinalize}
            disabled={isFinalizing || ranking.length === 0}
            loading={isFinalizing}
            icon={isFinalizing ? undefined : <Check className="w-4 h-4" />}
          >
            {isFinalizing ? 'A fechar...' : 'Fechar pódio'}
          </Button>
        }
      />

      {podiumEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {podiumEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`relative rounded-2xl border p-4 overflow-hidden ${
                index === 0
                  ? 'bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border-cyan-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-transparent blur-xl" />
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  {index + 1}º lugar
                </p>
                <span
                  className={`p-1.5 rounded-lg ${
                    index === 0 ? 'bg-cyan-400/15 text-cyan-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {index === 0 ? <Trophy className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-white truncate">{entry.nome}</p>
              <p className="text-sm text-slate-400">{entry.convidadas_count} convidadas</p>
              <p className="mt-3 text-sm font-semibold text-cyan-300">
                {PRIZE_NAMES[PODIUM_PRIZES[index]]}
              </p>
            </div>
          ))}
        </div>
      )}

      {ranking.length === 0 ? (
        <Card className="p-8">
          <p className="text-slate-500 text-center text-sm">Ainda não há dados de referral.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden divide-y divide-slate-800/70">
          {ranking.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.4) }}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-800/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? 'bg-cyan-500/15' : 'bg-slate-800'
                }`}
              >
                {index === 0 ? (
                  <Crown className="w-5 h-5 text-cyan-400" />
                ) : index === 1 ? (
                  <Medal className="w-5 h-5 text-slate-400" />
                ) : index === 2 ? (
                  <Award className="w-5 h-5 text-blue-400" />
                ) : (
                  <span className="text-sm text-slate-500 font-bold">{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-100 truncate">{entry.nome}</p>
                  {index < 3 && (
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold rounded-full">
                      {PRIZE_NAMES[PODIUM_PRIZES[index]]}
                    </span>
                  )}
                  {entry.prize_achieved && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                      PRÉMIO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{entry.email}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-cyan-400">{entry.convidadas_count}</p>
                <p className="text-[10px] text-slate-600">convidadas</p>
              </div>
            </motion.div>
          ))}
        </Card>
      )}
    </div>
  )
}
