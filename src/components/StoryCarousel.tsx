import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface StoryCarouselProps {
  mobile?: boolean
}

interface StoryAuthor {
  authorId: string
  name: string
  avatarUrl: string
  hasUnseenStory: boolean
}

export default function StoryCarousel({ mobile = false }: StoryCarouselProps) {
  const [authors, setAuthors] = useState<StoryAuthor[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('author_id, author:profiles!stories_author_id_fkey ( name, avatar_url )')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })

      if (error || !data) return

      const seen = new Set<string>()
      const unique: StoryAuthor[] = []
      for (const row of data as any[]) {
        if (seen.has(row.author_id)) continue
        seen.add(row.author_id)
        unique.push({
          authorId: row.author_id,
          name: row.author?.name ?? 'Usuário',
          avatarUrl: row.author?.avatar_url ?? `https://picsum.photos/seed/${row.author_id}/100/100`,
          hasUnseenStory: true,
        })
      }
      setAuthors(unique)
    }

    load()
  }, [])

  if (authors.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum story ativo no momento.</p>
  }

  const avatarSize = mobile ? 'w-16 h-16' : 'w-16 h-16 md:w-20 md:h-20'

  return (
    <div className={`flex overflow-x-auto pb-2 ${mobile ? 'gap-3' : 'gap-4'}`}>
      {authors.map(story => (
        <div key={story.authorId} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer">
          <div
            className={`relative rounded-full border-2 p-1 transition-colors ${
              story.hasUnseenStory ? 'border-accent-500' : 'border-neutral-300'
            } hover:opacity-80`}
          >
            <img
              src={story.avatarUrl}
              alt={story.name}
              className={`${avatarSize} rounded-full object-cover`}
            />
          </div>
          <span className="text-xs text-neutral-700 text-center max-w-16 truncate">
            {story.name}
          </span>
        </div>
      ))}
    </div>
  )
}
