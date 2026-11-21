import React, { useEffect, useState } from 'react'
import {
  ListTree,
  Plus,
  CheckCircle,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  Save,
  ChevronRight,
} from 'lucide-react'
import { SecaoConteudo, SecaoItem } from '../../types/database'
import { fetchAdminSecoes, saveAdminSecaoBloco } from '../../services/adminDataService'
import { PageHeader, Card, Badge, Button, EmptyState, Modal, ImageUploadField, fieldClasses, labelClasses } from './ui'

interface CampoDef { key: string; label: string; longo?: boolean; imagem?: boolean }
interface ListaDef { key: string; label: string; ajuda?: string }
interface BlocoDef {
  chave: string
  tituloAdmin: string
  descricaoAdmin: string
  campos?: CampoDef[]
  listas?: ListaDef[]
  itens?: { comSelo: boolean; rotuloSelo?: string }
}

const BLOCOS: BlocoDef[] = [
  {
    chave: 'navegacao', tituloAdmin: 'Navegação & Marca', descricaoAdmin: 'Wordmark do topo e rótulos do menu.',
    campos: [
      { key: 'marca', label: 'Marca (wordmark)' },
      { key: 'nav_visao', label: 'Menu · Propósito' },
      { key: 'nav_programacao', label: 'Menu · Programação' },
      { key: 'nav_oradoras', label: 'Menu · Oradoras' },
      { key: 'nav_parcerias', label: 'Menu · Parcerias' },
      { key: 'nav_logistica', label: 'Menu · Acesso' },
      { key: 'nav_galeria', label: 'Menu · Galeria' },
      { key: 'nav_materiais', label: 'Menu · Materiais' },
    ],
  },
  {
    chave: 'hero', tituloAdmin: 'Hero — textos extra', descricaoAdmin: 'Slogan fixo e itens fixos do marquee.',
    campos: [{ key: 'slogan', label: 'Slogan (citação sob o título)', longo: true }],
    listas: [{ key: 'marquee_fixos', label: 'Itens fixos do marquee', ajuda: 'Um por linha (ex.: FORMATO PRESENCIAL)' }],
  },
  {
    chave: 'visao', tituloAdmin: 'Visão — citação', descricaoAdmin: 'Bloco "Tema Oficial" com citação e texto de apoio.',
    campos: [
      { key: 'selo_tema', label: 'Etiqueta (ex.: Tema Oficial 2026)' },
      { key: 'imagem_url', label: 'Imagem do cartão', imagem: true },
      { key: 'citacao', label: 'Citação', longo: true },
      { key: 'citacao_apoio', label: 'Texto de apoio', longo: true },
    ],
  },
  {
    chave: 'componentes', tituloAdmin: 'Componentes da Experiência', descricaoAdmin: 'Os 3 pilares da secção Propósito.',
    itens: { comSelo: false },
  },
  {
    chave: 'eixos', tituloAdmin: 'Eixos Temáticos & Resultados', descricaoAdmin: 'Blocos de "O que vais construir na conferência".',
    itens: { comSelo: true, rotuloSelo: 'Selo / tema (ex.: Liderança)' },
  },
  {
    chave: 'parcerias', tituloAdmin: 'Parcerias — cotas e dossier', descricaoAdmin: 'Cotas de patrocínio, textos e formulário de dossier.',
    campos: [
      { key: 'h2_titulo', label: 'Título da secção', longo: true },
      { key: 'h2_descricao', label: 'Descrição da secção', longo: true },
      { key: 'dossier_titulo', label: 'Etiqueta do dossier' },
      { key: 'dossier_subtitulo', label: 'Título do dossier' },
      { key: 'dossier_texto', label: 'Texto do dossier', longo: true },
      { key: 'lbl_empresa', label: 'Campo · Empresa' },
      { key: 'lbl_responsavel', label: 'Campo · Responsável' },
      { key: 'lbl_contacto', label: 'Campo · Telefone/WhatsApp' },
      { key: 'lbl_categoria', label: 'Campo · Categoria' },
      { key: 'lbl_mensagem', label: 'Campo · Mensagem' },
      { key: 'ph_empresa', label: 'Placeholder · Empresa' },
      { key: 'ph_responsavel', label: 'Placeholder · Responsável' },
      { key: 'ph_contacto', label: 'Placeholder · Contacto' },
      { key: 'ph_mensagem', label: 'Placeholder · Mensagem', longo: true },
      { key: 'btn_dossier', label: 'Botão do formulário' },
      { key: 'msg_sucesso', label: 'Mensagem de sucesso ({responsavel}, {categoria})', longo: true },
      { key: 'btn_novo_pedido', label: 'Botão "enviar outro pedido"' },
      { key: 'pedido_registado', label: 'Texto "pedido registado"' },
    ],
    itens: { comSelo: true, rotuloSelo: 'Subtítulo da cota (ex.: Patrocinador principal)' },
  },
  {
    chave: 'logistica', tituloAdmin: 'Logística — parágrafo e etiquetas', descricaoAdmin: 'Texto introdutório e etiquetas dos dados do evento.',
    campos: [
      { key: 'paragrafo', label: 'Parágrafo ({vagas} = total de vagas)', longo: true },
      { key: 'lbl_data', label: 'Etiqueta · Data' },
      { key: 'lbl_horario', label: 'Etiqueta · Horário' },
      { key: 'lbl_local', label: 'Etiqueta · Local' },
      { key: 'lbl_capacidade', label: 'Etiqueta · Capacidade' },
      { key: 'lbl_lote', label: 'Etiqueta · Lote atual' },
      { key: 'formato_presencial', label: 'Texto "Presencial"' },
      { key: 'formato_gratuito', label: 'Texto "Gratuita"' },
    ],
  },
  {
    chave: 'inscricao', tituloAdmin: 'Inscrição — formulário e sucesso', descricaoAdmin: 'Textos do formulário, estados e bilhete.',
    campos: [
      { key: 'lbl_nome', label: 'Campo · Nome' }, { key: 'ph_nome', label: 'Placeholder · Nome' },
      { key: 'lbl_whatsapp', label: 'Campo · Telefone/WhatsApp' }, { key: 'ph_whatsapp', label: 'Placeholder · Telefone' },
      { key: 'lbl_email', label: 'Campo · E-mail' }, { key: 'ph_email', label: 'Placeholder · E-mail' },
      { key: 'help_opcional', label: 'Ajuda "Opcional"' },
      { key: 'lbl_igreja', label: 'Campo · Igreja' }, { key: 'ph_igreja', label: 'Placeholder · Igreja' },
      { key: 'lbl_municipio', label: 'Campo · Município' }, { key: 'ph_municipio', label: 'Placeholder · Município' },
      { key: 'lbl_faixa', label: 'Campo · Faixa etária' },
      { key: 'lbl_como_soube', label: 'Campo · Como soubeste' },
      { key: 'lbl_recomendacao', label: 'Campo · Recomendação' }, { key: 'ph_recomendacao', label: 'Placeholder · Recomendação', longo: true },
      { key: 'lbl_expectativa', label: 'Campo · Expectativa' }, { key: 'ph_expectativa', label: 'Placeholder · Expectativa', longo: true },
      { key: 'lbl_observacoes', label: 'Campo · Observações' }, { key: 'ph_observacoes', label: 'Placeholder · Observações', longo: true },
      { key: 'termos_texto', label: 'Texto do consentimento', longo: true },
      { key: 'btn_enviando', label: 'Botão (a enviar)' },
      { key: 'btn_aberto', label: 'Botão (inscrições abertas)' },
      { key: 'btn_fechado', label: 'Botão (lista de espera)' },
      { key: 'nota_confirmacao', label: 'Nota · confirmação' },
      { key: 'nota_vagas', label: 'Nota · vagas' },
      { key: 'aviso_convidada', label: 'Aviso de convite', longo: true },
      { key: 'sucesso_eyebrow', label: 'Sucesso · etiqueta' },
      { key: 'sucesso_titulo', label: 'Sucesso · título' },
      { key: 'sucesso_texto', label: 'Sucesso · texto ({data}, {local})', longo: true },
      { key: 'btn_exportar', label: 'Botão · Exportar' },
      { key: 'btn_exportando', label: 'Botão · A exportar' },
      { key: 'btn_partilhar', label: 'Botão · Partilhar' },
      { key: 'btn_partilhado', label: 'Botão · Link copiado' },
      { key: 'btn_wa', label: 'Botão · WhatsApp' },
      { key: 'btn_outra', label: 'Botão · Inscrever outra' },
      { key: 'btn_preview', label: 'Botão · Preview bilhete' },
      { key: 'lbl_bilhete_nome', label: 'Bilhete · Nome' },
      { key: 'lbl_bilhete_telefone', label: 'Bilhete · Telefone' },
      { key: 'lbl_bilhete_email', label: 'Bilhete · E-mail' },
      { key: 'lbl_bilhete_igreja', label: 'Bilhete · Igreja' },
      { key: 'lbl_bilhete_municipio', label: 'Bilhete · Município' },
      { key: 'lbl_bilhete_faixa', label: 'Bilhete · Faixa etária' },
      { key: 'lbl_bilhete_numero', label: 'Bilhete · Nº inscrição' },
    ],
    listas: [
      { key: 'opcoes_faixa', label: 'Opções · Faixa etária', ajuda: 'Uma por linha, formato "valor=etiqueta"' },
      { key: 'opcoes_como_soube', label: 'Opções · Como soubeste', ajuda: 'Uma por linha, formato "valor=etiqueta"' },
    ],
  },
  {
    chave: 'footer', tituloAdmin: 'Rodapé — contactos e copyright', descricaoAdmin: 'Contactos, redes sociais e linha de copyright.',
    campos: [
      { key: 'lbl_atendimento', label: 'Etiqueta · Atendimento' },
      { key: 'lbl_ligacoes', label: 'Etiqueta · Ligações' },
      { key: 'fone_display', label: 'Telefone (exibição)' },
      { key: 'fone_href', label: 'Telefone (link tel:)' },
      { key: 'email_display', label: 'E-mail (exibição)' },
      { key: 'email_href', label: 'E-mail (link mailto:)' },
      { key: 'ig_url', label: 'URL Instagram' },
      { key: 'ig_label', label: 'Etiqueta Instagram' },
      { key: 'fb_url', label: 'URL Facebook' },
      { key: 'fb_label', label: 'Etiqueta Facebook' },
      { key: 'voltar_topo', label: 'Botão "voltar ao topo"' },
      { key: 'morada', label: 'Morada / Local (abaixo do título)' },
      { key: 'copyright', label: 'Copyright ({ano} = ano atual)', longo: true },
    ],
  },
  {
    chave: 'termos', tituloAdmin: 'Termos & Privacidade', descricaoAdmin: 'Secções da página /termos.',
    campos: [
      { key: 'email_contacto', label: 'E-mail de contacto' },
      { key: 'data_atualizacao', label: 'Data da última actualização (ex.: Agosto 2026)' },
    ],
    itens: { comSelo: false },
  },
]

