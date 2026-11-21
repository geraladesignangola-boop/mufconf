import React, { useEffect, useState } from 'react'
import {
  ClipboardList,
  Search,
  Shield,
  Download,
} from 'lucide-react'
import { LogAuditoria } from '../../types/database'
import { fetchAdminAuditLogs } from '../../services/adminDataService'
import { PageHeader, Card, Badge, Button, EmptyState, fieldClasses } from './ui'

export default function LogsAuditoriaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('todas')

  const [logs, setLogs] = useState<LogAuditoria>([])

  useEffect(() => {
    async function load() {
      const live = await fetchAdminAuditLogs()
      setLogs(live || [])
    }
    load()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm.trim() ||
      log.utilizador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.detalhes && log.detalhes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAcao =
      filtroAcao === 'todas' ||
      log.acao.toLowerCase().includes(filtroAcao.toLowerCase())

    return matchesSearch && matchesAcao
  })

  const handleExportLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.criado_em}] [${l.papel}] ${l.utilizador} -> ${l.acao} (${l.entidade}): ${l.detalhes || ''}`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WEX_Auditoria_Logs_${new Date().toISOString().slice(0, 10)}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ClipboardList className="w-5 h-5" />}
        title="Logs de Auditoria & Registo de Ações"
        description="Histórico imutável de operações administrativas, alterações de conteúdo e autenticações."
        actions={
          <Button variant="secondary" onClick={handleExportLogs} icon={<Download className="w-3.5 h-3.5" />}>
            Descarregar Logs (.log)
          </Button>
        }
      />

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por utilizador, ação ou detalhe..."
            aria-label="Filtrar logs de auditoria"
            className={`${fieldClasses} pl-10`}
          />
        </div>

        <select
          value={filtroAcao}
          onChange={(e) => setFiltroAcao(e.target.value)}
          aria-label="Filtrar por ação"
          className={`${fieldClasses} sm:w-56`}
        >
          <option value="todas">Todas as Ações</option>
          <option value="Check-in">Check-in</option>
          <option value="WhatsApp">Grupo WhatsApp</option>
          <option value="Definições">Definições</option>
          <option value="Oradoras">Oradoras</option>
          <option value="Referral">Referrals</option>
        </select>
      </div>

      {/* Lista de Eventos de Auditoria */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Eventos de Auditoria
          </h3>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Search className="w-10 h-10" />}
              title="Nenhum evento corresponde ao filtro atual."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
                <tr className="border-b border-slate-800/60">
                  <th className="px-5 py-3 font-bold">Utilizador</th>
                  <th className="px-5 py-3 font-bold">Ação</th>
                  <th className="px-5 py-3 font-bold">Detalhes</th>
                  <th className="px-5 py-3 font-bold text-right whitespace-nowrap">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="text-sm font-semibold text-white">{log.utilizador}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge
                          tone={
                            log.papel === 'Desenvolvedor'
                              ? 'cyan'
                              : log.papel === 'Gestor'
                              ? 'info'
                              : log.papel === 'Check-in'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {log.papel}
                        </Badge>
                        <span className="text-[11px] text-slate-500 font-mono">em {log.entidade}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-slate-400">{log.acao}</td>
                    <td className="px-5 py-4 align-top text-sm text-slate-400 max-w-xl">
                      {log.detalhes && <p className="leading-relaxed">{log.detalhes}</p>}
                    </td>
                    <td className="px-5 py-4 align-top text-right text-[11px] text-slate-500 font-mono whitespace-nowrap tabular-nums">
                      {log.criado_em}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
