import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface GroupsRailProps {
  mobile?: boolean
}

interface GroupItem {
  id: string
  name: string
  avatarUrl: string
  membersCount: number
}

export default function GroupsRail({ mobile = false }: GroupsRailProps) {
  const [groups, setGroups] = useState<GroupItem[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, avatar_url, members_count')
        .is('deleted_at', null)
        .eq('privacy', 'PUBLIC')
        .order('members_count', { ascending: false })
        .limit(6)

      if (error || !data) return

      setGroups(
        data.map((g: any) => ({
          id: g.id,
          name: g.name,
          avatarUrl: g.avatar_url ?? `https://picsum.photos/seed/${g.id}/200/200`,
          membersCount: g.members_count ?? 0,
        }))
      )
    }

    load()
  }, [])

  const handleJoin = async (groupId: string) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    await supabase.from('group_members').insert({ group_id: groupId, user_id: userData.user.id })
  }

  if (groups.length === 0) {
    return mobile ? null : (
      <aside className="w-80 bg-white border-l border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">Nenhum grupo público ainda.</p>
      </aside>
    )
  }

  if (mobile) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {groups.map(group => (
          <div
            key={group.id}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={group.avatarUrl}
              alt={group.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <span className="text-xs text-neutral-700 text-center max-w-16 truncate">
              {group.name}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside className="w-80 bg-white border-l border-neutral-200 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-neutral-900 mb-6">Grupos para você</h2>

      <div className="space-y-4">
        {groups.map(group => (
          <div
            key={group.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <img
              src={group.avatarUrl}
              alt={group.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">{group.name}</h3>
              <p className="text-sm text-neutral-500">
                {group.membersCount.toLocaleString('pt-BR')} membros
              </p>
            </div>
            <button
              onClick={() => handleJoin(group.id)}
              className="flex-shrink-0 text-accent-500 hover:text-accent-600 transition-colors text-sm font-semibold"
            >
              Entrar
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
