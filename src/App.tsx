import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './screens/Login'
import Home from './screens/Home'
import './index.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-canvas flex items-center justify-center">
        <div className="text-3xl font-bold text-accent-500 animate-pulse">∞</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-canvas flex flex-col">
      {!session ? <Login /> : <Home onLogout={handleLogout} userId={session.user.id} />}
    </div>
  )
}

export default App
