export function timeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  const now = Date.now()
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000))

  if (diffSeconds < 60) return 'agora'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `há ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `há ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `há ${diffDays} d`

  return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
