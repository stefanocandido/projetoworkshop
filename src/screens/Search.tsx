import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

interface SearchProps {
  userId: string
}

interface ProfileResult {
  id: string
  name: string
  handle: string
  avatarUrl: string
  isFollowing: boolean
}

interface GroupResult {
  id: string
  name: string
  coverUrl: string
  membersCount: number
}

export default function Search({ userId }: SearchProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'pessoas' | 'grupos'>('pessoas')
  const [profiles, setProfiles] = useState<ProfileResult[]>([])
  const [groups, setGroups] = useState<GroupResult[]>([])
  const [recents, setRecents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
    loadRecents()
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return
    const timeout = setTimeout(() => {
      supabase.from('search_history').insert({ user_id: userId, query: term }).then(() => loadRecents())
    }, 800)
    return () => clearTimeout(timeout)
  }, [query, userId])

  const loadAll = async () => {
    setLoading(true)
    const [profilesRes, groupsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, handle, avatar_url, follows!follows_following_id_fkey(follower_id)')
        .neq('id', userId)
        .limit(50),
      supabase
        .from('groups')
        .select('id, name, avatar_url, members_count')
        .eq('privacy', 'PUBLIC')
        .is('deleted_at', null)
        .limit(50),
    ])

    if (profilesRes.data) {
      setProfiles(
        profilesRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          handle: p.handle,
          avatarUrl: p.avatar_url ?? `https://picsum.photos/seed/${p.id}/100/100`,
          isFollowing: (p.follows ?? []).some((f: any) => f.follower_id === userId),
        }))
      )
    }

    if (groupsRes.data) {
      setGroups(
        groupsRes.data.map((g: any) => ({
          id: g.id,
          name: g.name,
          coverUrl: g.avatar_url ?? `https://picsum.photos/seed/${g.id}/300/200`,
          membersCount: g.members_count ?? 0,
        }))
      )
    }

    setLoading(false)
  }

  const loadRecents = async () => {
    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    const unique: string[] = []
    for (const row of data ?? []) {
      if (!unique.includes(row.query)) unique.push(row.query)
      if (unique.length === 4) break
    }
    setRecents(unique)
  }

  const q = query.trim().toLowerCase()
  const filteredPeople = useMemo(
    () => profiles.filter(p => !q || p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)),
    [profiles, q]
  )
  const filteredGroups = useMemo(
    () => groups.filter(g => !q || g.name.toLowerCase().includes(q)),
    [groups, q]
  )

  const toggleFollow = async (profileId: string, isFollowing: boolean) => {
    setProfiles(list => list.map(p => (p.id === profileId ? { ...p, isFollowing: !isFollowing } : p)))
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: profileId })
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: profileId })
      if (error) setProfiles(list => list.map(p => (p.id === profileId ? { ...p, isFollowing } : p)))
    }
  }

  const noResults = tab === 'pessoas' ? filteredPeople.length === 0 : filteredGroups.length === 0

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-0 lg:pt-0 pb-20 lg:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="O que deseja fazer de bom hoje?"
            className="input h-14 pl-[52px]"
            autoFocus
          />
          <span className="absolute inset-y-0 left-[18px] flex items-center text-neutral-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </span>
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
              className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {recents.length > 0 && (
          <div className="mt-[18px] flex items-center gap-2.5 flex-wrap">
            <span className="text-[13px] text-neutral-500 mr-1">Recentes:</span>
            {recents.map(r => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                className="h-9 px-4 rounded-full border border-neutral-200 bg-white text-neutral-900 text-[13px] font-medium"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 h-11">
          <button
            onClick={() => setTab('pessoas')}
            className={`h-11 px-1 mr-5 text-[15px] font-semibold border-b-2 ${
              tab === 'pessoas' ? 'border-accent-500 text-neutral-900' : 'border-transparent text-neutral-600'
            }`}
          >
            Pessoas · {filteredPeople.length}
          </button>
          <button
            onClick={() => setTab('grupos')}
            className={`h-11 px-1 text-[15px] font-semibold border-b-2 ${
              tab === 'grupos' ? 'border-accent-500 text-neutral-900' : 'border-transparent text-neutral-600'
            }`}
          >
            Grupos · {filteredGroups.length}
          </button>
        </div>

        <div className="mt-2">
          {loading ? (
            <p className="text-center text-neutral-500 py-12">Carregando...</p>
          ) : noResults ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <p className="mt-4 text-base font-semibold text-neutral-900">Nenhum resultado</p>
              <p className="mt-1.5 text-sm text-neutral-600 max-w-[320px]">
                Tente buscar por outro nome, hashtag ou interesse como corrida, yoga ou nutrição.
              </p>
            </div>
          ) : tab === 'pessoas' ? (
            <div className="flex flex-col gap-2.5">
              {filteredPeople.map(p => (
                <div key={p.id} className="flex items-center gap-3.5 bg-white rounded-xl px-4 py-3">
                  <img src={p.avatarUrl} alt="" className="w-[52px] h-[52px] rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-900 truncate">{p.name}</p>
                    <p className="mt-0.5 text-[13px] text-neutral-500 truncate">@{p.handle}</p>
                  </div>
                  <button
                    onClick={() => toggleFollow(p.id, p.isFollowing)}
                    className="flex-shrink-0 h-[38px] px-4 rounded-full border border-neutral-200 text-neutral-900 text-[13px] font-semibold"
                  >
                    {p.isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(g => (
                <div key={g.id} className="bg-white rounded-2xl p-3">
                  <img src={g.coverUrl} alt="" className="w-full h-24 object-cover rounded-[14px]" />
                  <p className="mt-3 text-sm font-semibold text-neutral-900 leading-5">{g.name}</p>
                  <p className="mt-1.5 text-[13px] text-neutral-600">{g.membersCount} membros</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
