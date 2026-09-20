import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'
import Feed from './Feed'
import Search from './Search'
import Messages from './Messages'
import Groups from './Groups'
import Profile from './Profile'
import Settings from './Settings'

interface HomeProps {
  onLogout: () => void
  userId: string
}

export type View = 'home' | 'discover' | 'messages' | 'groups' | 'profile' | 'settings'

export default function Home({ onLogout, userId }: HomeProps) {
  const [view, setView] = useState<View>('home')

  return (
    <div className="w-full h-full flex flex-col bg-white lg:bg-canvas">
      <Header onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={view} setActiveTab={setView} />

        {view === 'home' && <Feed userId={userId} />}
        {view === 'discover' && <Search userId={userId} />}
        {view === 'messages' && <Messages userId={userId} />}
        {view === 'groups' && <Groups userId={userId} />}
        {view === 'profile' && <Profile userId={userId} />}
        {view === 'settings' && <Settings userId={userId} onLogout={onLogout} />}
      </div>

      <TabBar activeTab={view} setActiveTab={setView} />
    </div>
  )
}
