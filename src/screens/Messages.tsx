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
  const [activeConversation, setActiveConversation] = useState<{ id: string; name: string } | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [handleInput, setHandleInput] = useState('')
  const [newChatError, setNewChatError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)

    const { data: myRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)
      .is('left_at', null)

    const ids = (myRows ?? []).map((r: any) => r.conversation_id)
    if (ids.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const { data: others } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, profiles(name, avatar_url)')
      .in('conversation_id', ids)
      .neq('user_id', userId)

    const { data: lastMessages } = await supabase
      .from('messages')
      .select('conversation_id, body, sent_at')
      .in('conversation_id', ids)
      .order('sent_at', { ascending: false })

    const lastByConv = new Map<string, { body: string; sent_at: string }>()
    for (const m of lastMessages ?? []) {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m)
    }

    const items: ConversationItem[] = (others ?? []).map((o: any) => {
      const last = lastByConv.get(o.conversation_id)
      return {
        id: o.conversation_id,
        otherName: o.profiles?.name ?? 'Usuário',
        otherAvatar: o.profiles?.avatar_url ?? `https://picsum.photos/seed/${o.user_id}/100/100`,
        lastMessage: last?.body ?? 'Nenhuma mensagem ainda',
        lastAt: last?.sent_at ?? '',
      }
    })

    items.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))
    setConversations(items)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const openConversation = async (id: string, name: string) => {
    setActiveConversation({ id, name })
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, sent_at')
      .eq('conversation_id', id)
      .order('sent_at', { ascending: true })

    setMessages((data ?? []).map((m: any) => ({ id: m.id, senderId: m.sender_id, body: m.body, sentAt: m.sent_at })))
  }

  const sendMessage = async () => {
    if (!draft.trim() || !activeConversation) return
    const body = draft.trim()
    setDraft('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConversation.id, sender_id: userId, body })
      .select('id, sender_id, body, sent_at')
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, { id: data.id, senderId: data.sender_id, body: data.body, sentAt: data.sent_at }])
      loadConversations()
    }
  }

  const startNewChat = async () => {
    setNewChatError(null)
    const handle = handleInput.trim().toLowerCase()
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

    const { data: myRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

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
      openConversation(existingId, target.name)
      return
    }

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ is_group: false })
      .select('id')
      .single()

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
    openConversation(conv.id, target.name)
  }

  if (activeConversation) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-3">
          <button onClick={() => setActiveConversation(null)} className="text-accent-500 font-semibold">
            ← Voltar
          </button>
          <h2 className="font-semibold text-neutral-900">{activeConversation.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(m => (
            <div
              key={m.id}
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                m.senderId === userId ? 'bg-accent-500 text-neutral-900 ml-auto' : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              {m.body}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-200 flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Escreva uma mensagem..."
            className="input"
          />
          <button onClick={sendMessage} className="btn-primary">Enviar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Mensagens</h1>
          <button onClick={() => setShowNewChat(true)} className="btn-primary">Nova conversa</button>
        </div>

        {showNewChat && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-neutral-200">
            <label className="block text-sm font-semibold text-neutral-900 mb-2">@handle da pessoa</label>
            <div className="flex gap-2">
              <input
                value={handleInput}
                onChange={e => setHandleInput(e.target.value)}
                placeholder="ex: admin_stefano"
                className="input"
              />
              <button onClick={startNewChat} className="btn-primary">Iniciar</button>
              <button onClick={() => setShowNewChat(false)} className="btn-outline">Cancelar</button>
            </div>
            {newChatError && <p className="text-error text-sm mt-2">{newChatError}</p>}
          </div>
        )}

        {loading && <p className="text-center text-neutral-500 py-8">Carregando conversas...</p>}

        {!loading && conversations.length === 0 && (
          <p className="text-center text-neutral-500 py-8">Nenhuma conversa ainda. Clique em "Nova conversa" para começar.</p>
        )}

        <div className="space-y-2">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id, c.otherName)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 text-left"
            >
              <img src={c.otherAvatar} alt={c.otherName} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 truncate">{c.otherName}</p>
                <p className="text-sm text-neutral-500 truncate">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
