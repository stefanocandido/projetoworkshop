import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface GroupsRailProps {
  userId: string
  mobile?: boolean
}

interface GroupCard {
  id: string
  name: string
  coverUrl: string
  memberAvatars: string[]
  membersCount: number
}

interface PersonCard {
  id: string
  name: string
  handle: string
  avatarUrl: string
  isFollowing: boolean
}

export default function GroupsRail({ userId, mobile = false }: GroupsRailProps) {
  const [tab, setTab] = useState<'grupos' | 'pessoas'>('grupos')
  const [groups, setGroups] = useState<GroupCard[]>([])
  const [people, setPeople] = useState<PersonCard[]>([])

  useEffect(() => {
    loadGroups()
    if (!mobile) loadPeople()
  }, [])

  const loadGroups = async () => {
    const { data } = await supabase
      .from('groups')
      .select('id, name, avatar_url, members_count, group_members(user_id, profiles(avatar_url))')
      .eq('privacy', 'PUBLIC')
      .is('deleted_at', null)
      .order('members_count', { ascending: false })
      .limit(4)

    setGroups(
      (data ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        coverUrl: g.avatar_url ?? `https://picsum.photos/seed/${g.id}/300/200`,
        memberAvatars: (g.group_members ?? [])
          .slice(0, 3)
          .map((m: any) => m.profiles?.avatar_url ?? `https://picsum.photos/seed/${m.user_id}/100/100`),
        membersCount: g.members_count ?? 0,
      }))
    )
  }

  const loadPeople = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, handle, avatar_url, follows!follows_following_id_fkey(follower_id)')
      .neq('id', userId)
      .limit(9)

    setPeople(
      (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        handle: `@${p.handle}`,
        avatarUrl: p.avatar_url ?? `https://picsum.photos/seed/${p.id}/100/100`,
        isFollowing: (p.follows ?? []).some((f: any) => f.follower_id === userId),
      }))
    )
  }

  const toggleFollow = async (personId: string, isFollowing: boolean) => {
    setPeople(list => list.map(p => (p.id === personId ? { ...p, isFollowing: !isFollowing } : p)))

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: personId })
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: personId })
      if (error) setPeople(list => list.map(p => (p.id === personId ? { ...p, isFollowing } : p)))
    }
  }

  if (mobile) {
    if (groups.length === 0) return null
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {groups.map(g => (
          <div key={g.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
            <img src={g.coverUrl} alt={g.name} className="w-16 h-16 rounded-full object-cover" />
            <span className="text-xs text-neutral-700 text-center truncate w-full">{g.name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside aria-label="Grupos e pessoas" className="w-[384px] flex-shrink-0 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 h-11 flex-shrink-0">
        <button
          onClick={() => setTab('grupos')}
          className={`h-11 px-1 mr-4 text-[15px] border-b-2 ${
            tab === 'grupos' ? 'border-accent-500 font-semibold text-neutral-900' : 'border-transparent font-medium text-neutral-600'
          }`}
        >
          Grupos
        </button>
        <button
          onClick={() => setTab('pessoas')}
          className={`h-11 px-1 text-[15px] border-b-2 ${
            tab === 'pessoas' ? 'border-accent-500 font-semibold text-neutral-900' : 'border-transparent font-medium text-neutral-600'
          }`}
        >
          Pessoas
        </button>
      </div>

      {tab === 'grupos' ? (
        <div className="mt-3 grid grid-cols-2 gap-4 overflow-y-auto">
          {groups.map(g => (
            <div key={g.id} className="bg-white rounded-2xl p-3">
              <img src={g.coverUrl} alt={g.name} className="w-full h-[92px] object-cover rounded-[14px]" />
              <div className="flex -mt-4 ml-1 relative">
                {g.memberAvatars.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-white object-cover box-border"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-sm font-semibold text-neutral-900 leading-5">{g.name}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-neutral-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="8" r="3.2" />
                  <path d="M4.4 19a5.6 5.6 0 0 1 11.2 0" />
                  <path d="M16.8 11.4a2.7 2.7 0 1 0-1.9-4.6" />
                </svg>
                {g.membersCount} membros
              </p>
            </div>
          ))}
          {groups.length === 0 && <p className="col-span-2 text-sm text-neutral-500 py-4">Nenhum grupo público ainda.</p>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5 overflow-y-auto">
          {people.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5">
              <img src={p.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{p.name}</p>
                <p className="mt-0.5 text-[13px] text-neutral-500 truncate">{p.handle}</p>
              </div>
              <button
                onClick={() => toggleFollow(p.id, p.isFollowing)}
                className="flex-shrink-0 h-[34px] px-4 rounded-full border border-neutral-200 text-neutral-900 text-[13px] font-semibold"
              >
                {p.isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            </div>
          ))}
          {people.length === 0 && <p className="text-sm text-neutral-500 py-4">Nenhuma sugestão de pessoas por aqui.</p>}
        </div>
      )}
    </aside>
  )
}
