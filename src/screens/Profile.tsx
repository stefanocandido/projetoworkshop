import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from './Home'

interface ProfileProps {
  userId: string
  onNavigate: (view: View) => void
}

type Tab = 'posts' | 'saved' | 'groups' | 'about'

interface ProfileData {
  name: string
  handle: string
  avatarUrl: string
  coverUrl: string
  bio: string | null
  location: string | null
  followersCount: number
  followingCount: number
  createdAt: string
}

interface GridPost {
  id: string
  image: string
}

interface GroupItem {
  id: string
  name: string
  coverUrl: string
  role: string
}

export default function Profile({ userId, onNavigate }: ProfileProps) {
  const [tab, setTab] = useState<Tab>('posts')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [posts, setPosts] = useState<GridPost[]>([])
  const [saved, setSaved] = useState<GridPost[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: p }, { data: myPosts }, { data: myInterests }] = await Promise.all([
      supabase
        .from('profiles')
        .select('name, handle, avatar_url, cover_url, bio, location, followers_count, following_count, created_at')
        .eq('id', userId)
        .single(),
      supabase
        .from('posts')
        .select('id, created_at, post_media(order, media(url))')
        .eq('author_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_interests')
        .select('interests(name)')
        .eq('user_id', userId),
    ])

    if (p) {
      setProfile({
        name: p.name,
        handle: p.handle,
        avatarUrl: p.avatar_url ?? `https://picsum.photos/seed/${userId}/200/200`,
        coverUrl: p.cover_url ?? `https://picsum.photos/seed/cover-${userId}/800/400`,
        bio: p.bio,
        location: p.location,
        followersCount: p.followers_count ?? 0,
        followingCount: p.following_count ?? 0,
        createdAt: p.created_at,
      })
      setEditName(p.name)
      setEditBio(p.bio ?? '')
      setEditLocation(p.location ?? '')
    }

    setPosts(
      (myPosts ?? []).map((post: any) => ({
        id: post.id,
        image: post.post_media?.[0]?.media?.url ?? `https://picsum.photos/seed/${post.id}/400/400`,
      }))
    )

    setInterests((myInterests ?? []).map((i: any) => i.interests?.name).filter(Boolean))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (tab === 'saved') loadSaved()
    if (tab === 'groups') loadGroups()
  }, [tab])

  const loadSaved = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('post_id, posts(id, post_media(order, media(url)))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setSaved(
      (data ?? [])
        .filter((b: any) => b.posts)
        .map((b: any) => ({
          id: b.posts.id,
          image: b.posts.post_media?.[0]?.media?.url ?? `https://picsum.photos/seed/${b.posts.id}/400/400`,
        }))
    )
  }

  const loadGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('role, groups(id, name, avatar_url)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')

    setGroups(
      (data ?? [])
        .filter((m: any) => m.groups)
        .map((m: any) => ({
          id: m.groups.id,
          name: m.groups.name,
          coverUrl: m.groups.avatar_url ?? `https://picsum.photos/seed/${m.groups.id}/300/200`,
          role: m.role === 'OWNER' ? 'Criador' : m.role === 'ADMIN' ? 'Administrador' : 'Membro',
        }))
    )
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: editName.trim(), bio: editBio.trim() || null, location: editLocation.trim() || null })
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'posts', label: 'Publicações' },
    { id: 'saved', label: 'Salvos' },
    { id: 'groups', label: 'Grupos' },
    { id: 'about', label: 'Sobre' },
  ]

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-4 lg:pt-0">
        <div className="h-[148px] lg:h-[200px] rounded-xl lg:rounded-2xl overflow-hidden">
          <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-7 -mt-8 lg:-mt-10 mx-2 lg:mx-6 relative">
          <div className="flex flex-wrap items-end gap-4 lg:gap-5">
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-[72px] h-[72px] lg:w-24 lg:h-24 rounded-full border-4 border-white object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-[160px]">
              <h1 className="text-lg lg:text-[22px] font-bold text-neutral-900">{profile.name}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                @{profile.handle}
                {profile.location && ` · ${profile.location}`}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setEditing(v => !v)} className="btn-outline h-[42px] px-5 text-sm">
                Editar perfil
              </button>
              <button onClick={() => onNavigate('groups')} className="btn-primary h-[42px] px-5 text-sm">
                Meus grupos
              </button>
            </div>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" className="input" />
              <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Localização" className="input" />
              <input value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio" className="input" />
              <div className="flex gap-2">
                <button onClick={saveProfile} className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-outline">Cancelar</button>
              </div>
            </div>
          ) : (
            profile.bio && <p className="mt-4 text-sm leading-6 text-neutral-900 max-w-[60ch]">{profile.bio}</p>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm text-neutral-900">
            <span><strong>{profile.followersCount}</strong> <span className="text-neutral-500">seguidores</span></span>
            <span><strong>{profile.followingCount}</strong> <span className="text-neutral-500">seguindo</span></span>
          </div>

          {interests.length > 0 && (
            <div className="flex gap-2 mt-3.5 flex-wrap">
              {interests.map(name => (
                <span key={name} className="h-8 px-3.5 rounded-full bg-accent-50 border border-accent-300 text-accent-700 text-[13px] font-medium flex items-center">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 lg:gap-7 h-12 lg:h-[52px] mt-4 lg:mt-5 mx-2 lg:mx-6 border-b border-neutral-200 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-full px-0.5 text-sm font-semibold border-b-2 flex-shrink-0 ${
                tab === t.id ? 'border-accent-500 text-neutral-900' : 'border-transparent text-neutral-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="my-5 mx-2 lg:mx-6">
          {tab === 'posts' && (
            posts.length === 0 ? (
              <p className="text-center text-neutral-500 py-12">Você ainda não publicou nada.</p>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                {posts.map(post => (
                  <img key={post.id} src={post.image} alt="" className="w-full aspect-square object-cover rounded-md" />
                ))}
              </div>
            )
          )}

          {tab === 'saved' && (
            saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4h12v16l-6-4-6 4Z" />
                </svg>
                <p className="mt-3.5 text-[15px] font-semibold text-neutral-900">Nada salvo ainda</p>
                <p className="mt-1.5 text-[13px] text-neutral-600 max-w-[280px]">
                  Toque no ícone de salvar em qualquer publicação para guardá-la aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                {saved.map(post => (
                  <img key={post.id} src={post.image} alt="" className="w-full aspect-square object-cover rounded-md" />
                ))}
              </div>
            )
          )}

          {tab === 'groups' && (
            groups.length === 0 ? (
              <p className="text-center text-neutral-500 py-12">Você ainda não entrou em nenhum grupo.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(g => (
                  <button key={g.id} onClick={() => onNavigate('groups')} className="bg-white rounded-lg p-3 text-left">
                    <img src={g.coverUrl} alt="" className="w-full h-[88px] object-cover rounded-md" />
                    <p className="mt-2.5 text-sm font-semibold text-neutral-900">{g.name}</p>
                    <p className="mt-1 text-xs text-neutral-600">{g.role}</p>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'about' && (
            <div className="bg-white rounded-2xl p-6 max-w-xl">
              <p className="text-[13px] font-semibold text-neutral-500">Localização</p>
              <p className="mt-1.5 text-sm text-neutral-900">{profile.location ?? 'Não informado'}</p>
              <div className="h-px bg-neutral-200 my-4" />
              <p className="text-[13px] font-semibold text-neutral-500">Interesses</p>
              <p className="mt-1.5 text-sm text-neutral-900">
                {interests.length > 0 ? interests.join(', ') : 'Nenhum interesse definido ainda.'}
              </p>
              <div className="h-px bg-neutral-200 my-4" />
              <p className="text-[13px] font-semibold text-neutral-500">No Gooday desde</p>
              <p className="mt-1.5 text-sm text-neutral-900">
                {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
