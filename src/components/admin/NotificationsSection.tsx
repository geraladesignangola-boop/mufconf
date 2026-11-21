import React from 'react'
import { motion } from 'motion/react'
import { Bell, Mail, MessageCircle, CheckCircle, Send } from 'lucide-react'
import { Notification } from '../../types/database'
import { PageHeader, Card, EmptyState, Badge } from './ui'

interface NotificationsSectionProps {
  notifications: Notification[]
  onMarkAsSent: (id: string) => void
}

export default function NotificationsSection({ notifications, onMarkAsSent }: NotificationsSectionProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Bell className="w-5 h-5" />}
        title="Notificações de Prémios e Links"
        description="Contactos pendentes por enviar às participantes."
      />

      {notifications.length === 0 ? (
        <Card className="p-4">
          <EmptyState icon={<Send className="w-10 h-10" />} title="Nenhuma notificação pendente." />
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2 items-start">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 sm:p-4 rounded-xl border transition-colors ${
                notif.sent
                  ? 'bg-slate-900/60 border-slate-800/70 opacity-70'
                  : 'bg-slate-900 border-cyan-500/25 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone={notif.sent ? 'neutral' : 'cyan'}>
                      {notif.sent ? 'Enviado' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{notif.message}</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {new Date(notif.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  {!notif.sent ? (
                    <>
                      <a
                        href={notif.whatsapp_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarkAsSent(notif.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                      <a
                        href={notif.email_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarkAsSent(notif.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                    </>
                  ) : (
                    <span className="px-3 py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Enviado
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
