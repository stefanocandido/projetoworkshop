import type { View } from '../screens/Home'

interface SidebarProps {
  activeTab: View
  setActiveTab: (tab: View) => void
}

const NAV_ITEMS: { id: View | 'create'; label: string }[] = [
  { id: 'home', label: 'Início' },
  { id: 'discover', label: 'Buscar' },
  { id: 'messages', label: 'Mensagens' },
  { id: 'create', label: 'Criar' },
  { id: 'groups', label: 'Grupos' },
  { id: 'profile', label: 'Perfil' },
  { id: 'settings', label: 'Configurações' },
]

function NavIcon({ id }: { id: View | 'create' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'home':
      return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.6V20a1 1 0 0 0 1 1h3v-5.6h5V21h3a1 1 0 0 0 1-1V9.6" /></svg>
    case 'discover':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
    case 'messages':
      return <svg {...common}><path d="M21 11.6a8.4 8.4 0 0 1-8.5 8.3 9 9 0 0 1-3.9-.9L3.5 20.8l1.6-4.3a8.1 8.1 0 0 1-1.4-4.9A8.4 8.4 0 0 1 12.2 3.3 8.4 8.4 0 0 1 21 11.6Z" /></svg>
    case 'create':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8.5v7M8.5 12h7" /></svg>
    case 'groups':
      return <svg {...common}><circle cx="9.2" cy="8.4" r="3.2" /><path d="M3.6 19.4a5.6 5.6 0 0 1 11.2 0" /><path d="M16.4 5.6a3.2 3.2 0 0 1 0 5.9" /><path d="M17.6 14.6a5.6 5.6 0 0 1 3 4.8" /></svg>
    case 'profile':
      return <svg {...common}><circle cx="12" cy="8" r="3.6" /><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0" /></svg>
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 12c0-.4 0-.8-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.1-1.2L14.5 3h-4l-.4 2.7a7.6 7.6 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.1 1.2l.4 2.7h4l.4-2.7a7.6 7.6 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></svg>
  }
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <nav aria-label="Navegação principal" className="hidden lg:flex w-[252px] flex-shrink-0 self-start bg-white rounded-3xl p-3 flex-col gap-1">
      {NAV_ITEMS.map(item => {
        const isCreate = item.id === 'create'
        const isActive = !isCreate && activeTab === item.id

        return (
          <button
            key={item.id}
            onClick={() => (isCreate ? window.alert('Criação de publicações chega em breve!') : setActiveTab(item.id as View))}
            className={`flex items-center gap-3.5 h-12 px-4 rounded-full text-[15px] transition-colors ${
              isActive ? 'bg-accent-500 text-neutral-900 font-semibold' : 'text-neutral-700 font-medium hover:bg-neutral-100'
            }`}
          >
            <NavIcon id={item.id} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
