interface TabBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'discover', label: 'Descobrir', icon: 'compass' },
  { id: 'messages', label: 'Mensagens', icon: 'chat' },
  { id: 'groups', label: 'Grupos', icon: 'users' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
]

export default function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-200 flex items-center justify-around">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
            activeTab === item.id
              ? 'text-accent-500'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <svg className="w-6 h-6" fill={activeTab === item.id ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            {item.id === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4V3" />}
            {item.id === 'discover' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />}
            {item.id === 'messages' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
            {item.id === 'groups' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6h.01" />}
            {item.id === 'profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
          </svg>
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
