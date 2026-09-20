import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import GoodayLogo from './GoodayLogo'
import type { View } from '../screens/Home'

interface HeaderProps {
  userId: string
  avatarUrl: string
  onNavigate: (view: View) => void
}

interface NotificationItem {
  id: string
  actorName: string
  text: string
  isRead: boolean
}

const TYPE_TEXT: Record<string, string> = {
  FOLLOW: 'começou a seguir você.',
  LIKE: 'curtiu sua publicação.',
  COMMENT: 'comentou na sua publicação.',
  MENTION: 'mencionou você.',
  GROUP_INVITE: 'convidou você para um grupo.',
  GROUP_REQUEST: 'pediu para entrar no seu grupo.',
  GROUP_ACCEPTED: 'sua solicitação de grupo foi aceita.',
  MESSAGE: 'enviou uma mensagem.',
  STORY_REPLY: 'respondeu ao seu story.',
  POST_SHARE: 'compartilhou sua publicação.',
}

export default function Header({ userId, avatarUrl, onNavigate }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, is_read, actor:profiles!notifications_actor_id_fkey(name)')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    const items = (data ?? []).map((n: any) => ({
      id: n.id,
      actorName: n.actor?.name ?? 'Alguém',
      text: TYPE_TEXT[n.type] ?? 'interagiu com você.',
      isRead: n.is_read,
    }))

    setNotifications(items)
    setHasUnread(items.some(n => !n.isRead))
  }

  const toggleNotifications = () => {
    setNotifOpen(v => !v)
    if (!notifOpen) loadNotifications()
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false)
    setNotifications(items => items.map(n => ({ ...n, isRead: true })))
    setHasUnread(false)
  }

  return (
    <header className="flex items-center gap-4 lg:gap-8 h-16 lg:h-14 px-4 lg:px-0 flex-shrink-0 bg-white lg:bg-transparent border-b lg:border-0 border-neutral-200">
      <button onClick={() => onNavigate('home')} aria-label="Gooday — início">
        {/* Mobile: só o ícone. Desktop: logo completo "Gday". */}
        <svg width="36" height="24" viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth="5" className="lg:hidden text-neutral-900">
          <circle cx="9.6" cy="11" r="6.7" />
          <circle cx="21.4" cy="11" r="6.7" />
        </svg>
        <GoodayLogo className="hidden lg:inline-flex text-[26px]" />
      </button>

      <button
        onClick={() => onNavigate('discover')}
        className="hidden md:flex relative items-center flex-1 lg:flex-none lg:w-[430px] h-11 lg:h-[52px] pl-5 pr-11 rounded-full bg-neutral-100 lg:bg-white text-left"
      >
        <span className="text-sm text-neutral-500 truncate">O que deseja fazer de bom hoje?</span>
        <span className="absolute top-1 right-1 w-9 h-9 flex items-center justify-center rounded-full text-neutral-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </span>
      </button>

      <button
        onClick={() => window.alert('Criação de publicações chega em breve!')}
        aria-label="Criar publicação"
        className="lg:hidden ml-auto md:ml-0 w-11 h-11 flex items-center justify-center rounded-full text-neutral-900"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.5v7M8.5 12h7" />
        </svg>
      </button>

      <p className="hidden lg:block ml-auto text-[15px] text-neutral-700 whitespace-nowrap">
        Respeite sua mente e trate seu corpo bem
      </p>

      <div className="relative ml-auto lg:ml-0">
        <button
          onClick={toggleNotifications}
          aria-label="Notificações"
          className="relative w-11 h-11 flex items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" />
            <path d="M10.3 19a2 2 0 0 0 3.4 0" />
          </svg>
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border-2 border-white" />
          )}
        </button>

        {notifOpen && (
          <>
            <button className="fixed inset-0 z-20 cursor-default" onClick={() => setNotifOpen(false)} aria-label="Fechar notificações" />
            <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl py-2 z-30">
              <div className="flex items-center justify-between px-5 py-2">
                <p className="font-bold text-neutral-900">Notificações</p>
                <button onClick={markAllRead} className="text-accent-700 text-xs font-medium">
                  Marcar como lidas
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="px-5 py-4 text-sm text-neutral-500">Nenhuma notificação ainda.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="flex items-center gap-3 px-5 py-2">
                    <p className="flex-1 text-sm text-neutral-900">
                      <strong>{n.actorName}</strong> {n.text}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <button onClick={() => onNavigate('profile')} aria-label="Minha conta" className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </button>
    </header>
  )
}
