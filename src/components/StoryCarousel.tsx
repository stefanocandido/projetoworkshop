import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'

interface StoryCarouselProps {
  userId: string
  mobile?: boolean
}

interface StoryCard {
  storyId: string
  authorId: string
  name: string
  avatarUrl: string
  imageUrl: string
  createdAt: string
}

const REACTIONS = ['❤️', '👏', '🔥', '😍']

export default function StoryCarousel({ userId, mobile = false }: StoryCarouselProps) {
  const [stories, setStories] = useState<StoryCard[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [reply, setReply] = useState('')
  const [sentFeedback, setSentFeedback] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('id, author_id, created_at, author:profiles!stories_author_id_fkey(name, avatar_url), media(url)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (error || !data) return

    const seen = new Set<string>()
    const cards: StoryCard[] = []
    for (const row of data as any[]) {
      if (seen.has(row.author_id)) continue
      seen.add(row.author_id)
      cards.push({
        storyId: row.id,
        authorId: row.author_id,
        name: row.author?.name ?? 'Usuário',
        avatarUrl: row.author?.avatar_url ?? `https://picsum.photos/seed/${row.author_id}/100/100`,
        imageUrl: row.media?.[0]?.url ?? `https://picsum.photos/seed/story-${row.author_id}/400/700`,
        createdAt: row.created_at,
      })
    }
    setStories(cards)
  }

  const openStory = (index: number) => {
    setOpenIndex(index)
    setReply('')
    setSentFeedback(null)
    const story = stories[index]
    if (story) {
      supabase.from('story_views').upsert({ story_id: story.storyId, viewer_id: userId }, { onConflict: 'story_id,viewer_id' }).then()
    }
  }

  const closeStory = () => setOpenIndex(null)

  const goPrev = () => {
    if (openIndex === null) return
    const next = openIndex === 0 ? stories.length - 1 : openIndex - 1
    openStory(next)
  }

  const goNext = () => {
    if (openIndex === null) return
    const next = openIndex === stories.length - 1 ? 0 : openIndex + 1
    openStory(next)
  }

  const sendReply = async (text: string) => {
    if (openIndex === null || !text.trim()) return
    const story = stories[openIndex]
    const { error } = await supabase.from('story_replies').insert({ story_id: story.storyId, sender_id: userId, body: text.trim() })
    if (!error) {
      setReply('')
      setSentFeedback(text)
      setTimeout(() => setSentFeedback(null), 1500)
    }
  }

  if (stories.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum story ativo no momento.</p>
  }

  const cardSize = mobile ? 'w-24 h-32' : 'w-32 h-[174px]'
  const active = openIndex !== null ? stories[openIndex] : null

  return (
    <>
      <div className={`flex overflow-x-auto pb-2 ${mobile ? 'gap-2' : 'gap-2.5'}`}>
        {stories.map((story, i) => (
          <button
            key={story.authorId}
            onClick={() => openStory(i)}
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

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center gap-7">
          <button
            onClick={closeStory}
            aria-label="Fechar visualização de stories"
            className="absolute inset-0 bg-neutral-950/70 cursor-default"
          />

          <button
            onClick={goPrev}
            aria-label="Story anterior"
            className="hidden lg:flex relative flex-shrink-0 w-12 h-12 items-center justify-center rounded-full bg-neutral-950/55 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6 9 12l6 6" />
            </svg>
          </button>

          <div
            role="dialog"
            aria-label={`Story de ${active.name}`}
            className="relative flex-shrink-0 w-full h-full lg:w-[420px] lg:h-[760px] bg-white lg:rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex-shrink-0 px-4 pt-3.5 pb-2.5">
              <div className="flex gap-1">
                {stories.map((_, i) => (
                  <span
                    key={i}
                    className={`flex-1 h-[3px] rounded ${i <= openIndex! ? 'bg-accent-500' : 'bg-white/35'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2.5 mt-3">
                <img src={active.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 truncate">{active.name}</p>
                  <p className="text-xs text-neutral-500">{timeAgo(active.createdAt)}</p>
                </div>
                <button onClick={closeStory} aria-label="Fechar story" className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-600 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6 18 18M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <img src={active.imageUrl} alt="" className="w-full h-full object-cover" />
              {/* tap zones para navegar no mobile */}
              <button onClick={goPrev} aria-label="Story anterior" className="lg:hidden absolute inset-y-0 left-0 w-1/3" />
              <button onClick={goNext} aria-label="Próximo story" className="lg:hidden absolute inset-y-0 right-0 w-1/3" />
              {sentFeedback && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-950/70 text-white text-sm px-4 py-2 rounded-full">
                  Enviado {sentFeedback}
                </span>
              )}
            </div>

            <div className="flex-shrink-0 px-4 py-3.5 flex items-center gap-2.5">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReply(reply)}
                placeholder="Responder..."
                className="flex-1 min-w-0 h-11 px-4 rounded-full border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 outline-none"
              />
              {REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => sendReply(emoji)} aria-label={`Reagir com ${emoji}`} className="flex-shrink-0 text-xl p-1">
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={goNext}
            aria-label="Próximo story"
            className="hidden lg:flex relative flex-shrink-0 w-12 h-12 items-center justify-center rounded-full bg-neutral-950/55 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
