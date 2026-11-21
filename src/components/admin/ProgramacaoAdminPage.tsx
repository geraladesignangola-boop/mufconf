import React, { useEffect, useState } from 'react'
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  User,
  MapPin,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react'
import { ItemProgramacao } from '../../types/database'
import {
  fetchAdminProgramacao,
  saveAdminProgramacaoItem,
  deleteAdminProgramacaoItem,
} from '../../services/adminDataService'
import { PageHeader, Card, Badge, Button, EmptyState, fieldClasses, labelClasses } from './ui'

export default function ProgramacaoAdminPage() {
  const [itens, setItens] = useState<ItemProgramacao[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemProgramacao | null>(null)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    horaInicio: '09:00',
    horaFim: '10:00',
    periodo: 'Manhã' as 'Manhã' | 'Tarde' | 'Noite',
    titulo: '',
    descricao: '',
    oradoraNome: '',
    local: '',
  })

  useEffect(() => {
    async function load() {
      setErro('')
      try {
        const data = await fetchAdminProgramacao()
        setItens(data)
      } catch (err) {
        setErro(
          (err as Error).message
        )
      }
    }
    load()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      horaInicio: '09:00',
      horaFim: '10:00',
      periodo: 'Manhã',
      titulo: '',
      descricao: '',
      oradoraNome: '',
      local: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (item: ItemProgramacao) => {
    setEditingItem(item)
    setFormData({
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      periodo: item.periodo,
      titulo: item.titulo,
      descricao: item.descricao || '',
      oradoraNome: item.oradoraNome || '',
      local: item.local || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      alert('O título da sessão é obrigatório.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      if (editingItem) {
        const guardado = await saveAdminProgramacaoItem({ ...editingItem, ...formData })
        setItens((prev) =>
          prev.map((it) => (it.id === editingItem.id ? guardado : it))
        )
      } else {
        const criado = await saveAdminProgramacaoItem({
          ...formData,
          ordem: itens.reduce((max, it) => Math.max(max, it.ordem || 0), 0) + 1,
          visivel: true,
        })
        setItens((prev) => [...prev, criado])
      }
      setModalOpen(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisivel = async (id: string) => {
    const target = itens.find((it) => it.id === id)
    if (!target) return
    const anterior = target.visivel
    const updated = { ...target, visivel: !target.visivel }
    setItens((prev) => prev.map((it) => (it.id === id ? updated : it)))
    setErro('')
    try {
      const guardado = await saveAdminProgramacaoItem(updated)
      setItens((prev) => prev.map((it) => (it.id === id ? guardado : it)))
    } catch (err) {
      setItens((prev) =>
        prev.map((it) => (it.id === id ? { ...it, visivel: anterior } : it))
      )
      setErro((err as Error).message)
    }
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`Tem a certeza que deseja remover a sessão "${titulo}"?`)) return
    setErro('')
    try {
      await deleteAdminProgramacaoItem(id)
      setItens((prev) => prev.filter((it) => it.id !== id))
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarDays className="w-5 h-5" />}
        title="Programação Oficial do Evento"
        description="Cronograma por períodos, horários, sessões e mentores designados."
        actions={
          <Button variant="primary" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            Adicionar Sessão
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Sessões programadas</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{itens.length} sessões no cronograma</p>
          </div>
        </div>

        {itens.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CalendarDays className="w-10 h-10" />}
              title="Sem sessões na programação."
              description="Adiciona a primeira sessão para começar."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
                <tr className="border-b border-slate-800/60">
                  <th className="px-5 py-3 font-bold">Horário</th>
                  <th className="px-5 py-3 font-bold">Sessão</th>
                  <th className="px-5 py-3 font-bold hidden lg:table-cell">Oradora</th>
                  <th className="px-5 py-3 font-bold hidden xl:table-cell">Local</th>
                  <th className="px-5 py-3 font-bold text-center">Estado</th>
                  <th className="px-5 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/40 ${item.visivel ? '' : 'opacity-60'}`}
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-mono text-sm font-bold text-cyan-400">
                        {item.horaInicio} - {item.horaFim}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                        {item.periodo}
                      </p>
                    </td>
                    <td className="px-5 py-3 max-w-md">
                      <p className="text-sm font-semibold text-white">{item.titulo}</p>
                      {item.descricao && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 lg:hidden">
                        {item.oradoraNome && (
                          <span className="inline-flex items-center gap-1 text-cyan-300">
                            <User className="w-3 h-3" />
                            {item.oradoraNome}
                          </span>
                        )}
                        {item.local && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.local}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {item.oradoraNome ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-cyan-300">
                          <User className="w-3.5 h-3.5" />
                          {item.oradoraNome}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell text-sm text-slate-400">
                      {item.local ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {item.local}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={item.visivel ? 'success' : 'neutral'}>
                        {item.visivel ? 'Visível' : 'Oculto'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisivel(item.id)}
                          title={item.visivel ? 'Ocultar' : 'Exibir'}
                          aria-label={item.visivel ? 'Ocultar' : 'Exibir'}
                          icon={item.visivel ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar sessão"
                          aria-label="Editar sessão"
                          icon={<Edit2 className="w-4 h-4" />}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.titulo)}
                          title="Remover sessão"
                          aria-label="Remover sessão"
                          icon={<Trash2 className="w-4 h-4" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Criar / Editar Sessão */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingItem ? 'Editar Sessão' : 'Adicionar Sessão à Programação'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Fechar diálogo"
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Horário
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClasses}>Hora Início</label>
                    <input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Hora Fim</label>
                    <input
                      type="time"
                      value={formData.horaFim}
                      onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Período</label>
                    <select
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value as any })}
                      className={fieldClasses}
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Sessão</h3>
                <div>
                  <label className={labelClasses}>Título da Sessão</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Painel 1 — Cura Interior"
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Descrição</label>
                  <textarea
                    rows={2}
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Breve descrição dos tópicos abordados..."
                    className={`${fieldClasses} resize-none`}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Equipa e Local</h3>
                <div>
                  <label className={labelClasses}>Preletora / Facilitadora (Opcional)</label>
                  <input
                    type="text"
                    value={formData.oradoraNome}
                    onChange={(e) => setFormData({ ...formData, oradoraNome: e.target.value })}
                    placeholder="Ex: Pra. Gilsa Bitumba"
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Local / Sala</label>
                  <input
                    type="text"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder="Ex: Auditório Central"
                    className={fieldClasses}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {saving ? 'A guardar…' : 'Salvar Sessão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
