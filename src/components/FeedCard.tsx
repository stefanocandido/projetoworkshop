interface FeedCardProps {
  id: string
  author: string
  avatar: string
  timestamp: string
  content: string
  image: string
  likes: number
  comments: number
  isLiked: boolean
  onLike: () => void
}

export default function FeedCard({
  author,
  avatar,
  timestamp,
  content,
  image,
  likes,
  comments,
  isLiked,
  onLike,
}: FeedCardProps) {
  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-neutral-900 truncate">{author}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500">
            <svg width="17" height="11" viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth="5">
              <circle cx="9.6" cy="11" r="6.7" />
              <circle cx="21.4" cy="11" r="6.7" />
            </svg>
            {timestamp}
          </p>
        </div>
        <button aria-label="Mais opções da publicação" className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <p className="mt-3.5 text-[15px] leading-6 text-neutral-900">{content}</p>

      {/* Image */}
      <img src={image} alt="" className="w-full h-80 object-cover rounded-2xl mt-4" />

      {/* Actions */}
      <div className="flex items-center gap-2.5 mt-4">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${
            isLiked ? 'bg-accent-50 border-accent-300 text-accent-700' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.8 6.8a4.4 4.4 0 0 0-6.3 0L12 8.3l-1.5-1.5a4.4 4.4 0 0 0-6.3 6.2l7.8 7.6 7.8-7.6a4.4 4.4 0 0 0 0-6.2Z" />
          </svg>
          {likes} curtidas
        </button>

        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-neutral-200 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.6a8.4 8.4 0 0 1-8.5 8.3 9 9 0 0 1-3.9-.9L3.5 20.8l1.6-4.3a8.1 8.1 0 0 1-1.4-4.9A8.4 8.4 0 0 1 12.2 3.3 8.4 8.4 0 0 1 21 11.6Z" />
          </svg>
          {comments} comentários
        </button>

        <button aria-label="Compartilhar publicação" className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 ml-auto">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="17.5" cy="6" r="2.6" />
            <circle cx="6.5" cy="12" r="2.6" />
            <circle cx="17.5" cy="18" r="2.6" />
            <path d="m8.9 10.7 6.2-3.4M8.9 13.3l6.2 3.4" />
          </svg>
        </button>
      </div>
    </article>
  )
}
