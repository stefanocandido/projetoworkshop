import type { View } from '../screens/Home'

interface TabBarProps {
  activeTab: View
  setActiveTab: (tab: View) => void
}

export default function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  return (
    <nav aria-label="Navegação principal" className="lg:hidden fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-neutral-200 px-3 flex items-center justify-between">
      <button
        onClick={() => setActiveTab('home')}
        aria-label="Início"
        className={`w-14 h-11 flex items-center justify-center rounded-full ${activeTab === 'home' ? 'bg-accent-500 text-neutral-900' : 'text-neutral-600'}`}
      >
        <svg {...iconProps}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.6V20a1 1 0 0 0 1 1h3v-5.6h5V21h3a1 1 0 0 0 1-1V9.6" /></svg>
      </button>

      <button
        onClick={() => setActiveTab('discover')}
        aria-label="Buscar"
        className={`w-14 h-11 flex items-center justify-center rounded-full ${activeTab === 'discover' ? 'bg-accent-500 text-neutral-900' : 'text-neutral-600'}`}
      >
        <svg {...iconProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
      </button>

      <button
        onClick={() => window.alert('Criação de publicações chega em breve!')}
        aria-label="Criar"
        className="w-[52px] h-[52px] flex items-center justify-center rounded-full border-[1.5px] border-neutral-300 text-neutral-900"
      >
        <svg {...iconProps}><path d="M12 5v14M5 12h14" /></svg>
      </button>

      <button
        onClick={() => setActiveTab('messages')}
        aria-label="Mensagens"
        className={`w-14 h-11 flex items-center justify-center rounded-full ${activeTab === 'messages' ? 'bg-accent-500 text-neutral-900' : 'text-neutral-600'}`}
      >
        <svg {...iconProps}><path d="M21 11.6a8.4 8.4 0 0 1-8.5 8.3 9 9 0 0 1-3.9-.9L3.5 20.8l1.6-4.3a8.1 8.1 0 0 1-1.4-4.9A8.4 8.4 0 0 1 12.2 3.3 8.4 8.4 0 0 1 21 11.6Z" /></svg>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        aria-label="Perfil"
        className={`w-14 h-11 flex items-center justify-center rounded-full ${activeTab === 'profile' ? 'bg-accent-500 text-neutral-900' : 'text-neutral-600'}`}
      >
        <svg {...iconProps}><circle cx="12" cy="8" r="3.6" /><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0" /></svg>
      </button>
    </nav>
  )
}
