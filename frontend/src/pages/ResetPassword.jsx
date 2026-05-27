import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { validateResetToken, resetPassword } from '../lib/api'
import Spinner from '../components/Spinner'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [validating, setValidating] = useState(true)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [tokenError, setTokenError] = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setTokenError('Enlace de reset inválido. Solicita uno nuevo al administrador.')
      setValidating(false)
      return
    }
    validateResetToken(token)
      .then(info => { setTokenInfo(info); setValidating(false) })
      .catch(err => { setTokenError(err.message || 'Token inválido o caducado'); setValidating(false) })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/asserts/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain mx-auto mb-4"
            onError={e => { e.target.style.display = 'none' }}
          />
          <h1 className="text-fore text-2xl font-semibold">Cambiar contraseña</h1>
          <p className="text-muted text-sm mt-1">Pagola & Madorran · Gestor IA</p>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-6">
          {validating ? (
            <div className="flex justify-center py-6">
              <Spinner label="Validando enlace..." />
            </div>
          ) : tokenError ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound size={20} className="text-danger" />
              </div>
              <p className="text-danger text-sm font-medium mb-2">Enlace no válido</p>
              <p className="text-muted text-sm">{tokenError}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 text-accent text-sm hover:underline"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={20} className="text-success" />
              </div>
              <p className="text-fore text-sm font-medium mb-2">Contraseña actualizada</p>
              <p className="text-muted text-sm">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-5 w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-muted text-sm">
                Cambiando contraseña para <strong className="text-fore">{tokenInfo?.display_name}</strong>
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted font-medium">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                    className="w-full bg-surface2 border border-border rounded-lg px-3 pr-10 py-2.5 text-fore text-sm outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fore"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted font-medium">Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && (
                <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? <Spinner size={15} /> : <KeyRound size={15} />}
                {submitting ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
