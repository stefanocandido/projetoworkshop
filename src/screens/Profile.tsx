import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ProfileProps {
  userId: string
}

interface ProfileData {
  name: string
  handle: string
  avatarUrl: string
  bio: string | null
  followersCount: number
  followingCount: number
  postsCount: number
}

interface OwnPost {
  id: string
  body: string
  image: string | null
  likes: number
  createdAt: string
}

export default function Profile({ userId }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<OwnPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: p }, { data: myPosts }] = await Promise.all([
      supabase
        .from('profiles')
        .select('name, handle, avatar_url, bio, followers_count, following_count, posts_count')
        .eq('id', userId)
        .single(),
      supabase
        .from('posts')
        .select('id, body, created_at, likes_count, post_media(media(url))')
        .eq('author_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ])

    if (p) {
      setProfile({
        name: p.name,
        handle: p.handle,
        avatarUrl: p.avatar_url ?? `https://picsum.photos/seed/${userId}/200/200`,
        bio: p.bio,
        followersCount: p.followers_count ?? 0,
        followingCount: p.following_count ?? 0,
        postsCount: p.posts_count ?? 0,
      })
      setEditName(p.name)
      setEditBio(p.bio ?? '')
    }

    setPosts(
      (myPosts ?? []).map((post: any) => ({
        id: post.id,
        body: post.body,
        image: post.post_media?.[0]?.media?.url ?? null,
        likes: post.likes_count ?? 0,
        createdAt: post.created_at,
      }))
    )

    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: editName.trim(), bio: editBio.trim() || null })
      .eq('id', userId)

    setSaving(false)
    if (!error) {
      setEditing(false)
      load()
    }
  }

  if (loading || !profile) {
    return <p className="flex-1 text-center text-neutral-500 py-12">Carregando perfil...</p>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900">{profile.name}</h1>
            <p className="text-neutral-500">@{profile.handle}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-outline">Editar perfil</button>
          )}
        </div>

        {editing ? (
          <div className="mb-6 p-4 bg-white rounded-lg border border-neutral-200 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1">Nome</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1">Bio</label>
              <input value={editBio} onChange={e => setEditBio(e.target.value)} className="input" placeholder="Conte um pouco sobre você" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveProfile} className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-outline">Cancelar</button>
            </div>
          </div>
        ) : (
          profile.bio && <p className="text-neutral-700 mb-6">{profile.bio}</p>
        )}

        <div className="flex gap-6 mb-8 py-4 border-y border-neutral-200">
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-900">{profile.postsCount}</p>
            <p className="text-sm text-neutral-500">Publicações</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-900">{profile.followersCount}</p>
            <p className="text-sm text-neutral-500">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-900">{profile.followingCount}</p>
            <p className="text-sm text-neutral-500">Seguindo</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Suas publicações</h2>
        {posts.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">Você ainda não publicou nada.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map(post => (
              <img
                key={post.id}
                src={post.image ?? `https://picsum.photos/seed/${post.id}/400/400`}
                alt={post.body}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
