import { useState } from 'react'
import { supabase } from '../lib/supabase'
import GoodayLogo from '../components/GoodayLogo'

type Mode = 'login' | 'signup'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4 20 20" />
      <path d="M9.9 5.9A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.4 4.1" />
      <path d="M6.6 8A17.3 17.3 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 3.2-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const traduzErro = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
    if (msg.includes('User already registered')) return 'Este email já está cadastrado.'
    if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (mode === 'signup' && !acceptedTerms) {
      setError('Você precisa aceitar os termos de uso para continuar.')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(traduzErro(signInError.message))
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, handle: handle.replace(/^@/, '') } },
      })
      if (signUpError) {
        setError(traduzErro(signUpError.message))
      } else {
        setInfoMessage('Conta criada! Verifique seu email para confirmar antes de entrar.')
      }
    }

    setLoading(false)
  }

  const handleForgotPassword = async () => {
    setError(null)
    setInfoMessage(null)
    if (!email) {
      setError('Digite seu email acima primeiro.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    setInfoMessage(resetError ? null : 'Enviamos um link de recuperação para seu email.')
    if (resetError) setError(traduzErro(resetError.message))
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfoMessage(null)
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 lg:p-10 bg-canvas">
      {/* Painel de imagem */}
      <div className="relative h-60 lg:h-auto lg:flex-[1.8] rounded-3xl overflow-hidden bg-neutral-200 flex-shrink-0">
        <img
          src="/assets/bdc00f6bd39edb18c88e2cba5c06aadd.jpg"
          alt="Mulher almoçando em uma mesa de calçada"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Painel do formulário */}
      <div className="flex-1 lg:max-w-md bg-white rounded-3xl shadow-lg p-6 lg:p-10 flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-center">
            <GoodayLogo className="text-4xl lg:text-[40px]" />
          </div>

          <p className="mt-3 max-w-[300px] mx-auto text-center text-base text-neutral-600">
            {mode === 'login'
              ? 'Bem-vindo de volta. Compartilhe um pouco do seu dia.'
              : 'Crie sua conta e comece a compartilhar o seu dia.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome"
                  autoComplete="name"
                  className="input"
                  required
                />
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="Usuário (@)"
                  autoComplete="username"
                  className="input"
                  required
                />
              </>
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="input"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="input pr-14"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                <EyeIcon open={!showPassword} />
              </button>
            </div>

            {mode === 'login' ? (
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 min-h-11 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-5 h-5" style={{ accentColor: 'var(--accent-500)' }}
                  />
                  Lembrar minha senha
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-accent-700 hover:text-accent-800">
                  Esqueci minha senha
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-500">Use ao menos 8 caracteres, com uma letra e um número.</p>
                <label className="flex items-start gap-2 mt-1 text-sm leading-snug text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ accentColor: 'var(--accent-500)' }}
                  />
                  <span>Li e aceito os termos de uso e a política de privacidade.</span>
                </label>
              </>
            )}

            {error && <p className="text-sm text-error bg-red-50 rounded-lg px-4 py-3">{error}</p>}
            {infoMessage && <p className="text-sm text-accent-700 bg-accent-50 rounded-lg px-4 py-3">{infoMessage}</p>}

            <button type="submit" className="btn-primary mt-1" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar no Gooday' : 'Criar minha conta'}
            </button>
          </form>

          <div className="flex justify-center mt-5">
            <button
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="min-h-11 flex items-center text-[15px] font-medium text-neutral-900 hover:text-accent-700"
            >
              {mode === 'login' ? 'Criar conta' : 'Já tenho conta'}
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-5">
          <p className="text-center text-[13px] text-neutral-500">Respeite sua mente e trate seu corpo bem.</p>
        </div>
      </div>
    </div>
  )
}
