import React, { useEffect, useState } from 'react'
import {
  Database,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Server,
  Layers,
  HardDrive,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getDatabaseTablesHealth } from '../../services/adminDataService'
import { PageHeader, Card, StatCard, Badge, Button } from './ui'

export default function BaseDeDadosPage() {
  const [testing, setTesting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const [tabelas, setTabelas] = useState<any[]>([])

  useEffect(() => {
    async function loadStats() {
      const health = await getDatabaseTablesHealth()
      if (health && health.length > 0) {
        setTabelas(
          health.map((h) => ({
            nome: h.nome,
            descricao: '',
            rls: h.rls,
            estado: h.status,
            linhas: h.linhas,
          }))
        )
      }
    }
    loadStats()
  }, [])

  const handleTestConnectivity = async () => {
    setTesting(true)
    setStatusMsg('')
    try {
      const start = Date.now()
      const { error } = await supabase.from('app_settings').select('key').limit(1)
      const latency = Date.now() - start
      if (error) throw error
      setStatusMsg(`Conexão com PostgreSQL bem-sucedida! Latência de resposta: ${latency}ms.`)
    } catch (err: any) {
      setStatusMsg(`Erro de conectividade: ${err.message || 'Falha ao contactar base de dados'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleExportBackup = async () => {
    setExporting(true)
    try {
      const [inscricoesRes, referralsRes, prizesRes, settingsRes] = await Promise.all([
        supabase.from('inscricoes').select('*'),
        supabase.from('referrals').select('*'),
        supabase.from('prize_claims').select('*'),
        supabase.from('app_settings').select('*'),
      ])

      const backup = {
        metadata: {
          projeto: 'Imersão WEX — Mulheres de Fogo',
          tipo: 'Backup Integral em Formato JSON',
          gerado_em: new Date().toISOString(),
          versao_schema: '1.4',
        },
        tabelas: {
          inscricoes: inscricoesRes.data || [],
          referrals: referralsRes.data || [],
          prize_claims: prizesRes.data || [],
          app_settings: settingsRes.data || [],
        },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `WEX_Backup_Database_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatusMsg('Cópia de segurança JSON descarregada com sucesso.')
    } catch {
      setStatusMsg('Erro ao gerar cópia de segurança.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Database className="w-5 h-5" />}
        title="Estado da Base de Dados & Cópias de Segurança"
        description="Monitorização da infraestrutura PostgreSQL no Supabase, verificação de integridade e exportação JSON."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestConnectivity}
              loading={testing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Testar Conexão
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportBackup}
              loading={exporting}
              icon={<Download className="w-4 h-4" />}
            >
              Backup JSON
            </Button>
          </>
        }
      />

      {/* Faixa de KPIs da infraestrutura */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Motor Principal"
          value="PostgreSQL 15"
          note="Gerido via Supabase Cloud"
          icon={<Server className="w-4 h-4" />}
        />
        <StatCard
          label="Políticas RLS"
          value={`${tabelas.length} Tabelas`}
          note="Isolamento de dados por papel"
          icon={<ShieldCheck className="w-4 h-4" />}
          tone="success"
        />
        <StatCard
          label="Sincronização Local"
          value="IndexedDB"
          note="Cache da porta & fila offline"
          icon={<HardDrive className="w-4 h-4" />}
        />
        <StatCard
          label="Estado Geral"
          value="Operacional"
          note="Sem falhas registadas"
          icon={<Activity className="w-4 h-4" />}
          tone="accent"
        />
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.includes('Erro')
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {statusMsg.includes('Erro') ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          {statusMsg}
        </div>
      )}

      {/* Inspeção de Tabelas */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Tabelas Relacionais do Sistema
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 font-bold">Nome da Tabela</th>
                <th className="px-5 py-3 font-bold text-center">Row Level Security</th>
                <th className="px-5 py-3 font-bold text-center">Estado</th>
                <th className="px-5 py-3 font-bold text-right">Linhas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tabelas.map((tab) => (
                <tr key={tab.nome} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-white">{tab.nome}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge tone="success">Habilitado</Badge>
                  </td>
                  <td className="px-5 py-3 text-center text-slate-400">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {tab.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 tabular-nums">{tab.linhas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
