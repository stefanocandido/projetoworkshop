interface GoodayLogoProps {
  className?: string
}

export default function GoodayLogo({ className = 'text-2xl' }: GoodayLogoProps) {
  return (
    <span className={`inline-flex items-center font-bold tracking-tight text-neutral-900 ${className}`}>
      <span className="leading-none">G</span>
      <svg width="21" height="14" viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth="5.4" className="relative top-[2px] mx-px" aria-hidden="true">
        <circle cx="9.6" cy="11" r="6.7" />
        <circle cx="21.4" cy="11" r="6.7" />
      </svg>
      <span className="leading-none">day</span>
    </span>
  )
}
