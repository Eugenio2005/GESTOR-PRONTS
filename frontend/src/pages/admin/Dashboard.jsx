import { useEffect, useRef, useState } from 'react'
import { Layers, Users, MessageSquare, CheckCircle, Clock, Zap, RefreshCw, AlertCircle, WifiOff } from 'lucide-react'
import { getAdminStats, getAdminQueries, getAdminApiStatus, getAdminMetrics } from '../../lib/api'
import Spinner from '../../components/Spinner'

function StatCard({ icon: Icon, label, value, sub, color = 'text-accent' }) {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center ${color}`}>
          <Icon size={18} className="shrink-0" />
        </div>
      </div>
      <p className="text-fore text-2xl font-bold mb-0.5">{value}</p>
      <p className="text-muted text-sm">{label}</p>
      {sub && <p className="text-muted/60 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function SectionBar({ name, icon, count, maxCount }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 shrink-0 text-center">{icon || '🔧'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-fore text-sm truncate">{name}</span>
          <span className="text-muted text-xs ml-2 shrink-0">{count}</span>
        </div>
        <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function RecentQueryRow({ item }) {
  const date = new Date(item.created_at)
  const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <tr className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
        {dateStr} {timeStr}
      </td>
      <td className="px-4 py-3 text-fore text-sm">{item.user_display_name || item.user || '—'}</td>
      <td className="px-4 py-3">
        <span className="text-muted text-xs bg-surface2 px-2 py-0.5 rounded">
          {item.section_icon || ''} {item.section_name || '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-muted text-xs max-w-[180px] truncate">
        {item.client_text ? item.client_text.slice(0, 60) : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        {item.status === 'ok' ? (
          <span className="text-success text-xs">OK</span>
        ) : (
          <span className="text-danger text-xs">Error</span>
        )}
      </td>
    </tr>
  )
}

// ─── API Status Card ──────────────────────────────────────────
function ApiStatusBadge({ name, info }) {
  if (!info) return null
  const colors = {
    ok: 'bg-success/10 text-success border-success/20',
    error: 'bg-danger/10 text-danger border-danger/20',
    not_configured: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  const icons = {
    ok: <CheckCircle size={13} />,
    error: <AlertCircle size={13} />,
    not_configured: <WifiOff size={13} />,
  }
  const cls = colors[info.status] || 'bg-surface2 text-muted border-border'
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cls}`}>
      {icons[info.status]}
      <div>
        <span className="font-medium text-sm">{name}</span>
        {info.label && <span className="ml-1.5 text-xs opacity-80">{info.label}</span>}
      </div>
    </div>
  )
}

const API_CHECK_DURATION = 25 // seconds — matches backend timeout

