import React, { useEffect, useState } from 'react'
import {
  FileImage,
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  Eye,
  FileCheck,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import {
  AdminCartaz,
  fetchAdminCartaz,
  createAdminCartaz,
  saveAdminCartaz,
} from '../../services/adminContentService'
import { PageHeader, Card, Badge, Button, EmptyState, ImageUploadField, fieldClasses, labelClasses } from './ui'
import { resolveImageUrl } from '../../services/imageUrlService'

export default function CartazAdminPage() {
  const [cartaz, setCartaz] = useState<AdminCartaz | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const [copiado, setCopiado] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [novoUrl, setNovoUrl] = useState('')
  const [novoTitulo, setNovoTitulo] = useState('')

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setCartaz(await fetchAdminCartaz())
    } catch (err) {
      setErro((err as Error).message)
      setCartaz(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirEdicao = () => {
    setNovoUrl(cartaz?.url || '')
    setNovoTitulo(cartaz?.titulo || '')
    setModalEditar(true)
  }

  const handleCopiarLink = () => {
    if (!cartaz) return
    // URLs do Supabase Storage são absolutas; apenas os caminhos locais precisam
    // do origin do site.
    const link = /^https?:\/\//i.test(cartaz.url)
      ? cartaz.url
      : window.location.origin + cartaz.url
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleSalvar = async () => {
    if (!novoUrl.trim() || !novoTitulo.trim()) {
      alert('Título e imagem (carregada ou por ligação) são obrigatórios.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      if (cartaz) {
        const atualizado: AdminCartaz = {
          ...cartaz,
          url: novoUrl.trim(),
          titulo: novoTitulo.trim(),
          atualizado_em: new Date().toISOString().slice(0, 10),
        }
        await saveAdminCartaz(atualizado)
        setCartaz(atualizado)
      } else {
        await createAdminCartaz({ url: novoUrl.trim(), titulo: novoTitulo.trim() })
        await carregar()
      }
      setModalEditar(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async () => {
    if (!cartaz) return
    const atualizado = { ...cartaz, ativo: !cartaz.ativo }
    setCartaz(atualizado)
    try {
      await saveAdminCartaz(atualizado)
    } catch (err) {
      setErro((err as Error).message)
      setCartaz(cartaz)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileImage className="w-5 h-5" />}
        title="Cartaz Oficial da Conferência"
        description="Gestão do cartaz principal de divulgação, controlo de versões para impressão e redes sociais."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={abrirEdicao}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {cartaz ? 'Substituir Cartaz' : 'Registar Cartaz'}
            </Button>
            {cartaz && (
              <a
                href={cartaz.url}
                download="Cartaz_Oficial_WEX_2026.png"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-400 text-slate-950 text-sm font-bold rounded-xl hover:bg-cyan-300 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                <Download className="w-4 h-4" />
                Baixar Original
              </a>
            )}
          </>
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
            A carregar o cartaz oficial a partir do Supabase…
          </p>
        </Card>
      ) : !cartaz ? (
        <Card className="p-5">
          <EmptyState
            icon={<FileImage className="w-10 h-10" />}
            title="Nenhum cartaz registado."
            description="Regista o cartaz oficial para o publicar no site."
          />
        </Card>
      ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {/* Preview do Cartaz */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Pré-visualização</h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Estado: {cartaz.ativo ? 'Publicado na Landing Page' : 'Rascunho Interno'}
            </span>
          </div>
          <div className="p-5 flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 p-4 shadow-2xl relative group">
              <img
                src={resolveImageUrl(cartaz.url)}
                alt={cartaz.titulo}
                className="w-full h-auto max-h-[460px] object-contain mx-auto filter drop-shadow-xl"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a
                  href={cartaz.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-cyan-400 text-slate-950 rounded-full font-bold shadow-lg"
                  title="Abrir em tamanho real"
                >
                  <Eye className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Ficha Técnica e Ações */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-100 truncate">{cartaz.titulo}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Atualizado a {cartaz.atualizado_em}</p>
              </div>
              <Badge tone="cyan" className="flex-shrink-0">
                Material Master de Divulgação
              </Badge>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">{cartaz.descricao}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resolução & Formato</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">{cartaz.resolucao}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Peso do Ficheiro</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">{cartaz.tamanho}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={handleCopiarLink}
                  icon={
                    copiado ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )
                  }
                >
                  {copiado ? 'Link Copiado!' : 'Copiar Link Público do Cartaz'}
                </Button>

                <Button
                  variant={cartaz.ativo ? 'success' : 'secondary'}
                  onClick={handleToggleAtivo}
                  icon={<FileCheck className="w-4 h-4" />}
                >
                  {cartaz.ativo ? 'Ativo no Site Público' : 'Desativado no Site'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                Diretrizes de Impressão e Comunicação
              </h3>
            </div>
            <div className="p-5">
              <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Para impressões na gráfica: utilizar perfil CMYK FOGRA39 com sangria de 3mm.</li>
                <li>Para redes sociais: partilhar a versão Web em formato 1080x1350px (Instagram Portrait).</li>
                <li>A preservação das datas e logos institucionais da Mediateca e A-Design é obrigatória.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* Modal Editar Cartaz */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Atualizar Cartaz Oficial"
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-100">Atualizar Cartaz Oficial</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Altera a imagem oficial ou o título do cartaz exibido na plataforma.
                </p>
              </div>
              <button
                onClick={() => setModalEditar(false)}
                aria-label="Fechar diálogo"
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelClasses}>Título do Cartaz</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className={fieldClasses}
                />
              </div>

              <ImageUploadField
                id="cartaz-imagem"
                label="Imagem do Cartaz"
                value={novoUrl}
                onChange={setNovoUrl}
                pasta="cartaz"
                placeholder="https://… (ligação alternativa)"
              />
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setModalEditar(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSalvar} loading={saving}>
                {saving ? 'A guardar…' : 'Salvar Atualização'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
