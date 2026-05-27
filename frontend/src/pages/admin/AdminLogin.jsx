import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, LogOut } from 'lucide-react'
import { adminLogin, adminLogout, getAdminMe } from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [alreadyAuthed, setAlreadyAuthed] = useState(false)
  const [error, setError] = useState('')

  // Check if already logged in
  useEffect(() => {
    getAdminMe()
      .then((data) => {
        if (data.is_admin) {
          setAlreadyAuthed(true)
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return
    setError('')
    setLoading(true)
    try {
      await adminLogin(password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  async function handleForceLogout() {
    try { await adminLogout() } catch { /* ignore */ }
    setAlreadyAuthed(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner label="Comprobando sesión..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/asserts/logo.png"
            alt="Logo"
            className="h-12 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Already logged in banner */}
        {alreadyAuthed && (
          <div className="bg-accent/10 border border-accent/30 rounded-[10px] px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <p className="text-accent text-sm">
              Ya tienes una sesión activa de administrador.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate('/admin', { replace: true })}
                className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors font-medium"
              >
                Entrar
              </button>
              <button
                onClick={handleForceLogout}
                className="text-xs text-muted hover:text-danger flex items-center gap-1 transition-colors"
                title="Cerrar sesión actual"
              >
                <LogOut size={13} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-surface border border-border rounded-[10px] p-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck size={20} className="text-accent shrink-0" />
            <h1 className="text-fore text-xl font-semibold">Panel de administración</h1>
          </div>
          <p className="text-muted text-sm mb-6">Introduce la contraseña de administrador</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-sm text-muted font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoFocus
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 pr-10 text-fore text-sm
                    outline-none focus:border-accent transition-colors placeholder:text-muted/50
                    disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fore transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg px-3 py-2.5 text-danger text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                text-white font-medium px-4 py-2.5 rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? <Spinner size={16} /> : <ShieldCheck size={16} />}
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-muted text-xs hover:text-fore transition-colors"
          >
            Volver a la aplicación
          </a>
        </div>
      </div>
    </div>
  )
}
