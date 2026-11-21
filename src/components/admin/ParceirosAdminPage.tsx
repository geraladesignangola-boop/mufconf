import React, { useEffect, useState } from 'react'
import {
  Handshake,
  Plus,
  Edit2,
  Trash2,
  XCircle,
  Building,
  Phone,
  Mail,
  X,
} from 'lucide-react'
import { Parceiro } from '../../types/database'
import {
  fetchAdminParceiros,
  saveAdminParceiro,
  deleteAdminParceiro,
} from '../../services/adminDataService'
import { removerImagem } from '../../services/adminStorageService'
import { PageHeader, Card, Badge, Button, EmptyState, fieldClasses, labelClasses } from './ui'

export default function ParceirosAdminPage() {
  const [parceiros, setParceiros] = useState<Parceiro>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Ouro' as 'Platina' | 'Ouro' | 'Prata' | 'Bronze' | 'Institucional',
    responsavel: '',
    contacto: '',
    email: '',
    contribuicao: '',
    estado: 'Pendente' as 'Confirmado' | 'Em análise' | 'Pendente' | 'Recusado',
  })

  useEffect(() => {
    async function load() {
      setErro('')
      try {
        const data = await fetchAdminParceiros()
        setParceiros(data)
      } catch (err) {
        setErro(
          (err as Error).message
        )
      }
    }
    load()
  }, [])

  const handleOpenCreate = () => {
    setEditingParceiro(null)
    setFormData({
      nome: '',
      categoria: 'Ouro',
      responsavel: '',
      contacto: '',
      email: '',
      contribuicao: '',
      estado: 'Pendente',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (p: Parceiro) => {
    setEditingParceiro(p)
    setFormData({
      nome: p.nome,
      categoria: p.categoria,
      responsavel: p.responsavel || '',
      contacto: p.contacto,
      email: p.email || '',
      contribuicao: p.contribuicao || '',
      estado: p.estado,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert('Nome da entidade ou empresa é obrigatório.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      const ordem = editingParceiro
        ? editingParceiro.ordem
        : parceiros.reduce((max, p) => Math.max(max, p.ordem || 0), 0) + 1

      const guardado = await saveAdminParceiro({
        ...(editingParceiro || {}),
        ...formData,
        ordem,
        visivel: formData.estado === 'Confirmado',
      })

      setParceiros((prev) =>
        editingParceiro
          ? prev.map((p) => (p.id === editingParceiro.id ? guardado : p))
          : [...prev, guardado]
      )
      setModalOpen(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (parceiro: Parceiro) => {
    if (!window.confirm(`Tem a certeza que deseja remover a parceria com "${parceiro.nome}"?`)) {
      return
    }
    setErro('')
    try {
      await deleteAdminParceiro(parceiro.id)
      await removerImagem(parceiro.logoUrl || '')
      setParceiros((prev) => prev.filter((p) => p.id !== parceiro.id))
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Handshake className="w-5 h-5" />}
        title="Parceiros & Patrocinadores"
        description="Gestão das entidades apoiantes, contratos, categorias e propostas de contribuição."
        actions={
          <Button variant="primary" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            Registar Parceiro
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {parceiros.length === 0 ? (
        <EmptyState
          icon={<Handshake className="w-6 h-6" />}
          title="Sem parceiros registados."
          description="Regista a primeira parceria para começar."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parceiros.map((parceiro) => (
            <div key={parceiro.id}>
              <Card className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 flex-shrink-0">
                      <Building className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{parceiro.nome}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">Categoria {parceiro.categoria}</p>
                    </div>
                  </div>

                  <Badge
                    tone={
                      parceiro.estado === 'Confirmado'
                        ? 'success'
                        : parceiro.estado === 'Em análise'
                        ? 'cyan'
                        : 'neutral'
                    }
                  >
                    {parceiro.estado}
                  </Badge>
                </div>

                <div className="p-5 space-y-3">
                  {parceiro.contribuicao && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        <span className="font-bold text-slate-300">Contrapartida: </span>
                        {parceiro.contribuicao}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-slate-400">
                    {parceiro.responsavel && (
                      <p className="truncate">
                        <span className="text-slate-500">Resp: </span>
                        {parceiro.responsavel}
                      </p>
                    )}
                    {parceiro.contacto && (
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{parceiro.contacto}</span>
                      </p>
                    )}
                    {parceiro.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{parceiro.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950">
                  <span className="text-[11px] text-slate-500">Registo: {parceiro.criado_em}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(parceiro)}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(parceiro)}
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
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingParceiro ? 'Editar Parceiro' : 'Novo Parceiro'}
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
                <h3 className="text-sm font-bold text-slate-100">Entidade</h3>
                <div>
                  <label className={labelClasses}>Nome da Empresa / Organização</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Banco BAI, Sonangol, etc."
                    className={fieldClasses}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                      className={fieldClasses}
                    >
                      <option value="Platina">Platina</option>
                      <option value="Ouro">Ouro</option>
                      <option value="Prata">Prata</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Institucional">Institucional</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                      className={fieldClasses}
                    >
                      <option value="Confirmado">Confirmado</option>
                      <option value="Em análise">Em análise</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Recusado">Recusado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Contacto</h3>
                <div>
                  <label className={labelClasses}>Pessoa de Contacto / Responsável</label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Ex: Dra. Teresa Domingos"
                    className={fieldClasses}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.contacto}
                      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                      placeholder="+244 9..."
                      className={fieldClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="parcerias@empresa.ao"
                      className={fieldClasses}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Contribuição</h3>
                <div>
                  <label className={labelClasses}>Contribuição / Apoio Concedido</label>
                  <textarea
                    rows={2}
                    value={formData.contribuicao}
                    onChange={(e) => setFormData({ ...formData, contribuicao: e.target.value })}
                    placeholder="Descrição do apoio financeiro, material ou serviços..."
                    className={`${fieldClasses} resize-none`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {saving ? 'A guardar…' : 'Salvar Parceiro'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
