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
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            alt={author}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-neutral-900">{author}</h3>
            <p className="text-sm text-neutral-500">{timestamp}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-neutral-900">{content}</p>
      </div>

      {/* Image */}
      <img
        src={image}
        alt="Post content"
        className="w-full h-auto max-h-96 object-cover"
      />

      {/* Engagement */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
          <span>{likes} curtidas</span>
          <span>{comments} comentários</span>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'bg-accent-50 text-accent-600'
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>Curtir</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Comentar</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Compartilhar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
