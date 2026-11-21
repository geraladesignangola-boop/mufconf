import React, { useEffect, useState } from 'react'
import {
  Mic,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Star,
  X,
  AlertTriangle,
} from 'lucide-react'
import { OradoraAdmin } from '../../types/database'
import {
  fetchAdminOradoras,
  saveAdminOradora,
  deleteAdminOradora,
} from '../../services/adminDataService'
import { removerImagem } from '../../services/adminStorageService'
import { resolveImageUrl } from '../../services/imageUrlService'
import { PageHeader, Card, Badge, Button, EmptyState, ImageUploadField, fieldClasses, labelClasses } from './ui'

export default function OradorasAdminPage() {
  const [oradoras, setOradoras] = useState<OradoraAdmin>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingOradora, setEditingOradora] = useState<OradoraAdmin | null>(null)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    subtitulo: '',
    biografia: '',
    fotoUrl: '',
    isMain: false,
  })

  useEffect(() => {
    async function load() {
      setErro('')
      try {
        const data = await fetchAdminOradoras()
        setOradoras(data)
      } catch (err) {
        setErro(
          (err as Error).message
        )
      }
    }
    load()
  }, [])

  const handleOpenCreate = () => {
    setEditingOradora(null)
    setFormData({
      nome: '',
      cargo: '',
      subtitulo: '',
      biografia: '',
      fotoUrl: '',
      isMain: false,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (oradora: OradoraAdmin) => {
    setEditingOradora(oradora)
    setFormData({
      nome: oradora.nome,
      cargo: oradora.cargo,
      subtitulo: oradora.subtitulo || '',
      biografia: oradora.biografia || '',
      fotoUrl: oradora.fotoUrl,
      isMain: !!oradora.isMain,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.cargo.trim()) {
      alert('Nome e cargo são obrigatórios.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      if (editingOradora) {
        const guardada = await saveAdminOradora({ ...editingOradora, ...formData })
        setOradoras((prev) =>
          prev.map((o) => (o.id === editingOradora.id ? guardada : o))
        )
      } else {
        const criada = await saveAdminOradora({
          ...formData,
          ordem: oradoras.reduce((max, o) => Math.max(max, o.ordem || 0), 0) + 1,
          visivel: true,
        })
        setOradoras((prev) => [...prev, criada])
      }
      setModalOpen(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisivel = async (id: string) => {
    const target = oradoras.find((o) => o.id === id)
    if (!target) return
    const anterior = target.visivel
    const updated = { ...target, visivel: !target.visivel }
    setOradoras((prev) => prev.map((o) => (o.id === id ? updated : o)))
    setErro('')
    try {
      const guardada = await saveAdminOradora(updated)
      setOradoras((prev) => prev.map((o) => (o.id === id ? guardada : o)))
    } catch (err) {
      setOradoras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, visivel: anterior } : o))
      )
      setErro((err as Error).message)
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem a certeza que deseja remover ${nome}?`)) return
    const alvo = oradoras.find((o) => o.id === id)
    setErro('')
    try {
      await deleteAdminOradora(id)
      setOradoras((prev) => prev.filter((o) => o.id !== id))
      if (alvo?.fotoUrl) await removerImagem(alvo.fotoUrl)
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Mic className="w-5 h-5" />}
        title="Gestão de Oradoras e Mentoras"
        description="Controlo dos perfis das oradoras, biografias, fotografias e ordem de exibição no site público."
        actions={
          <Button variant="primary" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            Adicionar Oradora
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {oradoras.length === 0 ? (
        <EmptyState
          icon={<Mic className="w-6 h-6" />}
          title="Sem oradoras registadas."
          description="Adiciona a primeira oradora para começar."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {oradoras.map((oradora) => (
            <div key={oradora.id} className={!oradora.visivel ? 'opacity-60' : ''}>
              <Card className="overflow-hidden">
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={resolveImageUrl(oradora.fotoUrl)}
                    alt={oradora.nome}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {oradora.isMain && (
                      <span className="p-1 bg-cyan-400 text-slate-950 rounded-md">
                        <Star className="w-3 h-3 fill-slate-950" />
                      </span>
                    )}
                    <Badge tone={oradora.visivel ? 'success' : 'neutral'}>
                      {oradora.visivel ? 'Pública' : 'Oculta'}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{oradora.nome}</h3>
                    <p className="text-[11px] font-semibold text-cyan-400 mt-1">{oradora.cargo}</p>
                  </div>

                  {oradora.subtitulo && (
                    <p className="text-[11px] text-slate-500">{oradora.subtitulo}</p>
                  )}

                  {oradora.biografia && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {oradora.biografia}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950">
                  <span className="text-[11px] text-slate-500 font-mono">Ordem #{oradora.ordem}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisivel(oradora.id)}
                      title={oradora.visivel ? 'Ocultar do site' : 'Mostrar no site'}
                      aria-label={oradora.visivel ? 'Ocultar do site' : 'Mostrar no site'}
                    >
                      {oradora.visivel ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(oradora)}
                      title="Editar perfil"
                      aria-label="Editar perfil"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(oradora.id, oradora.nome)}
                      title="Remover"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingOradora ? 'Editar Oradora' : 'Adicionar Nova Oradora'}
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
                <h3 className="text-sm font-bold text-slate-100">Identidade</h3>
                <div>
                  <label className={labelClasses}>Nome Completo</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Pra. Ana Paula"
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Cargo / Função no Evento</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Mentora de Saúde Emocional"
                    className={fieldClasses}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Perfil público</h3>
                <div>
                  <label className={labelClasses}>Subtítulo / Ministério</label>
                  <input
                    type="text"
                    value={formData.subtitulo}
                    onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                    placeholder="Ex: Ministério da Restauração"
                    className={fieldClasses}
                  />
                </div>

                <ImageUploadField
                  id="oradora-foto"
                  label="Fotografia"
                  value={formData.fotoUrl}
                  onChange={(url) => setFormData({ ...formData, fotoUrl: url })}
                  pasta="oradoras"
                  placeholder="https://… (ligação alternativa)"
                />

                <div>
                  <label className={labelClasses}>Biografia Resumida</label>
                  <textarea
                    rows={3}
                    value={formData.biografia}
                    onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                    placeholder="Breve resumo da trajetória e ministério..."
                    className={`${fieldClasses} resize-none`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-main"
                    checked={formData.isMain}
                    onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400"
                  />
                  <label htmlFor="chk-main" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Destacar como Mentora Principal da Imersão
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {saving ? 'A guardar…' : 'Salvar Oradora'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
