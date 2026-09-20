import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import FeedCard from '../components/FeedCard'
import StoryCarousel from '../components/StoryCarousel'
import GroupsRail from '../components/GroupsRail'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'

interface HomeProps {
  onLogout: () => void
  userId: string
}

interface FeedItem {
  id: string
  author: string
  avatar: string
  timestamp: string
  content: string
  image: string | null
  likes: number
  comments: number
  isLiked: boolean
}

export default function Home({ onLogout, userId }: HomeProps) {
  const [activeTab, setActiveTab] = useState('home')
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, body, created_at, likes_count, comments_count,
        author:profiles!posts_author_id_fkey ( name, avatar_url ),
        post_media ( order, media ( url ) ),
        likes ( user_id )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    const items: FeedItem[] = (data ?? []).map((post: any) => ({
      id: post.id,
      author: post.author?.name ?? 'Usuário',
      avatar: post.author?.avatar_url ?? `https://picsum.photos/seed/${post.id}/100/100`,
      timestamp: new Date(post.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      content: post.body,
      image: post.post_media?.[0]?.media?.url ?? null,
      likes: post.likes_count ?? 0,
      comments: post.comments_count ?? 0,
      isLiked: (post.likes ?? []).some((l: any) => l.user_id === userId),
    }))

    setFeedItems(items)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleLike = async (postId: string, isLiked: boolean) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === postId
          ? { ...item, isLiked: !isLiked, likes: isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    )

    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: userId, post_id: postId })
    } else {
      const { error } = await supabase.from('likes').insert({ user_id: userId, post_id: postId })
      if (error) {
        // reverte otimismo se o insert falhar (ex.: RLS, post não visível)
        setFeedItems(items =>
          items.map(item =>
            item.id === postId ? { ...item, isLiked, likes: isLiked ? item.likes + 1 : item.likes - 1 } : item
          )
        )
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-white lg:bg-canvas">
      <Header onLogout={onLogout} />

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 overflow-y-auto border-x border-neutral-200 px-6 py-6">
          <div className="mb-8">
            <StoryCarousel />
          </div>

          <FeedList
            items={feedItems}
            loading={loading}
            error={loadError}
            onLike={handleLike}
          />
        </div>

        <GroupsRail />
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-200 overflow-x-auto">
          <StoryCarousel mobile />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FeedList
            items={feedItems}
            loading={loading}
            error={loadError}
            onLike={handleLike}
          />
        </div>

        <div className="px-4 py-4 border-t border-neutral-200 overflow-x-auto">
          <GroupsRail mobile />
        </div>
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

function FeedList({
  items,
  loading,
  error,
  onLike,
}: {
  items: FeedItem[]
  loading: boolean
  error: string | null
  onLike: (postId: string, isLiked: boolean) => void
}) {
  if (loading) {
    return <p className="text-center text-neutral-500 py-12">Carregando feed...</p>
  }

  if (error) {
    return (
      <p className="text-center text-error bg-red-50 rounded-lg py-4 px-4">
        Não foi possível carregar o feed: {error}
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-neutral-500 py-12">
        Ainda não há publicações. Seja o primeiro a postar!
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {items.map(item => (
        <FeedCard
          key={item.id}
          {...item}
          image={item.image ?? `https://picsum.photos/seed/${item.id}/800/600`}
          onLike={() => onLike(item.id, item.isLiked)}
        />
      ))}
    </div>
  )
}
