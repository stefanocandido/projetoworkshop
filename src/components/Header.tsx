interface HeaderProps {
  onLogout: () => void
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="h-16 lg:h-20 bg-neutral-0 border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6">
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-accent-500">∞</div>
        <h1 className="hidden sm:block text-xl font-bold text-neutral-900">Gooday</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative text-neutral-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <img
            src="/assets/8fc3a9f9e6e740bbb1a6e0a76be1b3e8.jpg"
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
        </button>
      </div>
    </header>
  )
}