function ApiStatusProgressBar({ active }) {
  const [pct, setPct] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (active) {
      setPct(0)
      const step = 100 / (API_CHECK_DURATION * 10) // 10 ticks per second
      intervalRef.current = setInterval(() => {
        setPct((p) => {
          const next = p + step
          // Slow down after 80% so it never hits 100 before response
          if (next >= 82) {
            clearInterval(intervalRef.current)
            return 82
          }
          return next
        })
      }, 100)
    } else {
      clearInterval(intervalRef.current)
      setPct(100)
      // Reset after the completion flash
      const t = setTimeout(() => setPct(0), 600)
      return () => clearTimeout(t)
    }
    return () => clearInterval(intervalRef.current)
  }, [active])

  if (pct === 0) return null

  return (
    <div className="mt-3 mb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted text-xs">
          {active ? 'Comprobando conexión con las APIs...' : 'Listo'}
        </span>
        <span className="text-muted text-xs">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${active ? 'bg-accent' : 'bg-success'}`}
          style={{ width: `${pct}%`, transition: active ? 'width 0.1s linear' : 'width 0.4s ease-out' }}
        />
      </div>
    </div>
  )
}

function ApiStatusCard() {
  const [apiStatus, setApiStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [checkedAt, setCheckedAt] = useState(null)
  const mountedRef = useRef(true)

  async function fetchStatus() {
    if (loadingStatus) return
    setLoadingStatus(true)
    try {
      const data = await getAdminApiStatus()
      if (mountedRef.current) {
        setApiStatus(data)
        setCheckedAt(new Date())
      }
    } catch {
      if (mountedRef.current) setApiStatus(null)
    } finally {
      if (mountedRef.current) setLoadingStatus(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  return (
    <div className="bg-surface border border-border rounded-[10px] p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-fore text-base font-semibold">Estado de APIs</h2>
          {checkedAt && !loadingStatus && (
            <p className="text-muted/60 text-xs mt-0.5">
              Comprobado a las {checkedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-fore
            bg-surface2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
          {loadingStatus ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      <ApiStatusProgressBar active={loadingStatus} />

      {!loadingStatus && (
        apiStatus ? (
          <div className="flex flex-wrap gap-3 mt-1">
            <ApiStatusBadge name="OpenAI" info={apiStatus.openai} />
            <ApiStatusBadge name="Gemini" info={apiStatus.gemini} />
          </div>
        ) : (
          <p className="text-muted text-sm">Pulsa "Verificar" para comprobar el estado de las APIs</p>
        )
      )}
    </div>
  )
}

// ─── Extended Metrics Section ─────────────────────────────────
function QueriesPerDayChart({ data }) {
  if (!data || data.length === 0) return null
  const maxTotal = Math.max(...data.map((d) => d.total), 1)
  // Show last 30 days
  const recent = data.slice(-30)
  return (
    <div className="bg-surface border border-border rounded-[10px] p-5 mb-6">
      <h2 className="text-fore text-base font-semibold mb-4">Consultas por día (últimos 30 días)</h2>
      <div className="flex items-end gap-1 h-24">
        {recent.map((d) => {
          const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
          const okPct = d.total > 0 ? (d.ok_count / d.total) * 100 : 0
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-0.5 group relative"
              title={`${d.day}: ${d.total} consultas (${d.ok_count} OK)`}
            >
              <div
                className="w-full rounded-t overflow-hidden transition-all"
                style={{ height: `${Math.max(pct, 4)}%` }}
              >
                <div className="w-full bg-success rounded-t" style={{ height: `${okPct}%`, minHeight: d.ok_count > 0 ? '2px' : '0' }} />
                <div className="w-full bg-danger" style={{ height: `${100 - okPct}%`, minHeight: d.total > d.ok_count ? '2px' : '0' }} />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
                bg-surface border border-border rounded px-2 py-1 text-xs text-fore
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {d.day.slice(5)}: {d.total}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> OK
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-2.5 h-2.5 rounded-sm bg-danger inline-block" /> Error
        </span>
      </div>
    </div>
  )
}

function TopUsersTable({ data }) {
  if (!data || data.length === 0) return null
  return (
    <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-fore text-base font-semibold">Usuarios principales</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/50">
              <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Usuario</th>
              <th className="px-4 py-3 text-right text-muted text-xs uppercase tracking-wider font-medium">Consultas</th>
              <th className="px-4 py-3 text-right text-muted text-xs uppercase tracking-wider font-medium">Tokens</th>
              <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Última consulta</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="px-4 py-3 text-fore text-sm font-medium">{u.user_display_name || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-fore text-sm">{u.total}</span>
                  {u.ok_count != null && (
                    <span className="text-muted text-xs ml-1">({u.ok_count} OK)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted text-xs">
                  {u.total_tokens != null ? u.total_tokens.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {u.last_query ? new Date(u.last_query).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PerSectionTable({ data }) {
  if (!data || data.length === 0) return null
  return (
    <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-fore text-base font-semibold">Detalle por sección</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/50">
              <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Sección</th>
              <th className="px-4 py-3 text-right text-muted text-xs uppercase tracking-wider font-medium">Consultas</th>
              <th className="px-4 py-3 text-right text-muted text-xs uppercase tracking-wider font-medium">Tasa error</th>
              <th className="px-4 py-3 text-right text-muted text-xs uppercase tracking-wider font-medium">T. medio</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span>{s.section_icon || '🔧'}</span>
                    <span className="text-fore text-sm">{s.section_name}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-fore text-sm">{s.total}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-medium ${s.error_rate > 10 ? 'text-danger' : s.error_rate > 0 ? 'text-yellow-400' : 'text-success'}`}>
                    {s.error_rate != null ? `${s.error_rate.toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted text-xs">
                  {s.avg_ms != null ? `${(s.avg_ms / 1000).toFixed(1)}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExtendedMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    getAdminMetrics()
      .then((d) => { if (mountedRef.current) setMetrics(d) })
      .catch(() => { if (mountedRef.current) setMetrics(null) })
      .finally(() => { if (mountedRef.current) setLoadingMetrics(false) })
    return () => { mountedRef.current = false }
  }, [])

  if (loadingMetrics) {
    return (
      <div className="flex justify-center py-10">
        <Spinner label="Cargando métricas..." />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-[10px] px-5 py-4 text-danger text-sm mb-6">
        No se pudieron cargar las métricas extendidas.
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-fore text-lg font-semibold mb-4">Métricas detalladas</h2>

      {/* Active users */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-[10px] p-5">
          <p className="text-muted text-sm mb-1">Usuarios activos hoy</p>
          <p className="text-fore text-3xl font-bold">{metrics.active_today ?? '—'}</p>
        </div>
        <div className="bg-surface border border-border rounded-[10px] p-5">
          <p className="text-muted text-sm mb-1">Usuarios activos esta semana</p>
          <p className="text-fore text-3xl font-bold">{metrics.active_week ?? '—'}</p>
        </div>
      </div>

      <QueriesPerDayChart data={metrics.queries_per_day} />
      <TopUsersTable data={metrics.per_user} />
      <PerSectionTable data={metrics.per_section} />
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentQueries, setRecentQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    Promise.all([
      getAdminStats(),
      getAdminQueries({ page: 1 }),
    ])
      .then(([s, q]) => {
        if (!mountedRef.current) return
        setStats(s)
        setRecentQueries(q.items?.slice(0, 5) || [])
      })
      .catch((err) => { if (mountedRef.current) setError(err.message || 'Error al cargar estadísticas') })
      .finally(() => { if (mountedRef.current) setLoading(false) })
    return () => { mountedRef.current = false }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Spinner label="Cargando estadísticas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger/10 border border-danger/30 rounded-[10px] px-5 py-4 text-danger text-sm">
          {error}
        </div>
      </div>
    )
  }

  const maxSectionCount = stats?.per_section
    ? Math.max(...stats.per_section.map((s) => s.count), 1)
    : 1

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-fore text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Vista general del sistema</p>
      </div>

      {/* API Status */}
      <ApiStatusCard />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Layers}
          label="Secciones"
          value={stats?.sections ?? '—'}
          color="text-accent"
        />
        <StatCard
          icon={Users}
          label="Usuarios"
          value={stats?.users ?? '—'}
          sub={`${stats?.active_users ?? 0} activos`}
          color="text-success"
        />
        <StatCard
          icon={MessageSquare}
          label="Total consultas"
          value={stats?.total_queries?.toLocaleString() ?? '—'}
          color="text-accent"
        />
        <StatCard
          icon={CheckCircle}
          label="Consultas OK"
          value={stats?.ok_queries?.toLocaleString() ?? '—'}
          sub={
            stats?.total_queries
              ? `${Math.round((stats.ok_queries / stats.total_queries) * 100)}% éxito`
              : undefined
          }
          color="text-success"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-[10px] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-fore text-lg font-bold">
              {stats?.avg_duration_ms
                ? `${(stats.avg_duration_ms / 1000).toFixed(2)}s`
                : '—'}
            </p>
            <p className="text-muted text-sm">Tiempo medio de respuesta</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[10px] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-fore text-lg font-bold">
              {stats?.total_tokens?.toLocaleString() ?? '—'}
            </p>
            <p className="text-muted text-sm">Tokens totales consumidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Per-section usage */}
        {stats?.per_section && stats.per_section.length > 0 && (
          <div className="bg-surface border border-border rounded-[10px] p-5">
            <h2 className="text-fore text-base font-semibold mb-4">Uso por sección</h2>
            <div className="flex flex-col gap-3">
              {stats.per_section
                .sort((a, b) => b.count - a.count)
                .map((sec) => (
                  <SectionBar
                    key={sec.id}
                    name={sec.name}
                    icon={sec.icon}
                    count={sec.count}
                    maxCount={maxSectionCount}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Error summary */}
        {stats && (
          <div className="bg-surface border border-border rounded-[10px] p-5">
            <h2 className="text-fore text-base font-semibold mb-4">Resumen de estados</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted text-sm">Consultas correctas</span>
                <span className="text-success font-semibold">{(stats.ok_queries || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted text-sm">Consultas con error</span>
                <span className="text-danger font-semibold">{(stats.err_queries || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted text-sm">Total</span>
                <span className="text-fore font-semibold">{(stats.total_queries || 0).toLocaleString()}</span>
              </div>
              {/* Visual bar */}
              {stats.total_queries > 0 && (
                <div className="h-2 bg-surface2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${(stats.ok_queries / stats.total_queries) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-fore text-base font-semibold">Consultas recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface2/50">
                  <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Sección</th>
                  <th className="px-4 py-3 text-left text-muted text-xs uppercase tracking-wider font-medium">Consulta</th>
                  <th className="px-4 py-3 text-center text-muted text-xs uppercase tracking-wider font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentQueries.map((item) => (
                  <RecentQueryRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extended metrics */}
      <ExtendedMetrics />
    </div>
  )
}
