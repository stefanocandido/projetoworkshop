import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface MessagesProps {
  userId: string
}

interface ConversationItem {
  id: string
  otherName: string
  otherAvatar: string
  lastMessage: string
  lastAt: string
  unreadCount: number
}

interface ChatMessage {
  id: string
  senderId: string
  body: string
  sentAt: string
}

export default function Messages({ userId }: MessagesProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [handleInput, setHandleInput] = useState('')
  const [newChatError, setNewChatError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)

    const { data: myRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .is('left_at', null)

    const ids = (myRows ?? []).map((r: any) => r.conversation_id)
    if (ids.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }
    const lastReadByConv = new Map((myRows ?? []).map((r: any) => [r.conversation_id, r.last_read_at]))

    const [{ data: others }, { data: allMessages }] = await Promise.all([
      supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(name, avatar_url)')
        .in('conversation_id', ids)
        .neq('user_id', userId),
      supabase
        .from('messages')
        .select('conversation_id, body, sent_at, sender_id')
        .in('conversation_id', ids)
        .order('sent_at', { ascending: false }),
    ])

    const lastByConv = new Map<string, { body: string; sent_at: string }>()
    const unreadByConv = new Map<string, number>()
    for (const m of allMessages ?? []) {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m)
      const lastRead = lastReadByConv.get(m.conversation_id)
      if (m.sender_id !== userId && (!lastRead || m.sent_at > lastRead)) {
        unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1)
      }
    }

    const items: ConversationItem[] = (others ?? []).map((o: any) => {
      const last = lastByConv.get(o.conversation_id)
      return {
        id: o.conversation_id,
        otherName: o.profiles?.name ?? 'Usuário',
        otherAvatar: o.profiles?.avatar_url ?? `https://picsum.photos/seed/${o.user_id}/100/100`,
        lastMessage: last?.body ?? 'Nenhuma mensagem ainda',
        lastAt: last?.sent_at ?? '',
        unreadCount: unreadByConv.get(o.conversation_id) ?? 0,
      }
    })

    items.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))
    setConversations(items)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const openConversation = async (id: string) => {
    setActiveId(id)
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, sent_at')
      .eq('conversation_id', id)
      .order('sent_at', { ascending: true })

    setMessages((data ?? []).map((m: any) => ({ id: m.id, senderId: m.sender_id, body: m.body, sentAt: m.sent_at })))
    await supabase.from('conversation_participants').update({ last_read_at: new Date().toISOString() }).match({ conversation_id: id, user_id: userId })
    setConversations(list => list.map(c => (c.id === id ? { ...c, unreadCount: 0 } : c)))
  }

  const sendMessage = async () => {
    if (!draft.trim() || !activeId) return
    const body = draft.trim()
    setDraft('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeId, sender_id: userId, body })
      .select('id, sender_id, body, sent_at')
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, { id: data.id, senderId: data.sender_id, body: data.body, sentAt: data.sent_at }])
      loadConversations()
    }
  }

  const startNewChat = async () => {
    setNewChatError(null)
    const handle = handleInput.trim().toLowerCase().replace(/^@/, '')
    if (!handle) return

    const { data: target } = await supabase.from('profiles').select('id, name').eq('handle', handle).maybeSingle()
    if (!target) {
      setNewChatError('Nenhum usuário com esse @handle.')
      return
    }
    if (target.id === userId) {
      setNewChatError('Você não pode conversar consigo mesmo.')
      return
    }

    const { data: myRows } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId)
    const myIds = (myRows ?? []).map((r: any) => r.conversation_id)
    let existingId: string | null = null

    if (myIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations!inner(is_group)')
        .eq('user_id', target.id)
        .in('conversation_id', myIds)
        .eq('conversations.is_group', false)
        .limit(1)
        .maybeSingle()
      existingId = shared?.conversation_id ?? null
    }

    if (existingId) {
      setShowNewChat(false)
      setHandleInput('')
      await loadConversations()
      openConversation(existingId)
      return
    }

    const { data: conv, error: convError } = await supabase.from('conversations').insert({ is_group: false }).select('id').single()
    if (convError || !conv) {
      setNewChatError('Não foi possível criar a conversa.')
      return
    }

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: target.id },
    ])

    setShowNewChat(false)
    setHandleInput('')
    await loadConversations()
    openConversation(conv.id)
  }

  const active = conversations.find(c => c.id === activeId) ?? null

  const ListPane = (
    <div className="w-full lg:w-[340px] flex-shrink-0 lg:border-r border-neutral-200 flex flex-col">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <p className="text-lg font-bold text-neutral-900">Conversas</p>
        <button onClick={() => setShowNewChat(true)} aria-label="Nova conversa" className="w-9 h-9 flex items-center justify-center rounded-full text-accent-700 hover:bg-accent-50">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {showNewChat && (
        <div className="mx-4 mb-3 p-3 bg-neutral-50 rounded-xl">
          <input
            value={handleInput}
            onChange={e => setHandleInput(e.target.value)}
            placeholder="@handle da pessoa"
            className="input h-10 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={startNewChat} className="btn-primary h-9 text-xs flex-1">Iniciar</button>
            <button onClick={() => setShowNewChat(false)} className="btn-outline h-9 text-xs flex-1">Cancelar</button>
          </div>
          {newChatError && <p className="text-error text-xs mt-1.5">{newChatError}</p>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-neutral-500 py-8 text-sm">Carregando...</p>
        ) : conversations.length === 0 ? (
          <p className="text-center text-neutral-500 py-8 text-sm px-4">Nenhuma conversa ainda. Toque em + para começar.</p>
        ) : (
          conversations.map(c => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left ${c.id === activeId ? 'bg-neutral-50' : 'bg-white'}`}
            >
              <img src={c.otherAvatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-neutral-900 truncate">{c.otherName}</span>
                <span className="block mt-0.5 text-[13px] text-neutral-500 truncate">{c.lastMessage}</span>
              </span>
              {c.unreadCount > 0 && (
                <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-accent-500 text-neutral-900 text-[11px] font-bold flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )

  const ChatPane = active ? (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3.5 border-b border-neutral-200 flex-shrink-0">
        <button onClick={() => setActiveId(null)} className="lg:hidden text-accent-700 font-semibold">←</button>
        <img src={active.otherAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        <p className="text-[15px] font-semibold text-neutral-900">{active.otherName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 flex flex-col gap-2.5">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            <span
              className={`max-w-[75%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-5 ${
                m.senderId === userId ? 'bg-accent-500 text-neutral-900' : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-4 lg:px-6 py-4 border-t border-neutral-200 flex-shrink-0">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escreva uma mensagem"
          className="flex-1 h-12 px-4 rounded-full bg-neutral-100 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-accent-300"
        />
        <button onClick={sendMessage} aria-label="Enviar mensagem" className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-500 text-neutral-900 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20 20.5 12 4 4l2.5 7.2L4 20Z" />
          </svg>
        </button>
      </div>
    </div>
  ) : (
    <div className="hidden lg:flex flex-1 items-center justify-center text-neutral-500 text-sm">
      Selecione uma conversa para começar
    </div>
  )

  return (
    <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 lg:py-0 pb-20 lg:pb-6">
      <div className="h-full max-w-5xl mx-auto bg-white rounded-2xl overflow-hidden flex">
        {active ? <div className="hidden lg:flex">{ListPane}</div> : ListPane}
        {ChatPane}
      </div>
    </div>
  )
}
