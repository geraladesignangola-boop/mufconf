import React from 'react'
import {
  LayoutDashboard,
  Crown,
  Bell,
  Users,
  Gift,
  Settings,
  Trophy,
  Menu,
  X,
  UserCheck,
  Ticket,
  Handshake,
  Award,
  Image,
  Mic,
  CalendarDays,
  FileImage,
  FileText,
  BarChart3,
  ShieldCheck,
  Lock,
  Database,
  ClipboardList,
  ListTree,
  Zap,
  Paperclip,
  MessageSquareWarning,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export type AdminTab =
  | 'dashboard'
  | 'participants'
  | 'ingressos'
  | 'checkin'
  | 'ranking'
  | 'prizes'
  | 'parceiros'
  | 'logos_parceiros'
  | 'galeria'
  | 'oradoras'
  | 'programacao'
  | 'cartaz'
  | 'conteudo'
  | 'listas'
  | 'materiais'
  | 'notifications'
  | 'relatos'
  | 'relatorios'
  | 'settings'
  | 'utilizadores'
  | 'dados_sensiveis'
  | 'database'
  | 'logs'

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  isMobileOpen: boolean
  onMobileToggle: () => void
  /** Separadores a ocultar consoante o role do admin (ex.: 'utilizadores' só para super_admin). */
  hiddenTabs?: AdminTab[]
}

interface NavItem {
  id: AdminTab
  label: string
  icon: React.ElementType
  group?: string
}

/**
 * Estrutura de navegação do painel.
 * A lista é a fonte única de verdade: o título do topo em AdminPanel
 * deriva daqui, evitando duplicação de rótulos.
 */
const NAV_ITEMS: NavItem[] = [
  // Grupo 1: Gestão & Participantes
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, group: 'Gestão & Participantes' },
  { id: 'participants', label: 'Inscrições', icon: Users },
  { id: 'ingressos', label: 'Ingressos e Vagas', icon: Ticket },
  { id: 'checkin', label: 'Check-in', icon: UserCheck },
  { id: 'ranking', label: 'Ranking', icon: Crown },
  { id: 'prizes', label: 'Prémios', icon: Gift },

  // Grupo 2: Conteúdo do Evento
  { id: 'oradoras', label: 'Oradoras', icon: Mic, group: 'Conteúdo do Evento' },
  { id: 'programacao', label: 'Programação', icon: CalendarDays },
  { id: 'parceiros', label: 'Parceiros', icon: Handshake },
  { id: 'logos_parceiros', label: 'Logos Parceiros', icon: Award },
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'cartaz', label: 'Cartaz Oficial', icon: FileImage },
  { id: 'conteudo', label: 'Conteúdo Site', icon: FileText },
  { id: 'listas', label: 'Blocos & Listas', icon: ListTree },
  { id: 'materiais', label: 'Materiais & Atalhos', icon: Paperclip },

  // Grupo 3: Comunicação & Relatórios
  { id: 'notifications', label: 'Notificações', icon: Bell, group: 'Comunicação & Relatórios' },
  { id: 'relatos', label: 'Relatos', icon: MessageSquareWarning },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },

  // Grupo 4: Sistema & Controlo
  { id: 'settings', label: 'Definições', icon: Settings, group: 'Sistema & Controlo' },
  { id: 'utilizadores', label: 'Utilizadores', icon: ShieldCheck },
  { id: 'dados_sensiveis', label: 'Dados Sensíveis', icon: Lock },
  { id: 'database', label: 'Base de Dados', icon: Database },
  { id: 'logs', label: 'Logs & Auditoria', icon: ClipboardList },
]

/** Devolve o rótulo da secção ativa — usado pelo título do topo. */
export function getTabLabel(tab: AdminTab): string {
  return NAV_ITEMS.find((item) => item.id === tab)?.label ?? 'Painel'
}

/** Devolve o ícone da secção ativa — usado pelo título do topo. */
export function getTabIcon(tab: AdminTab): React.ElementType {
  return NAV_ITEMS.find((item) => item.id === tab)?.icon ?? LayoutDashboard
}

export default function AdminSidebar({ activeTab, onTabChange, isMobileOpen, onMobileToggle, hiddenTabs }: AdminSidebarProps) {
  const hidden = new Set(hiddenTabs ?? [])
  const visibleItems = NAV_ITEMS.filter((item) => !hidden.has(item.id))
  let lastGroup: string | undefined

  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab)
    if (isMobileOpen) onMobileToggle()
  }

  const sidebarContent = (
    <aside className="w-[248px] h-full bg-slate-950 border-r border-slate-800/80 flex flex-col flex-shrink-0">
      {/* Marca */}
      <div className="px-4 py-4 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Zap className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">WEX Admin</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate">Woman Experience</p>
            </div>
          </div>
          <button
            onClick={onMobileToggle}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => {
          const showGroup = item.group && item.group !== lastGroup
          if (item.group) lastGroup = item.group
          const isActive = activeTab === item.id

          return (
            <React.Fragment key={item.id}>
              {showGroup && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 pt-4 pb-1.5">
                  {item.group}
                </p>
              )}
              <button
                onClick={() => handleTabClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-lg text-[13px] transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                {/* Indicador lateral do item ativo */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-cyan-400"
                  />
                )}
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-3 border-t border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <Trophy className="w-3.5 h-3.5" />
          <span>Painel WEX 2026</span>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <button
        onClick={onMobileToggle}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:self-start">{sidebarContent}</div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={onMobileToggle}
            />
            <motion.div
              initial={{ x: -248 }}
              animate={{ x: 0 }}
              exit={{ x: -248 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
