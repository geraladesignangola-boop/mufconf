import React, { useEffect, useState } from 'react'
import {
  Award,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import {
  AdminLogoParceiro,
  fetchAdminLogos,
  createAdminLogo,
  setAdminLogoVisivel,
  deleteAdminLogo,
} from '../../services/adminContentService'
import { removerImagem } from '../../services/adminStorageService'
import { resolveImageUrl } from '../../services/imageUrlService'
import { PageHeader, Card, Badge, Button, EmptyState, ImageUploadField, fieldClasses, labelClasses } from './ui'

export default function LogosParceirosPage() {
  const [logos, setLogos] = useState<AdminLogoParceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    logoUrl: '',
    posicao: 'Secção Parceiros' as 'Hero' | 'Rodapé' | 'Secção Parceiros',
  })

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setLogos(await fetchAdminLogos())
    } catch (err) {
      setErro((err as Error).message)
      setLogos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleToggle = async (logo: AdminLogoParceiro) => {
    const novoEstado = !logo.visivel
    setLogos((prev) =>
      prev.map((l) => (l.id === logo.id ? { ...l, visivel: novoEstado } : l))
    )
    try {
      await setAdminLogoVisivel(logo.id, novoEstado)
    } catch (err) {
      setErro((err as Error).message)
      setLogos((prev) =>
        prev.map((l) => (l.id === logo.id ? { ...l, visivel: logo.visivel } : l))
      )
    }
  }

  const handleDelete = async (logo: AdminLogoParceiro) => {
    if (!window.confirm('Remover este logótipo?')) return
    try {
      await deleteAdminLogo(logo.id)
      await removerImagem(logo.logoUrl)
      setLogos((prev) => prev.filter((l) => l.id !== logo.id))
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.logoUrl.trim()) {
      alert('Nome e imagem (carregada ou por ligação) são obrigatórios.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      const proximaOrdem =
        logos.reduce((max, l) => Math.max(max, l.ordem || 0), 0) + 1
      await createAdminLogo({ ...formData, ordem: proximaOrdem })
      setModalOpen(false)
      setFormData({ nome: '', logoUrl: '', posicao: 'Secção Parceiros' })
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
        icon={<Award className="w-5 h-5" />}
        title="Logos de Parceiros & Marcas Oficiais"
        description="Gestão dos logotipos exibidos no rodapé, banner de patrocinadores e materiais da conferência."
        actions={
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Adicionar Logotipo
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
            A carregar os logótipos a partir do Supabase…
          </p>
        </Card>
      ) : logos.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={<ImageIcon className="w-10 h-10" />}
            title="Nenhum logotipo de parceiro."
            description="Adiciona o primeiro logotipo para começar."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className={`rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col ${
                logo.visivel ? '' : 'opacity-60'
              }`}
            >
              <div className="relative w-full h-32 bg-slate-950 border-b border-slate-800 flex items-center justify-center p-4 overflow-hidden group">
                <img
                  src={resolveImageUrl(logo.logoUrl)}
                  alt={logo.nome}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>

              <div className="p-5 flex-1">
                <h3 className="text-sm font-bold text-slate-100 truncate">{logo.nome}</h3>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <Badge tone="cyan">{logo.posicao}</Badge>
                  <Badge tone={logo.visivel ? 'success' : 'neutral'}>
                    {logo.visivel ? 'Ativo' : 'Oculto'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(logo)}
                    title={logo.visivel ? 'Ocultar' : 'Exibir'}
                    aria-label={logo.visivel ? 'Ocultar' : 'Exibir'}
                    icon={
                      logo.visivel ? (
                        <Eye className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )
                    }
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(logo)}
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

      {/* Modal Adicionar Logo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Adicionar Logotipo de Parceiro</h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Fechar diálogo"
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClasses}>Nome da Marca / Parceiro</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Banco Millennium Atlântico"
                  className={fieldClasses}
                />
              </div>

              <ImageUploadField
                id="logo-imagem"
                label="Logotipo"
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                pasta="logos"
                placeholder="https://… (ligação alternativa)"
              />

              <div>
                <label className={labelClasses}>Posicionamento no Site</label>
                <select
                  value={formData.posicao}
                  onChange={(e) => setFormData({ ...formData, posicao: e.target.value as any })}
                  className={fieldClasses}
                >
                  <option value="Secção Parceiros">Secção Parceiros (Principal)</option>
                  <option value="Hero">Hero (Topo com destaque)</option>
                  <option value="Rodapé">Rodapé</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {saving ? 'A adicionar…' : 'Adicionar Logo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
