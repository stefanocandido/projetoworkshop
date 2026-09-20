import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'

interface GroupsProps {
  userId: string
}

type Filter = 'Todos' | 'Meus grupos' | 'Descobrir'

interface GroupItem {
  id: string
  name: string
  description: string | null
  coverUrl: string
  memberAvatars: string[]
  membersCount: number
  privacy: 'PUBLIC' | 'PRIVATE'
  myStatus: 'ACTIVE' | 'PENDING' | null
}

interface MemberItem {
  userId: string
  name: string
  handle: string
  avatarUrl: string
  role: string
}

interface GroupPost {
  id: string
  authorHandle: string
  body: string
  createdAt: string
}

export default function Groups({ userId }: GroupsProps) {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('Todos')

  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [membersOpen, setMembersOpen] = useState(false)
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([])

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('groups')
      .select('id, name, description, avatar_url, members_count, privacy, group_members(user_id, status, profiles(avatar_url))')
      .is('deleted_at', null)
      .order('members_count', { ascending: false })

    setGroups(
      (data ?? []).map((g: any) => {
        const mine = (g.group_members ?? []).find((m: any) => m.user_id === userId)
        const activeMembers = (g.group_members ?? []).filter((m: any) => m.status === 'ACTIVE')
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          coverUrl: g.avatar_url ?? `https://picsum.photos/seed/${g.id}/400/300`,
          memberAvatars: activeMembers.slice(0, 3).map((m: any) => m.profiles?.avatar_url ?? `https://picsum.photos/seed/${m.user_id}/100/100`),
          membersCount: g.members_count ?? 0,
          privacy: g.privacy,
          myStatus: mine ? mine.status : null,
        }
      })
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const joinGroup = async (group: GroupItem) => {
    const status = group.privacy === 'PUBLIC' ? 'ACTIVE' : 'PENDING'
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'MEMBER', status })
    if (!error) loadGroups()
  }

  const leaveGroup = async (group: GroupItem) => {
    await supabase.from('group_members').delete().match({ group_id: group.id, user_id: userId })
    loadGroups()
    if (activeGroup?.id === group.id) setActiveGroup(null)
  }

  const openGroup = async (group: GroupItem) => {
    setActiveGroup(group)
    setMembersOpen(false)

    const [{ data: memberRows }, { data: postRows }] = await Promise.all([
      supabase
        .from('group_members')
        .select('user_id, role, profiles(name, handle, avatar_url)')
        .eq('group_id', group.id)
        .eq('status', 'ACTIVE'),
      supabase
        .from('group_posts')
        .select('post_id, posts(body, created_at, author:profiles!posts_author_id_fkey(handle))')
        .eq('group_id', group.id)
        .order('post_id', { ascending: false })
        .limit(10),
    ])

    setMembers(
      (memberRows ?? []).map((m: any) => ({
        userId: m.user_id,
        name: m.profiles?.name ?? 'Usuário',
        handle: m.profiles?.handle ?? '',
        avatarUrl: m.profiles?.avatar_url ?? `https://picsum.photos/seed/${m.user_id}/100/100`,
        role: m.role === 'OWNER' ? 'Criador' : m.role === 'ADMIN' ? 'Admin' : 'Membro',
      }))
    )

    setGroupPosts(
      (postRows ?? [])
        .filter((r: any) => r.posts)
        .map((r: any) => ({
          id: r.post_id,
          authorHandle: r.posts.author?.handle ?? 'usuario',
          body: r.posts.body,
          createdAt: timeAgo(r.posts.created_at),
        }))
    )
  }

  const filteredGroups = groups.filter(g => {
    if (query && !g.name.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (filter === 'Meus grupos') return g.myStatus === 'ACTIVE'
    if (filter === 'Descobrir') return !g.myStatus
    return true
  })

  if (activeGroup) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-0 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <button onClick={() => setActiveGroup(null)} className="text-accent-700 font-semibold mb-3 flex items-center gap-1">
              ← Voltar
            </button>

            <div className="h-40 lg:h-[220px] rounded-2xl overflow-hidden">
              <img src={activeGroup.coverUrl} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="bg-white rounded-xl p-5 -mt-8 mx-2 relative">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-neutral-900">{activeGroup.name}</h1>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D6D6D" strokeWidth="2">
                      {activeGroup.privacy === 'PRIVATE' ? (
                        <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>
                      ) : (
                        <circle cx="12" cy="12" r="9" />
                      )}
                    </svg>
                  </div>
                  <p className="mt-1.5 text-[13px] text-neutral-600">
                    {activeGroup.privacy === 'PUBLIC' ? 'Público' : 'Privado'} · {activeGroup.membersCount} membros
                  </p>
                  {activeGroup.description && (
                    <p className="mt-3.5 text-sm leading-6 text-neutral-900 max-w-[62ch]">{activeGroup.description}</p>
                  )}
                </div>
                {activeGroup.myStatus === 'ACTIVE' ? (
                  <button onClick={() => leaveGroup(activeGroup)} className="btn-outline h-11 px-5 text-sm flex-shrink-0">Participando</button>
                ) : activeGroup.myStatus === 'PENDING' ? (
                  <span className="text-sm text-neutral-500 flex-shrink-0">Solicitação pendente</span>
                ) : (
                  <button onClick={() => joinGroup(activeGroup)} className="btn-primary h-11 px-5 text-sm flex-shrink-0">Participar</button>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-4">
                <div className="flex">
                  {activeGroup.memberAvatars.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover box-border" style={{ marginLeft: i === 0 ? 0 : -9 }} />
                  ))}
                </div>
                <button onClick={() => setMembersOpen(true)} className="text-accent-700 text-[13px] font-semibold">
                  Ver os {activeGroup.membersCount} membros
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-5">
              {groupPosts.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">Nenhuma publicação neste grupo ainda.</p>
              ) : (
                groupPosts.map(post => (
                  <article key={post.id} className="bg-white rounded-2xl p-5">
                    <p className="text-[15px] font-semibold text-neutral-900">@{post.authorHandle}</p>
                    <p className="mt-0.5 text-[13px] text-neutral-500">{post.createdAt}</p>
                    <p className="mt-3.5 text-[15px] leading-6 text-neutral-900">{post.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="lg:w-72 flex-shrink-0 bg-white rounded-xl p-5 h-fit">
            <p className="text-[15px] font-bold text-neutral-900">Sobre o grupo</p>
            <p className="mt-3 text-[13px] leading-5 text-neutral-600">
              {activeGroup.description ?? 'Sem descrição ainda.'}
            </p>
          </aside>
        </div>

        {membersOpen && (
          <>
            <button className="fixed inset-0 z-20 bg-black/40" onClick={() => setMembersOpen(false)} aria-label="Fechar" />
            <div role="dialog" aria-label="Membros do grupo" className="fixed top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-md max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-5 z-30">
              <div className="flex items-center justify-between">
                <p className="text-[17px] font-bold text-neutral-900">Membros · {members.length}</p>
                <button onClick={() => setMembersOpen(false)} className="text-neutral-600 p-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6 18 18M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center gap-3 py-2.5">
                    <img src={m.avatarUrl} alt="" className="w-[46px] h-[46px] rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{m.name}</p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">@{m.handle}</p>
                    </div>
                    <span className="h-7 px-3 rounded-full bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center flex-shrink-0">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-0 pb-20 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative max-w-[420px]">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar grupos"
            className="input h-[52px] pl-12"
          />
          <span className="absolute inset-y-0 left-4 flex items-center text-neutral-500">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </span>
        </div>

        <div className="mt-[18px] flex gap-2.5 flex-wrap">
          {(['Todos', 'Meus grupos', 'Descobrir'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-4 rounded-full border text-[13px] font-semibold ${
                filter === f ? 'bg-accent-500 border-accent-500 text-neutral-900' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="text-center text-neutral-500 py-12">Carregando grupos...</p>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9.2" cy="8.4" r="3.2" /><path d="M3.6 19.4a5.6 5.6 0 0 1 11.2 0" />
              </svg>
              <p className="mt-4 text-base font-semibold text-neutral-900">Nenhum grupo encontrado</p>
              <p className="mt-1.5 text-sm text-neutral-600 max-w-[320px]">Ainda não temos grupos por aqui. Explore outra aba ou crie o seu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
              {filteredGroups.map(g => (
                <div key={g.id} className="bg-white rounded-2xl p-3.5 flex flex-col">
                  <button onClick={() => openGroup(g)} className="text-left">
                    <img src={g.coverUrl} alt="" className="w-full h-[108px] object-cover rounded-[14px]" />
                    <div className="flex -mt-4 ml-1">
                      {g.memberAvatars.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-[26px] h-[26px] rounded-full border-2 border-white object-cover box-border" style={{ marginLeft: i === 0 ? 0 : -8 }} />
                      ))}
                    </div>
                    <p className="mt-2.5 text-sm font-semibold text-neutral-900 leading-5">{g.name}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600">
                      {g.privacy === 'PRIVATE' && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                      )}
                      {g.membersCount} membros
                    </p>
                  </button>
                  {g.myStatus === 'ACTIVE' ? (
                    <button onClick={() => leaveGroup(g)} className="btn-outline h-[38px] mt-3 text-[13px]">Participando</button>
                  ) : g.myStatus === 'PENDING' ? (
                    <span className="h-[38px] mt-3 flex items-center justify-center text-[13px] text-neutral-500">Pendente</span>
                  ) : (
                    <button onClick={() => joinGroup(g)} className="btn-primary h-[38px] mt-3 text-[13px]">Participar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
