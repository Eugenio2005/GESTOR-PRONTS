import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Spinner from './components/Spinner'

// User pages
import Login from './pages/Login'
import Client from './pages/Client'
import Historial from './pages/Historial'
import HistorialDetail from './pages/HistorialDetail'
import ResetPassword from './pages/ResetPassword'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Sections from './pages/admin/Sections'
import Users from './pages/admin/Users'
import Queries from './pages/admin/Queries'
import Logs from './pages/admin/Logs'
import Cleanup from './pages/admin/Cleanup'
import Audit from './pages/admin/Audit'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <Spinner label="Cargando..." />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected user routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Client />
          </RequireAuth>
        }
      />
      <Route
        path="/historial"
        element={
          <RequireAuth>
            <Historial />
          </RequireAuth>
        }
      />
      <Route
        path="/historial/:id"
        element={
          <RequireAuth>
            <HistorialDetail />
          </RequireAuth>
        }
      />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="sections" element={<Sections />} />
        <Route path="users" element={<Users />} />
        <Route path="queries" element={<Queries />} />
        <Route path="logs" element={<Logs />} />
        <Route path="cleanup" element={<Cleanup />} />
        <Route path="audit" element={<Audit />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
