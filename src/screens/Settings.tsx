import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface SettingsProps {
  userId: string
  onLogout: () => void
}

export default function Settings({ userId, onLogout }: SettingsProps) {
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [savingEmail, setSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [exitOpen, setExitOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('name, avatar_url').eq('id', userId).single(),
      supabase.auth.getUser(),
    ]).then(([{ data: p }, { data: u }]) => {
      if (p) {
        setName(p.name)
        setAvatarUrl(p.avatar_url ?? `https://picsum.photos/seed/${userId}/100/100`)
      }
      setCurrentEmail(u.user?.email ?? '')
      setLoading(false)
    })
  }, [userId])

  const saveEmail = async () => {
    setEmailMsg(null)
    if (!newEmail.trim()) return
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSavingEmail(false)
    setEmailMsg(error ? `Erro: ${error.message}` : 'Enviamos um link de confirmação para o novo e-mail.')
    if (!error) setNewEmail('')
  }

  const savePassword = async () => {
    setPasswordMsg(null)
    if (!currentPassword) {
      setPasswordMsg('Informe sua senha atual.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('A confirmação não bate com a nova senha.')
      return
    }

    setSavingPassword(true)
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: currentPassword })
    if (reauthError) {
      setSavingPassword(false)
      setPasswordMsg('Senha atual incorreta.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    setPasswordMsg(error ? `Erro: ${error.message}` : 'Senha alterada com sucesso!')
    if (!error) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return <p className="flex-1 text-center text-neutral-500 py-12">Carregando configurações...</p>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-0 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 lg:p-6 flex items-center gap-4">
          <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          <div>
            <p className="text-base font-bold text-neutral-900">{name}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{currentEmail}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 mt-5">
          <p className="text-base font-bold text-neutral-900">Alterar e-mail</p>
          <label htmlFor="cfg-email" className="block mt-4 mb-2 text-[13px] font-semibold text-neutral-700">
            Novo e-mail
          </label>
          <input
            id="cfg-email"
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="novo@email.com"
            className="input"
          />
          <button onClick={saveEmail} className="btn-primary mt-4 lg:w-auto w-full" disabled={savingEmail}>
            {savingEmail ? 'Salvando...' : 'Salvar e-mail'}
          </button>
          {emailMsg && <p className="mt-3 text-sm text-neutral-600">{emailMsg}</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 mt-5">
          <p className="text-base font-bold text-neutral-900">Alterar senha</p>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="cfg-atual" className="block mb-2 text-[13px] font-semibold text-neutral-700">Senha atual</label>
              <input id="cfg-atual" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="cfg-nova" className="block mb-2 text-[13px] font-semibold text-neutral-700">Nova senha</label>
              <input id="cfg-nova" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="cfg-confirmar" className="block mb-2 text-[13px] font-semibold text-neutral-700">Confirmar nova senha</label>
              <input id="cfg-confirmar" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" />
            </div>
          </div>
          <button onClick={savePassword} className="btn-primary mt-4 lg:w-auto w-full" disabled={savingPassword}>
            {savingPassword ? 'Salvando...' : 'Salvar senha'}
          </button>
          {passwordMsg && <p className="mt-3 text-sm text-neutral-600">{passwordMsg}</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-neutral-900">Ajuda e suporte</p>
            <p className="mt-1 text-[13px] text-neutral-500">Dúvidas, termos e privacidade.</p>
          </div>
          <button className="text-sm font-semibold text-accent-700 flex-shrink-0">Abrir</button>
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-error">Sair da conta</p>
            <p className="mt-1 text-[13px] text-neutral-500">Você poderá entrar novamente quando quiser.</p>
          </div>
          <button
            onClick={() => setExitOpen(true)}
            className="h-11 px-5 rounded-full border border-error text-error text-sm font-semibold flex-shrink-0"
          >
            Sair
          </button>
        </div>
      </div>

      {exitOpen && (
        <>
          <button className="fixed inset-0 z-20 bg-black/40" onClick={() => setExitOpen(false)} aria-label="Cancelar saída" />
          <div role="dialog" aria-label="Confirmar saída" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl p-7 z-30 text-center">
            <p className="text-lg font-bold text-neutral-900">Deseja sair?</p>
            <p className="mt-2.5 text-sm leading-6 text-neutral-600">Você precisará entrar novamente com seu e-mail e senha.</p>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setExitOpen(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={onLogout} className="flex-1 h-[46px] rounded-full bg-error text-white text-sm font-semibold">
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
