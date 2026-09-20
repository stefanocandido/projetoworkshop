import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface SettingsProps {
  userId: string
  onLogout: () => void
}

interface Prefs {
  pushEnabled: boolean
  emailWeeklySummary: boolean
  notifyFollows: boolean
  notifyLikes: boolean
  notifyComments: boolean
  notifyMentions: boolean
  notifyGroupActivity: boolean
  notifyMessages: boolean
}

export default function Settings({ userId, onLogout }: SettingsProps) {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setPrefs({
        pushEnabled: data.push_enabled,
        emailWeeklySummary: data.email_weekly_summary,
        notifyFollows: data.notify_follows,
        notifyLikes: data.notify_likes,
        notifyComments: data.notify_comments,
        notifyMentions: data.notify_mentions,
        notifyGroupActivity: data.notify_group_activity,
        notifyMessages: data.notify_messages,
      })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (key: keyof Prefs, column: string) => {
    if (!prefs) return
    const newValue = !prefs[key]
    setPrefs({ ...prefs, [key]: newValue })
    const payload: Record<string, boolean> = { [column]: newValue }
    await supabase.from('notification_preferences').update(payload as never).eq('user_id', userId)
  }

  const changePassword = async () => {
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    setPasswordMsg(error ? `Erro: ${error.message}` : 'Senha alterada com sucesso!')
    if (!error) setNewPassword('')
  }

  if (loading || !prefs) {
    return <p className="flex-1 text-center text-neutral-500 py-12">Carregando configurações...</p>
  }

  const toggles: { key: keyof Prefs; column: string; label: string }[] = [
    { key: 'pushEnabled', column: 'push_enabled', label: 'Notificações push' },
    { key: 'emailWeeklySummary', column: 'email_weekly_summary', label: 'Resumo semanal por email' },
    { key: 'notifyFollows', column: 'notify_follows', label: 'Novos seguidores' },
    { key: 'notifyLikes', column: 'notify_likes', label: 'Curtidas' },
    { key: 'notifyComments', column: 'notify_comments', label: 'Comentários' },
    { key: 'notifyMentions', column: 'notify_mentions', label: 'Menções' },
    { key: 'notifyGroupActivity', column: 'notify_group_activity', label: 'Atividade em grupos' },
    { key: 'notifyMessages', column: 'notify_messages', label: 'Mensagens' },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Configurações</h1>

        <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Notificações</h2>
        <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200 mb-8">
          {toggles.map(t => (
            <label key={t.key} className="flex items-center justify-between p-4 cursor-pointer">
              <span className="text-neutral-900">{t.label}</span>
              <input
                type="checkbox"
                checked={prefs[t.key]}
                onChange={() => toggle(t.key, t.column)}
                className="w-5 h-5" style={{ accentColor: 'var(--accent-500)' }}
              />
            </label>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-neutral-600 uppercase mb-3">Segurança</h2>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-8 space-y-3">
          <label className="block text-sm font-semibold text-neutral-900">Alterar senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="input"
          />
          <button onClick={changePassword} className="btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Salvando...' : 'Salvar nova senha'}
          </button>
          {passwordMsg && <p className="text-sm text-neutral-600">{passwordMsg}</p>}
        </div>

        <button onClick={onLogout} className="btn-outline w-full text-error border-error">
          Sair da conta
        </button>
      </div>
    </div>
  )
}
