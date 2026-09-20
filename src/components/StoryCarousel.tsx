import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface StoryCarouselProps {
  mobile?: boolean
}

interface StoryCard {
  authorId: string
  name: string
  avatarUrl: string
  imageUrl: string
}

export default function StoryCarousel({ mobile = false }: StoryCarouselProps) {
  const [stories, setStories] = useState<StoryCard[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('author_id, author:profiles!stories_author_id_fkey(name, avatar_url), media(url)')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })

      if (error || !data) return

      const seen = new Set<string>()
      const cards: StoryCard[] = []
      for (const row of data as any[]) {
        if (seen.has(row.author_id)) continue
        seen.add(row.author_id)
        cards.push({
          authorId: row.author_id,
          name: row.author?.name ?? 'Usuário',
          avatarUrl: row.author?.avatar_url ?? `https://picsum.photos/seed/${row.author_id}/100/100`,
          imageUrl: row.media?.[0]?.url ?? `https://picsum.photos/seed/story-${row.author_id}/300/400`,
        })
      }
      setStories(cards)
    }

    load()
  }, [])

  if (stories.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum story ativo no momento.</p>
  }

  const cardSize = mobile ? 'w-24 h-32' : 'w-32 h-[174px]'

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2">
      {stories.map(story => (
        <button
          key={story.authorId}
          className={`relative ${cardSize} flex-shrink-0 rounded-2xl overflow-hidden`}
          aria-label={`Ver story de ${story.name}`}
        >
          <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
          <span className="absolute left-2.5 bottom-2.5 block w-9 h-9 rounded-full p-0.5 bg-accent-500 box-border">
            <img src={story.avatarUrl} alt="" className="w-full h-full object-cover rounded-full border-2 border-white box-border" />
          </span>
        </button>
      ))}
    </div>
  )
}
