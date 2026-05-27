import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { login } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/Spinner'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      const data = await login(username.trim(), password)
      setUser(data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
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

        {/* Card */}
        <div className="bg-surface border border-border rounded-[10px] p-8">
          <h1 className="text-fore text-xl font-semibold mb-1">Iniciar sesión</h1>
          <p className="text-muted text-sm mb-6">Accede a tu cuenta</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm text-muted font-medium">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu.usuario"
                disabled={loading}
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors placeholder:text-muted/50
                  disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm text-muted font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
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
              disabled={loading || !username.trim() || !password}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                text-white font-medium px-4 py-2.5 rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <Spinner size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-muted/50 text-xs mt-6">
          Gestor de Prompts &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
