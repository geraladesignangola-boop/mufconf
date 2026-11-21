import React, { useEffect, useRef, useState } from 'react'
import {
  Paperclip,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  AlertTriangle,
  Download,
  ExternalLink,
  Upload,
} from 'lucide-react'
import { MaterialAtalho } from '../../types/database'
import {
  fetchAdminMateriais,
  createAdminMaterial,
  setAdminMaterialVisivel,
  deleteAdminMaterial,
} from '../../services/adminContentService'
import { removerImagem, uploadFicheiro } from '../../services/adminStorageService'
import { PageHeader, Card, Badge, Button, EmptyState, Modal, fieldClasses, labelClasses } from './ui'

export default function MateriaisAtalhosPage() {
  const [itens, setItens] = useState<MaterialAtalho[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'atalho' as 'material' | 'atalho',
    titulo: '',
    descricao: '',
    url: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setItens(await fetchAdminMateriais())
    } catch (err) {
      setErro((err as Error).message)
      setItens([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleToggle = async (item: MaterialAtalho) => {
    const novoEstado = !item.visivel
    setItens((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, visivel: novoEstado } : i))
    )
    try {
      await setAdminMaterialVisivel(item.id, novoEstado)
    } catch (err) {
      setErro((err as Error).message)
      setItens((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, visivel: item.visivel } : i))
      )
    }
  }

  const handleDelete = async (item: MaterialAtalho) => {
    if (!window.confirm(`Remover "${item.titulo}"?`)) return
    try {
      await deleteAdminMaterial(item.id)
      await removerImagem(item.url)
      setItens((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  const handleUploadFicheiro = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const ficheiro = event.target.files?.[0]
    event.target.value = ''
    if (!ficheiro) return

    setErro('')
    setUploading(true)
    try {
      const url = await uploadFicheiro(ficheiro, 'materiais')
      setFormData((prev) => ({ ...prev, url }))
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.url.trim()) {
      alert('O título e a ligação/ficheiro são obrigatórios.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      const proximaOrdem =
        itens.reduce((max, i) => Math.max(max, i.ordem || 0), 0) + 1
      await createAdminMaterial({
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao,
        url: formData.url,
        ordem: proximaOrdem,
      })
      setModalOpen(false)
      setFormData({ tipo: 'atalho', titulo: '', descricao: '', url: '' })
      await carregar()
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Paperclip className="w-5 h-5" />}
        title="Materiais & Atalhos"
        description="Documentos para descarregar e ligações rápidas exibidos na secção pública do site."
        actions={
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Adicionar Item
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
            A carregar os materiais e atalhos…
          </p>
        </Card>
      ) : itens.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={<Paperclip className="w-10 h-10" />}
            title="Sem materiais nem atalhos."
            description="Adiciona o primeiro item para o mostrar no site."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
                <tr className="border-b border-slate-800/60">
                  <th className="px-5 py-3 font-bold">Item</th>
                  <th className="px-5 py-3 font-bold">Tipo</th>
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
                    <td className="px-5 py-3 max-w-xl">
                      <div className="flex items-start gap-3">
                        <span className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                          {item.tipo === 'material' ? (
                            <Download className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{item.titulo}</p>
                          {item.descricao && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.descricao}</p>
                          )}
                          <p className="text-[11px] text-slate-600 font-mono truncate mt-1">{item.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={item.tipo === 'material' ? 'cyan' : 'neutral'}>
                        {item.tipo === 'material' ? 'Material' : 'Atalho'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={item.visivel ? 'success' : 'neutral'}>
                        {item.visivel ? 'Público' : 'Oculto'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(item)}
                          title={item.visivel ? 'Ocultar' : 'Exibir'}
                          aria-label={item.visivel ? 'Ocultar' : 'Exibir'}
                          icon={
                            item.visivel ? (
                              <Eye className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )
                          }
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          title="Remover"
                          aria-label="Remover"
                          icon={<Trash2 className="w-4 h-4" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Adicionar Item */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar a Materiais & Atalhos"
        description="Materiais são descarregados; atalhos abrem uma ligação externa."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {saving ? 'A guardar…' : 'Adicionar'}
            </Button>
          </>
        }
      >
        <div>
          <label className={labelClasses}>Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'material' | 'atalho' })}
            className={fieldClasses}
          >
            <option value="atalho">Atalho (ligação externa)</option>
            <option value="material">Material (ficheiro para descarregar)</option>
          </select>
        </div>

        <div>
          <label className={labelClasses} htmlFor="mat-titulo">Título</label>
          <input
            id="mat-titulo"
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ex: Programa da Conferência, Abrir no Mapa…"
            className={fieldClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="mat-descricao">Descrição (opcional)</label>
          <input
            id="mat-descricao"
            type="text"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Texto curto exibido no site"
            className={fieldClasses}
          />
        </div>

        {formData.tipo === 'material' && (
          <div className="space-y-2">
            <span className={labelClasses}>Ficheiro</span>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl hover:border-cyan-400/50 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Upload className="w-4 h-4 flex-shrink-0" />
              )}
              {uploading ? 'A carregar para o Supabase…' : 'Carregar ficheiro'}
            </button>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              PDF, Word, Excel, PowerPoint, ZIP ou TXT até 20 MB · guardado no Supabase Storage.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
              onChange={handleUploadFicheiro}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}

        <div>
          <label className={labelClasses} htmlFor="mat-url">
            {formData.tipo === 'material' ? 'Ligação do ficheiro' : 'URL do atalho'}
          </label>
          <input
            id="mat-url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder={formData.tipo === 'material' ? 'https://… (preenchido ao carregar o ficheiro)' : 'https://…'}
            className={fieldClasses}
          />
        </div>
      </Modal>
    </div>
  )
}
