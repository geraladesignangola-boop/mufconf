import React, { useEffect, useState } from 'react'
import {
  Image as ImageIcon,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { ItemGaleria } from '../../types/database'
import {
  fetchAdminGaleria,
  createAdminFoto,
  updateAdminFoto,
  setAdminFotoVisivel,
  deleteAdminFoto,
} from '../../services/adminContentService'
import { removerImagem } from '../../services/adminStorageService'
import { resolveImageUrl } from '../../services/imageUrlService'
import { PageHeader, Card, Badge, Button, EmptyState, ImageUploadField, fieldClasses, labelClasses } from './ui'

export default function GaleriaAdminPage() {
  const [fotos, setFotos] = useState<ItemGaleria[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingFoto, setEditingFoto] = useState<ItemGaleria | null>(null)
  const [formData, setFormData] = useState({
    url: '',
    titulo: '',
    legenda: '',
    categoria: 'Mentoria' as 'Edição 2025' | 'Bastidores' | 'Mentoria' | 'Comunidade' | 'Flyers',
  })

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setFotos(await fetchAdminGaleria())
    } catch (err) {
      setErro((err as Error).message)
      setFotos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleToggle = async (foto: ItemGaleria) => {
    const novoEstado = !foto.visivel
    setFotos((prev) =>
      prev.map((f) => (f.id === foto.id ? { ...f, visivel: novoEstado } : f))
    )
    try {
      await setAdminFotoVisivel(foto.id, novoEstado)
    } catch (err) {
      setErro((err as Error).message)
      setFotos((prev) =>
        prev.map((f) => (f.id === foto.id ? { ...f, visivel: foto.visivel } : f))
      )
    }
  }

  const handleDelete = async (foto: ItemGaleria) => {
    if (!window.confirm('Eliminar esta fotografia da galeria?')) return
    try {
      await deleteAdminFoto(foto.id)
      await removerImagem(foto.url)
      setFotos((prev) => prev.filter((f) => f.id !== foto.id))
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  const formVazio = {
    url: '',
    titulo: '',
    legenda: '',
    categoria: 'Mentoria' as 'Edição 2025' | 'Bastidores' | 'Mentoria' | 'Comunidade' | 'Flyers',
  }

  const handleOpenCreate = () => {
    setEditingFoto(null)
    setFormData(formVazio)
    setModalOpen(true)
  }

  const handleOpenEdit = (foto: ItemGaleria) => {
    setEditingFoto(foto)
    setFormData({
      url: foto.url,
      titulo: foto.titulo || '',
      legenda: foto.legenda || '',
      categoria: (foto.categoria || 'Mentoria') as typeof formData.categoria,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.url.trim() || !formData.legenda.trim()) {
      alert('A imagem (carregada ou por ligação) e a legenda são obrigatórias.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      if (editingFoto) {
        const urlAnterior = editingFoto.url
        await updateAdminFoto(editingFoto.id, {
          url: formData.url,
          titulo: formData.titulo,
          legenda: formData.legenda,
          categoria: formData.categoria,
        })
        if (urlAnterior && urlAnterior !== formData.url) await removerImagem(urlAnterior)
        setFotos((prev) =>
          prev.map((f) =>
            f.id === editingFoto.id
              ? {
                  ...f,
                  url: formData.url,
                  titulo: formData.titulo.trim() || undefined,
                  legenda: formData.legenda,
                  categoria: formData.categoria,
                }
              : f
          )
        )
      } else {
        const proximaOrdem =
          fotos.reduce((max, f) => Math.max(max, f.ordem || 0), 0) + 1
        await createAdminFoto({
          url: formData.url,
          titulo: formData.titulo,
          legenda: formData.legenda,
          categoria: formData.categoria,
          ordem: proximaOrdem,
        })
        await carregar()
      }
      setModalOpen(false)
      setEditingFoto(null)
      setFormData(formVazio)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ImageIcon className="w-5 h-5" />}
        title="Galeria de Fotografias do Evento"
        description="Gestão das memórias fotográficas, flyers e momentos marcantes para exibição pública."
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            Publicar Foto
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {loading ? (
        <Card className="p-5">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            A carregar a galeria a partir do Supabase…
          </p>
        </Card>
      ) : fotos.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={<ImageIcon className="w-10 h-10" />}
            title="Nenhuma fotografia na galeria."
            description="Publica a primeira fotografia para começar."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className={`rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col ${
                foto.visivel ? '' : 'opacity-60'
              }`}
            >
              <div className="relative w-full h-44 bg-slate-950 overflow-hidden group">
                <img
                  src={resolveImageUrl(foto.url)}
                  alt={foto.legenda}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>

              <div className="p-5 flex-1">
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{foto.legenda}</p>
                <p className="text-[11px] text-slate-500 mt-2 font-mono">
                  {foto.criado_em} &middot; Ordem #{foto.ordem}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {foto.categoria && <Badge tone="cyan">{foto.categoria}</Badge>}
                  <Badge tone={foto.visivel ? 'success' : 'neutral'}>
                    {foto.visivel ? 'Pública' : 'Oculta'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(foto)}
                    title={foto.visivel ? 'Ocultar' : 'Exibir'}
                    aria-label={foto.visivel ? 'Ocultar' : 'Exibir'}
                    icon={
                      foto.visivel ? (
                        <Eye className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(foto)}
                    title="Editar"
                    aria-label="Editar"
                    icon={<Edit2 className="w-4 h-4" />}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(foto)}
                    title="Remover"
                    aria-label="Remover"
                    icon={<Trash2 className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar/Editar Foto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">
                {editingFoto ? 'Editar Fotografia' : 'Adicionar Fotografia à Galeria'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Fechar diálogo"
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <ImageUploadField
                id="galeria-imagem"
                label="Imagem"
                value={formData.url}
                onChange={(url) => setFormData({ ...formData, url })}
                pasta="galeria"
                placeholder="https://… (ligação alternativa)"
              />

              <div>
                <label className={labelClasses}>Título (opcional)</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Flyer oficial da conferência"
                  className={fieldClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                  className={fieldClasses}
                >
                  <option value="Mentoria">Mentoria</option>
                  <option value="Comunidade">Comunidade</option>
                  <option value="Bastidores">Bastidores</option>
                  <option value="Edição 2025">Edição 2025</option>
                  <option value="Flyers">Flyers</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>Legenda Descritiva</label>
                <textarea
                  rows={3}
                  value={formData.legenda}
                  onChange={(e) => setFormData({ ...formData, legenda: e.target.value })}
                  placeholder="Ex: Momento de louvor e oração com as participantes na Mediateca..."
                  className={`${fieldClasses} resize-none`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {saving ? 'A guardar…' : editingFoto ? 'Guardar alterações' : 'Publicar Foto'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
