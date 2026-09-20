import { useEffect, useState } from 'react'
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

interface PostResult {
  id: string
  authorName: string
  body: string
}

export default function Search({ userId }: SearchProps) {
  const [query, setQuery] = useState('')
  const [profiles, setProfiles] = useState<ProfileResult[]>([])
  const [posts, setPosts] = useState<PostResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setProfiles([])
      setPosts([])
      setSearched(false)
      return
    }

    const timeout = setTimeout(() => runSearch(trimmed), 400)
    return () => clearTimeout(timeout)
  }, [query])

  const runSearch = async (term: string) => {
    setLoading(true)
    setSearched(true)

    const [profilesRes, postsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, handle, avatar_url, follows!follows_following_id_fkey(follower_id)')
        .or(`name.ilike.%${term}%,handle.ilike.%${term}%`)
        .neq('id', userId)
        .limit(15),
      supabase
        .from('posts')
        .select('id, body, author:profiles!posts_author_id_fkey(name)')
        .is('deleted_at', null)
        .ilike('body', `%${term}%`)
        .limit(15),
    ])

    if (!profilesRes.error && profilesRes.data) {
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

    if (!postsRes.error && postsRes.data) {
      setPosts(
        postsRes.data.map((p: any) => ({
          id: p.id,
          authorName: p.author?.name ?? 'Usuário',
          body: p.body,
        }))
      )
    }

    setLoading(false)
    await supabase.from('search_history').insert({ user_id: userId, query: term })
  }

  const toggleFollow = async (profileId: string, isFollowing: boolean) => {
    setProfiles(list =>
      list.map(p => (p.id === profileId ? { ...p, isFollowing: !isFollowing } : p))
    )

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: profileId })
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: profileId })
      if (error) {
        setProfiles(list =>
          list.map(p => (p.id === profileId ? { ...p, isFollowing } : p))
        )
      }
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Buscar</h1>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar pessoas ou publicações..."
          className="input mb-8"
          autoFocus
        />

        {loading && <p className="text-center text-neutral-500 py-8">Buscando...</p>}

        {!loading && searched && profiles.length === 0 && posts.length === 0 && (
          <p className="text-center text-neutral-500 py-8">Nenhum resultado para "{query}".</p>
        )}

        {!loading && profiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Pessoas</h2>
            <div className="space-y-3">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                  <img src={p.avatarUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-sm text-neutral-500 truncate">@{p.handle}</p>
                  </div>
                  <button
                    onClick={() => toggleFollow(p.id, p.isFollowing)}
                    className={p.isFollowing ? 'btn-outline' : 'btn-primary'}
                  >
                    {p.isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Publicações</h2>
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="p-4 bg-white rounded-lg border border-neutral-200">
                  <p className="font-semibold text-neutral-900 mb-1">{p.authorName}</p>
                  <p className="text-neutral-700">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <p className="text-center text-neutral-500 py-8">Digite pelo menos 2 letras para buscar.</p>
        )}
      </div>
    </div>
  )
}
