import React, { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Eye,
  EyeOff,
  Save,
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import { SecaoConteudo } from '../../types/database'
import {
  fetchAdminSecoes,
  saveAdminSecao,
  toggleAdminSecaoVisibilidade,
} from '../../services/adminDataService'
import { PageHeader, Card, Badge, Button, EmptyState, fieldClasses, labelClasses } from './ui'

export default function ConteudoAdminPage() {
  const [secoes, setSecoes] = useState<SecaoConteudo[]>([])
  const [secaoSelecionadaId, setSecaoSelecionadaId] = useState<string | null>(null)

  const [draftTitulo, setDraftTitulo] = useState('')
  const [draftSubtitulo, setDraftSubtitulo] = useState('')
  const [draftDescricao, setDraftDescricao] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setErro('')
      try {
        const data = await fetchAdminSecoes()
        setSecoes(data)
        if (data.length > 0) {
          const primeira = data[0]
          setSecaoSelecionadaId(primeira.id)
          setDraftTitulo(primeira.titulo)
          setDraftSubtitulo(primeira.subtitulo || '')
          setDraftDescricao(primeira.descricao)
        }
      } catch (err) {
        setErro((err as Error).message)
      }
    }
    load()
  }, [])

  const secaoSelecionada = useMemo(
    () => secoes.find((secao) => secao.id === secaoSelecionadaId) || null,
    [secoes, secaoSelecionadaId]
  )

  const dirty = useMemo(() => {
    if (!secaoSelecionada) return false
    return (
      draftTitulo.trim() !== secaoSelecionada.titulo.trim() ||
      draftSubtitulo.trim() !== (secaoSelecionada.subtitulo || '').trim() ||
      draftDescricao !== secaoSelecionada.descricao
    )
  }, [secaoSelecionada, draftTitulo, draftSubtitulo, draftDescricao])

  const handleSelecionar = (secao: SecaoConteudo) => {
    setSecaoSelecionadaId(secao.id)
    setDraftTitulo(secao.titulo)
    setDraftSubtitulo(secao.subtitulo || '')
    setDraftDescricao(secao.descricao)
    setErro('')
  }

  const handleToggle = async (id: string) => {
    const sec = secoes.find((s) => s.id === id)
    if (!sec) return
    const nextVis = !sec.visivel
    const anterior = sec.visivel
    setSecoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visivel: nextVis } : s))
    )
    setErro('')
    try {
      await toggleAdminSecaoVisibilidade(sec.chave, nextVis)
      setSaveSuccess('Visibilidade alterada com sucesso.')
      setTimeout(() => setSaveSuccess(''), 2000)
    } catch (err) {
      setSecoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, visivel: anterior } : s))
      )
      setErro((err as Error).message)
    }
  }

  const handleSave = async () => {
    if (!secaoSelecionada) return

    if (!draftTitulo.trim()) {
      setErro('O título da secção é obrigatório.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      await saveAdminSecao(
        secaoSelecionada.chave,
        draftTitulo.trim(),
        draftSubtitulo.trim(),
        draftDescricao
      )
      setSecoes((prev) =>
        prev.map((s) =>
          s.id === secaoSelecionada.id
            ? {
                ...s,
                titulo: draftTitulo.trim(),
                subtitulo: draftSubtitulo.trim(),
                descricao: draftDescricao,
                ultimaAtualizacao: new Date().toISOString(),
              }
            : s
        )
      )
      setSaveSuccess('Conteúdo atualizado com sucesso.')
      setTimeout(() => setSaveSuccess(''), 2000)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="w-5 h-5" />}
        title="Gestão de Conteúdo e Visibilidade do Site"
        description="Controlo dos textos das secções da landing page e interruptores de exibição pública."
        actions={
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-400/40 hover:text-white text-slate-200 text-xs font-semibold rounded-xl transition-colors w-fit"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Ver Site Público
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        }
      />

      {saveSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {saveSuccess}
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
          {erro}
        </div>
      )}

      {secoes.length === 0 ? (
        <Card className="p-5">
          <EmptyState icon={<FileText className="w-8 h-8" />} title="Nenhuma secção encontrada" />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
          <Card className="overflow-hidden flex flex-col xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)]">
            <div className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
              <p className="text-sm font-bold text-slate-100">Secções públicas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Seleciona uma secção para editar os textos</p>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {secoes.map((secao) => {
                const isActive = secao.id === secaoSelecionadaId
                return (
                  <button
                    key={secao.id}
                    type="button"
                    onClick={() => handleSelecionar(secao)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'border-cyan-500/30 bg-cyan-500/10'
                        : 'border-transparent hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13px] font-semibold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {secao.titulo || 'Secção sem título'}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-slate-500">
                          #{secao.ordem} · {secao.chave}
                        </span>
                      </span>
                      <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                    </span>
                    <span className="mt-2 flex items-center gap-1.5">
                      <Badge tone={secao.visivel ? 'success' : 'neutral'}>
                        {secao.visivel ? 'Ativa' : 'Oculta'}
                      </Badge>
                    </span>
                  </button>
                )
              })}
            </nav>
          </Card>

          {secaoSelecionada && (
            <Card className="overflow-hidden min-w-0">
              <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="neutral" className="font-mono">#{secaoSelecionada.ordem}</Badge>
                    <Badge tone="info" className="font-mono">{secaoSelecionada.chave}</Badge>
                    {dirty && <Badge tone="warning">Alterações por guardar</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1.5">
                    Atualizado: {secaoSelecionada.ultimaAtualizacao}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant={secaoSelecionada.visivel ? 'success' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggle(secaoSelecionada.id)}
                    icon={secaoSelecionada.visivel ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  >
                    {secaoSelecionada.visivel ? 'Secção Ativa' : 'Ocultada'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!dirty}
                    icon={<Save className="w-3.5 h-3.5" />}
                  >
                    Guardar
                  </Button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="conteudo-titulo" className={labelClasses}>Título</label>
                  <input
                    id="conteudo-titulo"
                    type="text"
                    value={draftTitulo}
                    onChange={(e) => setDraftTitulo(e.target.value)}
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label htmlFor="conteudo-subtitulo" className={labelClasses}>Subtítulo</label>
                  <input
                    id="conteudo-subtitulo"
                    type="text"
                    value={draftSubtitulo}
                    onChange={(e) => setDraftSubtitulo(e.target.value)}
                    placeholder="Linha secundária apresentada sob o título"
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label htmlFor="conteudo-descricao" className={labelClasses}>Descrição</label>
                  <textarea
                    id="conteudo-descricao"
                    rows={8}
                    value={draftDescricao}
                    onChange={(e) => setDraftDescricao(e.target.value)}
                    className={`${fieldClasses} resize-none`}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
