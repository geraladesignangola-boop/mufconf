import React from 'react'
import { Users, Search, Send, MessageCircle, CheckCircle, Inbox } from 'lucide-react'
import { AdminParticipantOverview, PRIZE_NAMES } from '../../types/database'
import { PODIUM_PRIZES, ParticipantFilter } from './constants'
import { PageHeader, Button, Card, Badge, EmptyState, fieldClasses } from './ui'

interface ParticipantsSectionProps {
  participants: AdminParticipantOverview[]
  searchTerm: string
  onSearchChange: (v: string) => void
  participantFilter: ParticipantFilter
  onFilterChange: (v: ParticipantFilter) => void
  podiumPositionById: Map<string, number>
  onSelectParticipant: (id: string) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onNotifySelected: () => void
  onAddToGroup: (participant: AdminParticipantOverview) => void
}

const FILTER_OPTIONS: { value: ParticipantFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'podium', label: 'Pódio' },
  { value: 'linked', label: 'Com links extras' },
  { value: 'no_links', label: 'Sem links extras' },
  { value: 'group_added', label: 'Já no grupo' },
  { value: 'group_pending', label: 'Pendente grupo' },
]

const TABLE_HEADERS = [
  'Nome',
  'Contacto',
  'Convidadas',
  'Links',
  'Cliques',
  'Último Link',
  'Pódio',
  'Prémio',
  'Data',
  'Grupo',
]

export default function ParticipantsSection({
  participants,
  searchTerm,
  onSearchChange,
  participantFilter,
  onFilterChange,
  podiumPositionById,
  onSelectParticipant,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onNotifySelected,
  onAddToGroup,
}: ParticipantsSectionProps) {
  const allSelected = selectedIds.size === participants.length && participants.length > 0

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Users className="w-5 h-5" />}
        title={`Participantes (${participants.length})`}
        description="Clica numa linha para abrir a ficha completa."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Procurar nome, email, igreja..."
                aria-label="Procurar participantes"
                className={`${fieldClasses} pl-9 sm:w-72`}
              />
            </div>
            <select
              value={participantFilter}
              onChange={(e) => onFilterChange(e.target.value as ParticipantFilter)}
              aria-label="Filtrar participantes"
              className={`${fieldClasses} sm:w-48`}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {participants.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            icon={<Inbox className="w-10 h-10" />}
            title="Nenhuma participante corresponde aos critérios."
            description="Ajusta a pesquisa ou o filtro para veres mais resultados."
          />
        </Card>
      ) : (
        <>
          {/* Tabela desktop — anatomia de cartão com banda de cabeçalho */}
          <Card className="overflow-hidden hidden md:block">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Lista de participantes
                </p>
                {selectedIds.size > 0 && (
                  <Badge tone="cyan">
                    {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    aria-label="Selecionar todos"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400"
                  />
                  Todos
                </label>
                {selectedIds.size > 0 && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onNotifySelected}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Enviar para {selectedIds.size}
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/70">
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 w-10" />
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => {
                    const podiumPosition = podiumPositionById.get(participant.id)
                    const prizeKey =
                      typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null
                    const isSelected = selectedIds.has(participant.id)

                    return (
                      <tr
                        key={participant.id}
                        onClick={() => onSelectParticipant(participant.id)}
                        className={`border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect(participant.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Selecionar ${participant.nome}`}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-0.5">
                            <p className="text-sm text-white font-semibold">{participant.nome}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {participant.igreja || 'Sem igreja registada'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-400">
                          <div className="space-y-0.5">
                            <p className="truncate max-w-[200px]">{participant.email}</p>
                            <p className="text-[11px] text-slate-600">{participant.whatsapp}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <span className="font-bold text-cyan-400 tabular-nums">
                            {participant.convidadas_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-100 tabular-nums">
                              {participant.total_links}
                            </p>
                            <p className="text-[11px] text-slate-600 truncate max-w-[140px]">
                              {participant.latest_link_label || 'principal'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-100 tabular-nums">
                              {participant.total_clicks}
                            </p>
                            <p className="text-[11px] text-slate-600 whitespace-nowrap">
                              W:{participant.whatsapp_clicks} · F:{participant.facebook_clicks} ·
                              I:{participant.instagram_clicks}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-400 max-w-[200px]">
                          <div className="space-y-0.5">
                            <p className="truncate">{participant.latest_link_token || '--'}</p>
                            <p className="text-[11px] text-slate-600">
                              {participant.latest_link_created_at
                                ? new Date(
                                    participant.latest_link_created_at
                                  ).toLocaleDateString('pt-PT')
                                : 'Sem data'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          {podiumPosition ? (
                            <Badge tone="cyan">{podiumPosition}º lugar</Badge>
                          ) : (
                            <span className="px-2 py-1 bg-slate-800 text-slate-500 text-xs font-bold rounded-full">
                              --
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          {prizeKey ? (
                            <Badge tone="success">{PRIZE_NAMES[prizeKey]}</Badge>
                          ) : (
                            <span className="px-2 py-1 bg-slate-800 text-slate-500 text-xs font-bold rounded-full whitespace-nowrap">
                              Aguardando
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {new Date(participant.created_at).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {participant.group_added_at ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-[11px] font-semibold whitespace-nowrap">
                              <CheckCircle className="w-3 h-3" />
                              Adicionado
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddToGroup(participant)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Adicionar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cartões mobile */}
          <div className="md:hidden space-y-3">
            <label className="flex items-center gap-3 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-xs text-slate-500">Selecionar todos</span>
            </label>

            {selectedIds.size > 0 && (
              <Button variant="success" onClick={onNotifySelected} icon={<Send className="w-4 h-4" />} className="w-full">
                Enviar para {selectedIds.size}
              </Button>
            )}

            {participants.map((participant) => {
              const podiumPosition = podiumPositionById.get(participant.id)
              const prizeKey =
                typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null
              const isSelected = selectedIds.has(participant.id)

              return (
                <div
                  key={participant.id}
                  onClick={() => onSelectParticipant(participant.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/5 border-cyan-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(participant.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${participant.nome}`}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {participant.nome}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {participant.igreja || 'Sem igreja registada'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {podiumPosition && <Badge tone="cyan">{podiumPosition}º</Badge>}
                          {prizeKey && <Badge tone="success">{PRIZE_NAMES[prizeKey]}</Badge>}
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-950/70 rounded-lg p-2">
                          <p className="text-lg font-bold text-cyan-400 tabular-nums">
                            {participant.convidadas_count}
                          </p>
                          <p className="text-[10px] text-slate-600">Convidadas</p>
                        </div>
                        <div className="bg-slate-950/70 rounded-lg p-2">
                          <p className="text-lg font-bold text-slate-100 tabular-nums">
                            {participant.total_links}
                          </p>
                          <p className="text-[10px] text-slate-600">Links</p>
                        </div>
                        <div className="bg-slate-950/70 rounded-lg p-2">
                          <p className="text-lg font-bold text-slate-100 tabular-nums">
                            {participant.total_clicks}
                          </p>
                          <p className="text-[10px] text-slate-600">Cliques</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate">{participant.email}</p>
                        {participant.group_added_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-semibold flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Adicionado
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddToGroup(participant)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-semibold flex-shrink-0"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Grupo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
