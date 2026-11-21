import React, { useState } from 'react'
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  UserX,
} from 'lucide-react'
import { AdminParticipantOverview } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { PageHeader, Card, StatCard, Button, EmptyState, fieldClasses } from './ui'

interface DadosSensiveisProps {
  participants: AdminParticipantOverview[]
  /** Comunica ao painel o registo já anonimizado para atualizar a lista. */
  onAnonimizado?: (id: string, dados: Partial<AdminParticipantOverview>) => void
}

export default function DadosSensiveisPage({ participants, onAnonimizado }: DadosSensiveisProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [erro, setErro] = useState('')
  const [anonimizandoId, setAnonimizandoId] = useState<string | null>(null)
  const [anonimizados, setAnonimizados] = useState<string[]>([])

  const filtered = participants.filter((p) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      p.nome.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.telefone.includes(term) ||
      p.whatsapp.includes(term)
    )
  })

  const handleExportIndividual = (p: AdminParticipantOverview) => {
    const data = {
      termo: 'Declaração e Dossier de Dados Pessoais — Imersão WEX',
      conformidade: 'Lei de Proteção de Dados Pessoais de Angola (Lei nº 22/11)',
      data_extracao: new Date().toISOString(),
      participante: {
        id: p.id,
        nome_completo: p.nome,
        email: p.email,
        telefone_principal: p.telefone,
        whatsapp_comunicacao: p.whatsapp,
        morada_residencia: p.morada,
        igreja_congregacao: p.igreja || 'Não informada',
        municipio_bairro: p.localizacao || 'Não informado',
        faixa_etaria: p.faixa_etaria,
        canal_descoberta: p.como_soube,
        expectativa_registada: p.expectativa || 'Não informada',
        data_inscricao_consentimento: p.created_at,
        codigo_referral: p.referral_code,
        checkin_efetuado: p.group_added_at ? 'Sim' : 'Não',
        notas_administrativas: p.admin_notes || 'Sem notas',
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Dossier_Privacidade_${p.nome.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSuccessMsg(`Dossier confidencial de ${p.nome} exportado com sucesso.`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleAnonimizar = async (p: AdminParticipantOverview) => {
    const confirmName = prompt(
      `ATENÇÃO: A anonimização é irreversível e remove todos os dados identificativos da participante.\n\nPara confirmar, digite exatamente: ${p.nome}`
    )
    if (confirmName !== p.nome) return

    const pseudonimo = `Participante ${p.id.slice(0, 8)}`
    const dadosAnonimos: Partial<AdminParticipantOverview> = {
      nome: pseudonimo,
      email: '',
      telefone: '+244 000 000 000',
      whatsapp: '',
      morada: '',
      igreja: null,
      localizacao: null,
      recomendacao: null,
      observacoes: null,
      admin_notes: null,
      expectativa: null,
    }

    setErro('')
    setAnonimizandoId(p.id)
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({
          ...dadosAnonimos,
          nome_completo: null,
          telefone_normalizado: null,
          municipio_bairro: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id)

      if (error) throw new Error(error.message)

      setAnonimizados((prev) => [...prev, p.id])
      onAnonimizado?.(p.id, dadosAnonimos)
      setSuccessMsg(
        `Dados de ${p.nome} anonimizados com sucesso em conformidade com o direito ao esquecimento.`
      )
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErro(
        `Não foi possível anonimizar os dados de ${p.nome}: ${(err as Error).message}`
      )
    } finally {
      setAnonimizandoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Lock className="w-5 h-5" />}
        title="Dados Sensíveis & Proteção de Privacidade"
        description="Gestão de consentimento, conformidade com a Lei de Proteção de Dados (Lei nº 22/11) e direito ao esquecimento."
        actions={
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl">
            <ShieldAlert className="w-4 h-4" />
            Acesso Restrito: Desenvolvedor / DPO
          </div>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          {erro}
        </div>
      )}

      {/* Faixa de KPIs de conformidade */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Consentimentos Válidos"
          value="100%"
          note={`${participants.length} registos com consentimento explícito`}
          icon={<CheckCircle className="w-4 h-4" />}
          tone="success"
        />
        <StatCard
          label="Isolamento no Banco"
          value="Ativo (RLS)"
          note="Sem leitura pública às tabelas de dados"
          icon={<ShieldCheck className="w-4 h-4" />}
          tone="accent"
        />
        <StatCard
          label="Pedidos de Eliminação"
          value={String(anonimizados.length)}
          note={
            anonimizados.length === 0
              ? 'Nenhum pedido pendente'
              : `${anonimizados.length} registo(s) anonimizado(s) nesta sessão`
          }
          icon={<Trash2 className="w-4 h-4" />}
        />
      </div>

      {/* Pesquisa e Tabela */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, telefone ou e-mail..."
              aria-label="Pesquisar participantes"
              className={`${fieldClasses} pl-10`}
            />
          </div>
          <span className="text-[11px] text-slate-500">A mostrar {filtered.length} registos confidenciais</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 font-bold">Participante</th>
                <th className="px-5 py-3 font-bold">Telefones & WhatsApp</th>
                <th className="px-5 py-3 font-bold">Morada Registada</th>
                <th className="px-5 py-3 font-bold">Data Consentimento</th>
                <th className="px-5 py-3 font-bold text-right">Ações DPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white">{p.nome}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{p.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono">
                    <p>Tel: {p.telefone}</p>
                    <p className="text-[11px] text-slate-500">WA: {p.whatsapp}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">
                    {p.morada || 'Não informada'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 tabular-nums">
                    {new Date(p.created_at).toLocaleString('pt-PT')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportIndividual(p)}
                        icon={<Download className="w-3.5 h-3.5" />}
                        title="Exportar dossier confidencial"
                      >
                        Dossier
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAnonimizar(p)}
                        loading={anonimizandoId === p.id}
                        disabled={anonimizandoId !== null || anonimizados.includes(p.id)}
                        icon={<UserX className="w-4 h-4" />}
                        title="Anonimizar dados (Direito ao Esquecimento)"
                        aria-label="Anonimizar dados (Direito ao Esquecimento)"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState icon={<Search className="w-8 h-8" />} title="Nenhum registo encontrado" />
        )}
      </Card>
    </div>
  )
}