const itemVazio = (): SecaoItem => ({ numero: '', selo: '', titulo: '', descricao: '' })

export default function BlocosSitePage() {
  const [secoes, setSecoes] = useState<Record<string, SecaoConteudo>>({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  // rascunho local por chave: { campos, listas, itens }
  const [drafts, setDrafts] = useState<Record<string, { campos: Record<string, string>; listas: Record<string, string[]>; itens: SecaoItem[] }>>({})

  const [modal, setModal] = useState<{ chave: string; index: number | null } | null>(null)
  const [draftItem, setDraftItem] = useState<SecaoItem>(itemVazio())
  const [chaveAtiva, setChaveAtiva] = useState(BLOCOS[0].chave)

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      const todas = await fetchAdminSecoes()
      const mapa: Record<string, SecaoConteudo> = {}
      const novosDrafts: typeof drafts = {}
      todas.forEach((s) => {
        mapa[s.chave] = s
        novosDrafts[s.chave] = {
          campos: { ...(s.campos || {}) },
          listas: Object.fromEntries(Object.entries(s.listas || {}).map(([k, v]) => [k, [...v]])),
          itens: (s.itens || []).map((i) => ({ ...i })),
        }
      })
      setSecoes(mapa)
      setDrafts(novosDrafts)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const draftDe = (chave: string) =>
    drafts[chave] || { campos: {}, listas: {}, itens: [] }

  const setDraft = (chave: string, patch: Partial<ReturnType<typeof draftDe>>) =>
    setDrafts((prev) => ({
      ...prev,
      [chave]: { ...(prev[chave] || { campos: {}, listas: {}, itens: [] }), ...patch },
    }))

  const persistirItens = async (chave: string, itens: SecaoItem[]) => {
    setSaving(chave)
    setErro('')
    setSucesso('')
    try {
      await saveAdminSecaoBloco(chave, { itens })
      setSecoes((prev) =>
        prev[chave] ? { ...prev, [chave]: { ...prev[chave], itens } } : prev
      )
      setDrafts((prev) => ({
        ...prev,
        [chave]: {
          ...(prev[chave] || { campos: {}, listas: {}, itens: [] }),
          itens: itens.map((item) => ({ ...item })),
        },
      }))
      const nome = BLOCOS.find((b) => b.chave === chave)?.tituloAdmin || chave
      setSucesso(`"${nome}" guardado no site.`)
      setTimeout(() => setSucesso(''), 5000)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  const handleGuardar = async (chave: string) => {
    setSaving(chave)
    setErro('')
    setSucesso('')
    try {
      const d = draftDe(chave)
      await saveAdminSecaoBloco(chave, { campos: d.campos, listas: d.listas, itens: d.itens })
      await carregar()
      const nome = BLOCOS.find((b) => b.chave === chave)?.tituloAdmin || chave
      setSucesso(`"${nome}" guardado no site.`)
      setTimeout(() => setSucesso(''), 5000)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  // ---------- itens ----------
  const abrirNovoItem = (chave: string, comSelo: boolean) => {
    const itens = draftDe(chave).itens
    const ultimo = itens[itens.length - 1]
    setDraftItem({ numero: ultimo?.numero ? String(Number(ultimo.numero) + 1).padStart(2, '0') : '01', selo: '', titulo: '', descricao: '' })
    setModal({ chave, index: null })
    void comSelo
  }
  const abrirEdicaoItem = (chave: string, index: number) => {
    setDraftItem({ ...draftDe(chave).itens[index] })
    setModal({ chave, index })
  }
  const handleGuardarItem = async () => {
    if (!modal) return
    if (!draftItem.titulo.trim()) { alert('O título do item é obrigatório.'); return }
    const { chave, index } = modal
    const d = draftDe(chave)
    const itens = [...d.itens]
    const item: SecaoItem = {
      numero: draftItem.numero.trim() || String((index ?? itens.length) + 1).padStart(2, '0'),
      selo: draftItem.selo?.trim() || undefined,
      titulo: draftItem.titulo.trim(),
      descricao: draftItem.descricao.trim(),
    }
    if (index === null) itens.push(item); else itens[index] = item
    setDraft(chave, { itens })
    setModal(null)
    await persistirItens(chave, itens)
  }
  const handleRemoverItem = async (chave: string, index: number) => {
    const d = draftDe(chave)
    const alvo = d.itens[index]
    if (!window.confirm(`Remover "${alvo.titulo}"?`)) return
    const itens = d.itens.filter((_, i) => i !== index)
    setDraft(chave, { itens })
    await persistirItens(chave, itens)
  }
  const handleMoverItem = async (chave: string, index: number, direcao: -1 | 1) => {
    const d = draftDe(chave)
    const itens = [...d.itens]
    const alvo = index + direcao
    if (alvo < 0 || alvo >= itens.length) return
    ;[itens[index], itens[alvo]] = [itens[alvo], itens[index]]
    setDraft(chave, { itens })
    await persistirItens(chave, itens)
  }

  const dirty = (chave: string) => {
    const s = secoes[chave]
    const d = draftDe(chave)
    if (!s) return false
    return JSON.stringify({ c: s.campos || {}, l: s.listas || {}, i: s.itens || [] }) !==
      JSON.stringify({ c: d.campos, l: d.listas, i: d.itens })
  }

  if (loading) {
    return (
      <Card className="p-5">
        <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />A carregar os blocos…</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ListTree className="w-5 h-5" />}
        title="Blocos & Listas do Site"
        description="Todos os textos, opções e listas do site público. Os títulos/subtítulos das secções continuam em Conteúdo Site."
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">{sucesso}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
        <Card className="overflow-hidden flex flex-col xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
            <div>
              <p className="text-sm font-bold text-slate-100">Secções do site</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Escolhe um bloco para editar à direita</p>
            </div>
            <Badge tone="neutral">{BLOCOS.length}</Badge>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {BLOCOS.map((item) => {
              const isActive = item.chave === chaveAtiva
              const temAlteracoes = dirty(item.chave)
              const existe = Boolean(secoes[item.chave])

              return (
                <button
                  key={item.chave}
                  type="button"
                  onClick={() => setChaveAtiva(item.chave)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? 'border-cyan-500/30 bg-cyan-500/10'
                      : 'border-transparent hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-[13px] font-semibold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {item.tituloAdmin}
                        </span>
                        {temAlteracoes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Alterações por guardar" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.descricaoAdmin}</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </span>
                  <span className="mt-2 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-600">#{item.chave}</span>
                    {!existe && <Badge tone="warning">Sem registo</Badge>}
                  </span>
                </button>
              )
            })}
          </nav>
        </Card>

        <div className="min-w-0 space-y-6">
          {BLOCOS.filter((bloco) => bloco.chave === chaveAtiva).map((bloco) => {
        const secao = secoes[bloco.chave]
        const d = draftDe(bloco.chave)
        const aGuardar = saving === bloco.chave

        return (
          <Card key={bloco.chave} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-100">{bloco.tituloAdmin}</h3>
                  <Badge tone="neutral" className="font-mono">#{bloco.chave}</Badge>
                  {secao && (
                    <Badge tone={secao.visivel ? 'success' : 'neutral'}>
                      {secao.visivel ? 'Secção ativa' : 'Secção oculta'}
                    </Badge>
                  )}
                  {aGuardar && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{bloco.descricaoAdmin}</p>
              </div>
              <Button size="sm" onClick={() => handleGuardar(bloco.chave)} loading={aGuardar} disabled={!dirty(bloco.chave)} icon={<Save className="w-3.5 h-3.5" />}>
                Guardar
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {!secao && (
                <p className="text-xs text-amber-400">Esta secção ainda não existe na base de dados — corre a migração 028 no Supabase.</p>
              )}

              {/* Campos de texto */}
              {bloco.campos && bloco.campos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bloco.campos.map((campo) => (
                    <div key={campo.key} className={campo.longo || campo.imagem ? 'md:col-span-2' : ''}>
                      {campo.imagem ? (
                        <ImageUploadField
                          id={`campo-${bloco.chave}-${campo.key}`}
                          label={campo.label}
                          pasta={`secao-${bloco.chave}`}
                          semLigacao
                          value={d.campos[campo.key] || ''}
                          onChange={(url) =>
                            setDraft(bloco.chave, { campos: { ...d.campos, [campo.key]: url } })
                          }
                        />
                      ) : (
                        <>
                          <label className={labelClasses}>{campo.label}</label>
                          {campo.longo ? (
                            <textarea
                              rows={3}
                              value={d.campos[campo.key] || ''}
                              onChange={(e) => setDraft(bloco.chave, { campos: { ...d.campos, [campo.key]: e.target.value } })}
                              className={`${fieldClasses} resize-none`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={d.campos[campo.key] || ''}
                              onChange={(e) => setDraft(bloco.chave, { campos: { ...d.campos, [campo.key]: e.target.value } })}
                              className={fieldClasses}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Listas de opções (uma por linha, "valor=etiqueta") */}
              {bloco.listas && bloco.listas.map((lista) => {
                const valor = (d.listas[lista.key] || []).join('\n')
                return (
                  <div key={lista.key}>
                    <label className={labelClasses}>{lista.label}</label>
                    {lista.ajuda && <p className="text-[11px] text-slate-500 mb-1.5">{lista.ajuda}</p>}
                    <textarea
                      rows={4}
                      value={valor}
                      onChange={(e) =>
                        setDraft(bloco.chave, {
                          listas: { ...d.listas, [lista.key]: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) },
                        })
                      }
                      className={`${fieldClasses} font-mono resize-none`}
                      placeholder={'valor=etiqueta\nvalor2=etiqueta2'}
                    />
                  </div>
                )
              })}

              {/* Itens estruturados */}
              {bloco.itens && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={labelClasses + ' mb-0'}>Itens ({d.itens.length})</p>
                    <Button size="sm" variant="secondary" onClick={() => abrirNovoItem(bloco.chave, bloco.itens!.comSelo)} icon={<Plus className="w-3.5 h-3.5" />}>
                      Adicionar item
                    </Button>
                  </div>
                  {d.itens.length === 0 ? (
                    <EmptyState icon={<ListTree className="w-8 h-8" />} title="Sem itens." description="Adiciona o primeiro item." />
                  ) : (
                    <div className="space-y-2">
                      {d.itens.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 tabular-nums">
                              {item.numero || index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {item.titulo}
                                {item.selo && <span className="ml-2 text-[11px] font-medium text-[#B95E26]">· {item.selo}</span>}
                              </p>
                              {item.descricao && <p className="text-xs text-slate-500 truncate mt-0.5">{item.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleMoverItem(bloco.chave, index, -1)} disabled={index === 0} title="Subir" aria-label="Subir" icon={<ArrowUp className="w-4 h-4" />} />
                            <Button variant="ghost" size="sm" onClick={() => handleMoverItem(bloco.chave, index, 1)} disabled={index === d.itens.length - 1} title="Descer" aria-label="Descer" icon={<ArrowDown className="w-4 h-4" />} />
                            <Button variant="ghost" size="sm" onClick={() => abrirEdicaoItem(bloco.chave, index)} title="Editar" aria-label="Editar" icon={<Pencil className="w-4 h-4" />} />
                            <Button variant="danger" size="sm" onClick={() => handleRemoverItem(bloco.chave, index)} title="Remover" aria-label="Remover" icon={<Trash2 className="w-4 h-4" />} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )
          })}
        </div>
      </div>

      {/* Modal item */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.index === null ? 'Adicionar item' : 'Editar item'}
        description={modal ? BLOCOS.find((b) => b.chave === modal.chave)?.descricaoAdmin : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleGuardarItem}>Guardar item</Button>
          </>
        }
      >
        {modal && (() => {
          const cfg = BLOCOS.find((b) => b.chave === modal.chave)?.itens
          if (!cfg) return null
          return (
          <>
            <div>
              <label className={labelClasses}>Número / ordem</label>
              <input type="text" value={draftItem.numero} onChange={(e) => setDraftItem({ ...draftItem, numero: e.target.value })} placeholder="Ex: 01" className={fieldClasses} />
            </div>
            {cfg.comSelo && (
              <div>
                <label className={labelClasses}>{cfg.rotuloSelo}</label>
                <input type="text" value={draftItem.selo || ''} onChange={(e) => setDraftItem({ ...draftItem, selo: e.target.value })} placeholder="Ex: Liderança" className={fieldClasses} />
              </div>
            )}
            <div>
              <label className={labelClasses}>Título</label>
              <input type="text" value={draftItem.titulo} onChange={(e) => setDraftItem({ ...draftItem, titulo: e.target.value })} className={fieldClasses} />
            </div>
            <div>
              <label className={labelClasses}>Descrição</label>
              <textarea rows={3} value={draftItem.descricao} onChange={(e) => setDraftItem({ ...draftItem, descricao: e.target.value })} className={`${fieldClasses} resize-none`} />
            </div>
          </>
          )
        })()}
      </Modal>
    </div>
  )
}
