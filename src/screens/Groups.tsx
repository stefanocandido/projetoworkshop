import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface GroupsProps {
  userId: string
}

interface GroupItem {
  id: string
  name: string
  slug: string
  description: string | null
  avatarUrl: string
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

export default function Groups({ userId }: GroupsProps) {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, description, avatar_url, members_count, privacy, group_members(user_id, status)')
      .is('deleted_at', null)
      .order('members_count', { ascending: false })

    if (!error && data) {
      setGroups(
        data.map((g: any) => {
          const mine = (g.group_members ?? []).find((m: any) => m.user_id === userId)
          return {
            id: g.id,
            name: g.name,
            slug: g.slug,
            description: g.description,
            avatarUrl: g.avatar_url ?? `https://picsum.photos/seed/${g.id}/200/200`,
            membersCount: g.members_count ?? 0,
            privacy: g.privacy,
            myStatus: mine ? mine.status : null,
          }
        })
      )
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const joinGroup = async (group: GroupItem) => {
    const status = group.privacy === 'PUBLIC' ? 'ACTIVE' : 'PENDING'
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'MEMBER', status })

    if (!error) loadGroups()
  }

  const leaveGroup = async (group: GroupItem) => {
    await supabase.from('group_members').delete().match({ group_id: group.id, user_id: userId })
    loadGroups()
  }

  const openGroup = async (group: GroupItem) => {
    setActiveGroup(group)
    const { data } = await supabase
      .from('group_members')
      .select('user_id, role, profiles(name, handle, avatar_url)')
      .eq('group_id', group.id)
      .eq('status', 'ACTIVE')

    setMembers(
      (data ?? []).map((m: any) => ({
        userId: m.user_id,
        name: m.profiles?.name ?? 'Usuário',
        handle: m.profiles?.handle ?? '',
        avatarUrl: m.profiles?.avatar_url ?? `https://picsum.photos/seed/${m.user_id}/100/100`,
        role: m.role,
      }))
    )
  }

  const createGroup = async () => {
    setCreateError(null)
    const name = newName.trim()
    if (!name) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const { error } = await supabase
      .from('groups')
      .insert({ name, slug, description: newDesc.trim() || null, privacy: 'PUBLIC' })

    if (error) {
      setCreateError('Não foi possível criar o grupo.')
      return
    }

    setShowCreate(false)
    setNewName('')
    setNewDesc('')
    loadGroups()
  }

  if (activeGroup) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setActiveGroup(null)} className="text-accent-500 font-semibold mb-4">
            ← Voltar
          </button>

          <div className="flex items-center gap-4 mb-6">
            <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="w-20 h-20 rounded-2xl object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{activeGroup.name}</h1>
              <p className="text-neutral-500">{activeGroup.membersCount} membros</p>
            </div>
          </div>

          {activeGroup.description && <p className="text-neutral-700 mb-6">{activeGroup.description}</p>}

          <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Membros</h2>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                <img src={m.avatarUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{m.name}</p>
                  <p className="text-sm text-neutral-500 truncate">@{m.handle}</p>
                </div>
                {m.role !== 'MEMBER' && (
                  <span className="text-xs font-semibold text-accent-700 bg-accent-50 px-2 py-1 rounded-full">
                    {m.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Grupos</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Criar grupo</button>
        </div>

        {showCreate && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-neutral-200 space-y-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do grupo" className="input" />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="input" />
            <div className="flex gap-2">
              <button onClick={createGroup} className="btn-primary">Criar</button>
              <button onClick={() => setShowCreate(false)} className="btn-outline">Cancelar</button>
            </div>
            {createError && <p className="text-error text-sm">{createError}</p>}
          </div>
        )}

        {loading && <p className="text-center text-neutral-500 py-8">Carregando grupos...</p>}

        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
              <button onClick={() => openGroup(g)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <img src={g.avatarUrl} alt={g.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{g.name}</p>
                  <p className="text-sm text-neutral-500">{g.membersCount} membros</p>
                </div>
              </button>

              {g.myStatus === 'ACTIVE' && (
                <button onClick={() => leaveGroup(g)} className="btn-outline flex-shrink-0">Sair</button>
              )}
              {g.myStatus === 'PENDING' && (
                <span className="text-sm text-neutral-500 flex-shrink-0">Pendente</span>
              )}
              {!g.myStatus && (
                <button onClick={() => joinGroup(g)} className="btn-primary flex-shrink-0">
                  {g.privacy === 'PUBLIC' ? 'Entrar' : 'Solicitar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
