import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  UserCheck,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Loader2,
  Undo2,
  RefreshCcw,
  Activity,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ExcelJS from 'exceljs'
import type { CheckInStats, CheckInReportEntry } from '../../types/database'
import { PageHeader, Card, StatCard, Badge, Button, EmptyState } from './ui'

export default function CheckInDashboard() {
  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [report, setReport] = useState<CheckInReportEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all')
  const [loadError, setLoadError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [statsRes, reportRes] = await Promise.all([
        supabase.rpc('get_checkin_stats'),
        supabase.rpc('get_checkin_report'),
      ])

      const rpcError = statsRes.error || reportRes.error
      if (rpcError) {
        setLoadError(rpcError.message || 'Não foi possível atualizar os dados do check-in.')
      } else {
        setLoadError('')
      }

      if (!statsRes.error && statsRes.data?.length > 0) {
        setStats(statsRes.data[0])
      }
      if (!reportRes.error && reportRes.data) {
        setReport(reportRes.data)
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Não foi possível carregar os dados do check-in.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleUndo = async (participantId: string) => {
    setUndoingId(participantId)
    try {
      const { error } = await supabase.rpc('undo_checkin', {
        p_participant_id: participantId,
      })
      if (error) {
        setLoadError(error.message || 'Não foi possível desfazer o check-in.')
      } else {
        setLoadError('')
        await loadData()
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Não foi possível desfazer o check-in.'
      )
    } finally {
      setUndoingId(null)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Check-in')

      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telefone', key: 'telefone', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Check-in as', key: 'checked_in_at', width: 20 },
        { header: 'Feito por', key: 'checked_in_by', width: 20 },
        { header: 'Inscrito em', key: 'created_at', width: 20 },
      ]

      // Style header
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF292524' } }
        cell.alignment = { horizontal: 'center' }
      })

      for (const entry of report) {
        sheet.addRow({
          nome: entry.nome,
          email: entry.email,
          telefone: entry.telefone,
          status: entry.checked_in ? 'Presente' : 'Ausente',
          checked_in_at: entry.checked_in_at
            ? new Date(entry.checked_in_at).toLocaleString('pt-AO')
            : '',
          checked_in_by: entry.checked_in_by || '',
          created_at: new Date(entry.created_at).toLocaleString('pt-AO'),
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wex-checkin-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      setLoadError('')
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Não foi possível exportar o relatório.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  const filteredReport = report.filter((entry) => {
    if (filter === 'checked') return entry.checked_in
    if (filter === 'pending') return !entry.checked_in
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<UserCheck className="w-5 h-5" />}
        title="Check-in"
        description="Controlo de presença das participantes, filtros por estado e exportação do relatório."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            loading={isExporting}
            disabled={report.length === 0}
            icon={<Download className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Exportar .xlsx</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        }
      />

      {/* NOX-009: feedback visível quando o RPC falha em vez de falha silenciosa */}
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span className="min-w-0 break-words">{loadError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            icon={<RefreshCcw className="w-3.5 h-3.5" />}
            className="flex-shrink-0"
          >
            Tentar de novo
          </Button>
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Inscritos"
            value={stats.total_inscritos}
            icon={<UserCheck className="w-4 h-4" />}
          />
          <StatCard
            label="Presentes"
            value={stats.total_checked_in}
            icon={<CheckCircle2 className="w-4 h-4" />}
            tone="success"
          />
          <StatCard
            label="Ausentes"
            value={stats.total_inscritos - stats.total_checked_in}
            icon={<Circle className="w-4 h-4" />}
          />
          <StatCard
            label="Percentual"
            value={`${stats.percentual}%`}
            icon={<Activity className="w-4 h-4" />}
            tone="accent"
            progress={stats.percentual}
          />
        </div>
      )}

      {/* Progress bar */}
      {stats && stats.total_inscritos > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Progresso do Check-in</h3>
            <p className="text-[11px] text-slate-500 tabular-nums">
              {stats.total_checked_in} / {stats.total_inscritos}
            </p>
          </div>
          <div className="p-5">
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentual}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Report table */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all' ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({report.length})
            </button>
            <button
              onClick={() => setFilter('checked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'checked' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Presentes ({report.filter(r => r.checked_in).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'pending' ? 'bg-slate-700 text-slate-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ausentes ({report.filter(r => !r.checked_in).length})
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            icon={<RefreshCcw className="w-4 h-4" />}
            title="Atualizar"
            aria-label="Atualizar"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/70">
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Nome</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold hidden md:table-cell">Telefone</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold hidden lg:table-cell">Hora</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white truncate max-w-[150px] sm:max-w-none">{entry.nome}</p>
                    <p className="text-[11px] text-slate-500 sm:hidden truncate">{entry.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400 hidden sm:table-cell truncate max-w-[200px]">{entry.email}</td>
                  <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{entry.telefone}</td>
                  <td className="px-5 py-3 text-center">
                    {entry.checked_in ? (
                      <Badge tone="success">
                        <CheckCircle2 className="w-3 h-3" />
                        Presente
                      </Badge>
                    ) : (
                      <Badge tone="neutral">
                        <Circle className="w-3 h-3" />
                        Ausente
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center hidden lg:table-cell">
                    {entry.checked_in_at ? (
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500/70" />
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {new Date(entry.checked_in_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                          {entry.checked_in_by && <span className="text-slate-500"> por {entry.checked_in_by}</span>}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {entry.checked_in && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={undoingId === entry.id}
                        onClick={() => handleUndo(entry.id)}
                        icon={<Undo2 className="w-3.5 h-3.5" />}
                        title="Desfazer check-in"
                        aria-label="Desfazer check-in"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReport.length === 0 && (
          <EmptyState icon={<UserCheck className="w-8 h-8" />} title="Nenhum registo encontrado" />
        )}
      </Card>
    </div>
  )
}
