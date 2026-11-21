import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { UsuarioAdmin } from '../../types/database'
import {
  fetchAdminUtilizadores,
  setAdminUtilizadorAtivo,
  createAdminUtilizador,
} from '../../services/adminContentService'
import { PageHeader, Card, Badge, Button, EmptyState, fieldClasses, labelClasses } from './ui'

export default function UtilizadoresAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    papel: 'gestor' as 'desenvolvedor' | 'gestor' | 'checkin',
  })

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      setUsuarios(await fetchAdminUtilizadores())
    } catch (err) {
      setErro((err as Error).message)
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleToggleAtivo = async (usuario: UsuarioAdmin) => {
    const novoEstado = !usuario.ativo
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, ativo: novoEstado } : u))
    )
    try {
      await setAdminUtilizadorAtivo(usuario.id, novoEstado)
    } catch (err) {
      setErro((err as Error).message)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ativo: usuario.ativo } : u))
      )
    }
  }

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Nome e e-mail são obrigatórios.')
      return
    }
    if (formData.senha.length < 8) {
      alert('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }

    setSaving(true)
    setErro('')
    try {
      const resultado = await createAdminUtilizador(formData)
      if (!resultado.success) {
        alert(resultado.error || 'Não foi possível criar a conta.')
        return
      }

      setModalOpen(false)
      setFormData({ nome: '', email: '', senha: '', papel: 'gestor' })
      await carregar()

      if (resultado.requiresConfirmation) {
        alert(
          `Conta criada. Foi enviado um e-mail de confirmação para ${formData.email.trim()} — a pessoa terá de confirmar o endereço antes do primeiro acesso.`
        )
      } else {
        alert(`Conta para ${formData.nome.trim()} criada com sucesso.`)
      }
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Utilizadores & Perfis de Acesso"
        description="Gestão de contas da equipa com controlo de privilégios e auditoria de sessão."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setFormData({ nome: '', email: '', senha: '', papel: 'gestor' })
              setModalOpen(true)
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Novo Utilizador
          </Button>
        }
      />

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {loading && (
        <Card className="p-5">
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            A carregar as contas de acesso a partir do Supabase…
          </p>
        </Card>
      )}

      {/* Matriz de Perfis Informativa */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Desenvolvedor</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-400 leading-relaxed">
              Acesso irrestrito a configurações, base de dados, logs, conteúdos e dados sensíveis.
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Gestor de Inscritos</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-400 leading-relaxed">
              Gestão da lista de inscritas, contactos, adição ao WhatsApp, check-in e relatórios.
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Check-in (Porta)</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-400 leading-relaxed">
              Acesso exclusivo à validação de presença na porta via pesquisa e confirmação rápida.
            </p>
          </div>
        </Card>
      </div>

      {/* Lista de utilizadores — a criação fica no modal aberto pelo botão do topo */}
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Utilizadores</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3 font-bold">Utilizador / Nome</th>
                  <th className="px-5 py-3 font-bold">E-mail de Acesso</th>
                  <th className="px-5 py-3 font-bold">Nível / Papel</th>
                  <th className="px-5 py-3 font-bold">Último Acesso</th>
                  <th className="px-5 py-3 font-bold text-center">Estado</th>
                  <th className="px-5 py-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8">
                      <EmptyState icon={<UserPlus className="w-6 h-6" />} title="Sem utilizadores registados." />
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usr) => (
                    <tr
                      key={usr.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3 text-white font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {usr.nome.charAt(0)}
                          </span>
                          {usr.nome}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{usr.email}</td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={
                            usr.papel === 'desenvolvedor' ? 'cyan' : usr.papel === 'gestor' ? 'info' : 'success'
                          }
                        >
                          {usr.papel}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{usr.ultimoAcesso}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            usr.ativo ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {usr.ativo ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {usr.ativo ? 'Ativo' : 'Desativado'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant={usr.ativo ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleAtivo(usr)}
                        >
                          {usr.ativo ? 'Desativar' : 'Reativar'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>


      </div>

      {/* Modal Criar Utilizador */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Criar Novo Utilizador</h3>
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
                    placeholder="Ex: Maria João"
                    className={fieldClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="utilizador@wex.ao"
                    className={fieldClasses}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100">Acesso</h3>
                <div>
                  <label className={labelClasses}>Nível de Acesso (Papel)</label>
                  <select
                    value={formData.papel}
                    onChange={(e) => setFormData({ ...formData, papel: e.target.value as any })}
                    className={fieldClasses}
                  >
                    <option value="gestor">Gestor de Inscritos (Controlo e Contacto)</option>
                    <option value="checkin">Check-in (Apenas Portaria do Evento)</option>
                    <option value="desenvolvedor">Desenvolvedor (Acesso Total)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Palavra-Passe Temporária</label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Defina uma senha provisória"
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
                {saving ? 'A criar…' : 'Criar Acesso'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
