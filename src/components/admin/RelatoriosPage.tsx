import React from 'react'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  Users,
  CheckCircle,
  TrendingUp,
  Church,
} from 'lucide-react'
import { AdminParticipantOverview, DashboardStats } from '../../types/database'
import { PageHeader, Card, StatCard, Button, EmptyState } from './ui'

interface RelatoriosPageProps {
  stats: DashboardStats | null
  participants: AdminParticipantOverview[]
  onExportExcel: () => void
}

export default function RelatoriosPage({ stats, participants, onExportExcel }: RelatoriosPageProps) {

  // Distribuição por faixa etária
  const faixas = {
    '18-25': participants.filter((p) => p.faixa_etaria === '18-25').length,
    '26-35': participants.filter((p) => p.faixa_etaria === '26-35').length,
    '36-45': participants.filter((p) => p.faixa_etaria === '36-45').length,
    '46+': participants.filter((p) => p.faixa_etaria === '46+').length,
  }

  // Top Igrejas
  const igrejaCounts: Record<string, number> = {}
  participants.forEach((p) => {
    const ig = p.igreja?.trim() || 'Sem denominação informada'
    igrejaCounts[ig] = (igrejaCounts[ig] || 0) + 1
  })
  const topIgrejas = Object.entries(igrejaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Exportar CSV de contactos para WhatsApp
  const handleExportarContatosCsv = () => {
    try {
      const header = 'Nome,Telefone,WhatsApp,Igreja,Estado\n'
      const rows = participants
        .map((p) => `"${p.nome}","${p.telefone}","${p.whatsapp}","${p.igreja || ''}","${p.group_added_at ? 'No Grupo' : 'Pendente'}"`)
        .join('\n')
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `WEX_Contactos_WhatsApp_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignora falhas de exportação
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="w-5 h-5" />}
        title="Relatórios Executivos & Exportações"
        description="Geração de folhas de cálculo, análise demográfica de participantes e inteligência de dados."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleExportarContatosCsv}
              disabled={participants.length === 0}
              icon={<Download className="w-4 h-4" />}
            >
              CSV Contactos
            </Button>
            <Button
              variant="primary"
              onClick={onExportExcel}
              disabled={participants.length === 0}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Exportar Excel Completo (.xlsx)
            </Button>
          </div>
        }
      />

      {/* Faixa de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total de Registos"
          value={participants.length}
          note="Participantes inscritas"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="No Grupo Oficial"
          value={participants.filter((p) => p.group_added_at).length}
          note="Integradas na comunidade"
          icon={<CheckCircle className="w-4 h-4" />}
          tone="success"
        />
        <StatCard
          label="Total de Referrals"
          value={stats?.total_referrals || 0}
          note="Mulheres convidadas"
          icon={<TrendingUp className="w-4 h-4" />}
          tone="accent"
        />
        <StatCard
          label="Cliques nos Links"
          value={stats?.total_clicks || 0}
          note="Tráfego total medido"
          icon={<FileText className="w-4 h-4" />}
        />
      </div>

      {/* Distribuição demográfica e igrejas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Distribuição por Faixa Etária</h3>
          </div>

          <div className="p-5 space-y-4">
            {Object.entries(faixas).map(([faixa, count]) => {
              const pct = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0
              return (
                <div key={faixa} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{faixa} anos</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
            <Church className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Top Denominações & Igrejas de Origem</h3>
          </div>

          <div className="p-5 space-y-2.5">
            {topIgrejas.length === 0 ? (
              <EmptyState icon={<Church className="w-6 h-6" />} title="Sem registo de dados de igrejas." />
            ) : (
              topIgrejas.map(([igreja, total], idx) => (
                <div
                  key={igreja}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-white truncate">{igreja}</span>
                  </div>
                  <span className="text-sm text-slate-400 font-mono tabular-nums flex-shrink-0">
                    {total} inscrita{total > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
