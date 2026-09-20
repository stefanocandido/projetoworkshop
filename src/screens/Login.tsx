import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(traduzErro(signInError.message))
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (signUpError) {
        setError(traduzErro(signUpError.message))
      } else {
        setInfoMessage('Conta criada! Verifique seu email para confirmar antes de entrar.')
      }
    }

    setLoading(false)
  }

  const traduzErro = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
    if (msg.includes('User already registered')) return 'Este email já está cadastrado.'
    if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
    return msg
  }

  return (
    <div className="w-full h-full flex">
      {/* Desktop: Left panel with image */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent-500 rounded-3xl items-center justify-center relative overflow-hidden p-8">
        <img
          src="/assets/1d9f0fbce55347fd969d0a50b5a47c76.jpg"
          alt="Login background"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-8 left-8 bg-accent-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
          Ao vivo
        </div>
      </div>

      {/* Right panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-2">
              ∞
            </h1>
            <p className="text-neutral-600">
              {mode === 'login' ? 'Bem-vindo de volta ao Gooday' : 'Crie sua conta no Gooday'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}
            {infoMessage && (
              <p className="text-sm text-accent-700 bg-accent-50 rounded-lg px-4 py-3">{infoMessage}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-neutral-600 mt-8">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setInfoMessage(null)
              }}
              className="text-accent-500 font-semibold hover:text-accent-600"
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
