import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Layers, Users, MessageSquare, ScrollText,
  LogOut, ExternalLink, ShieldCheck, Trash2, ClipboardList, Sun, Moon,
} from 'lucide-react'
import { getAdminMe, adminLogout } from '../../lib/api'
import { useTheme } from '../../contexts/ThemeContext'
import Spinner from '../../components/Spinner'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sections', label: 'Secciones', icon: Layers },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/queries', label: 'Consultas', icon: MessageSquare },
  { to: '/admin/logs', label: 'Registros', icon: ScrollText },
  { to: '/admin/cleanup', label: 'Limpieza', icon: Trash2 },
  { to: '/admin/audit', label: 'Auditoría', icon: ClipboardList },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getAdminMe()
      .then((data) => {
        if (data.is_admin) {
          setAuthed(true)
        } else {
          navigate('/admin/login', { replace: true })
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }))
      .finally(() => setChecking(false))
  }, [navigate])

  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    try { await adminLogout() } catch { /* ignore */ }
    navigate('/admin/login', { replace: true })
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <Spinner label="Verificando acceso..." />
      </div>
    )
  }

  if (!authed) return null

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col h-full">
        {/* Logo + Admin badge */}
        <div className="px-5 py-5 border-b border-border">
          <img
            src="/asserts/logo.png"
            alt="Logo"
            className="h-8 w-auto object-contain mb-3"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <p className="text-muted text-xs font-medium mb-1.5">Pagola & Madorran</p>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-accent" />
            <span className="text-accent text-xs font-medium">Administrador</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors
                ${isActive
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-fore hover:bg-surface2'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-border flex flex-col gap-1">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-muted hover:text-fore hover:bg-surface2 transition-colors"
          >
            <ExternalLink size={16} className="shrink-0" />
            Ver app
          </a>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-muted hover:text-fore hover:bg-surface2 transition-colors w-full text-left"
          >
            {theme === 'dark' ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-muted hover:text-danger hover:bg-danger/10 transition-colors w-full text-left"
          >
            <LogOut size={16} className="shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-bg">
        <Outlet />
      </main>
    </div>
  )
}
