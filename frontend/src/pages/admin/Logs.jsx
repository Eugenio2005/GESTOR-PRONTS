import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Download, FileText, Search, SlidersHorizontal, X } from 'lucide-react'
import { getAdminLogsFiltered, clearAdminLogs, exportAdminLogs } from '../../lib/api'
import Spinner from '../../components/Spinner'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ToastProvider, useToast } from '../../components/Toast'

function StatPill({ label, value, color = 'text-fore' }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-muted text-sm">{label}</span>
    </div>
  )
}

function LogsInner() {
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ user: '', section: '', status: '', date_from: '', date_to: '' })
  const [search, setSearch] = useState('')
  const debounceRef = useRef(null)

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  function handleSearch(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, user: val }))
      setPage(1)
    }, 400)
  }

  function handleFilterChange(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ user: '', section: '', status: '', date_from: '', date_to: '' })
    setSearch('')
    setPage(1)
  }

  async function load() {
    setLoading(true)
    try {
      const d = await getAdminLogsFiltered({ page, ...filters })
      setData(d)
    } catch (err) {
      toast(err.message || 'Error al cargar registros', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, filters])

  async function handleClear() {
    setClearing(true)
    try {
      await clearAdminLogs()
      toast('Registros eliminados', 'success')
      setPage(1)
      await load()
    } catch (err) {
      toast(err.message || 'Error al limpiar registros', 'error')
    } finally {
      setClearing(false)
      setConfirmClear(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await exportAdminLogs()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast('CSV exportado', 'success')
    } catch (err) {
      toast(err.message || 'Error al exportar', 'error')
    } finally {
      setExporting(false)
    }
  }

  const items = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || 1
  const okCount = data?.ok_count || 0
  const errCount = data?.err_count || 0
  const avgDuration = data?.avg_duration_ms

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-fore text-2xl font-semibold">Registros</h1>
          <p className="text-muted text-sm mt-1">Log técnico de todas las consultas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 bg-surface border border-border hover:border-accent
              text-fore text-sm font-medium px-4 py-2.5 rounded-lg transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Spinner size={15} /> : <Download size={15} />}
            Exportar CSV
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={clearing || total === 0}
            className="flex items-center gap-2 bg-danger/10 border border-danger/30 hover:bg-danger/20
              text-danger text-sm font-medium px-4 py-2.5 rounded-lg transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {clearing ? <Spinner size={15} /> : <Trash2 size={15} />}
            Limpiar registros
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por usuario..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-fore text-sm outline-none focus:border-accent placeholder:text-muted/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters || activeFiltersCount > 0 ? 'border-accent text-accent bg-accent/5' : 'border-border text-muted hover:text-fore'}`}
          >
            <SlidersHorizontal size={14} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
        </div>
        {showFilters && (
          <div className="bg-surface border border-border rounded-[10px] p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Sección</label>
              <input type="text" value={filters.section}
                onChange={e => handleFilterChange('section', e.target.value)}
                placeholder="Nombre sección..."
                className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Estado</label>
              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent">
                <option value="">Todos</option>
                <option value="ok">Correcto</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Desde</label>
              <input type="date" value={filters.date_from}
                onChange={e => handleFilterChange('date_from', e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Hasta</label>
              <input type="date" value={filters.date_to}
                onChange={e => handleFilterChange('date_to', e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent" />
            </div>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters}
                className="col-span-2 sm:col-span-4 text-xs text-muted hover:text-danger transition-colors text-left flex items-center gap-1 mt-1">
                <X size={12} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatPill label="Total" value={total.toLocaleString()} />
        <StatPill label="Correctos" value={okCount.toLocaleString()} color="text-success" />
        <StatPill label="Errores" value={errCount.toLocaleString()} color="text-danger" />
        <StatPill
          label="Tiempo medio"
          value={avgDuration ? `${(avgDuration / 1000).toFixed(2)}s` : '—'}
          color="text-accent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Cargando registros..." />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">No hay registros.</p>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface2/50">
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Usuario</th>
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Sección</th>
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">IP</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Archivo</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium whitespace-nowrap">Tokens E/S</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium whitespace-nowrap">Tiempo</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const date = new Date(item.created_at)
                    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 hover:bg-surface2/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {dateStr}<br />{timeStr}
                        </td>
                        <td className="px-4 py-3 text-fore text-sm">
                          {item.user_display_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted text-xs bg-surface2 px-2 py-0.5 rounded whitespace-nowrap">
                            {item.section_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs font-mono">
                          {item.client_ip || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.has_file ? (
                            <div className="flex items-center justify-center gap-1 text-accent">
                              <FileText size={13} />
                              <span className="text-xs max-w-[80px] truncate">{item.filename || 'sí'}</span>
                            </div>
                          ) : (
                            <span className="text-muted/40 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs whitespace-nowrap">
                          {item.input_tokens != null
                            ? `${item.input_tokens.toLocaleString()} / ${(item.output_tokens || 0).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs whitespace-nowrap">
                          {item.duration_ms ? `${(item.duration_ms / 1000).toFixed(2)}s` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.status === 'ok' ? (
                            <span className="text-success text-xs bg-success/10 px-2 py-0.5 rounded-full">OK</span>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-danger text-xs bg-danger/10 px-2 py-0.5 rounded-full">Error</span>
                              {item.error_msg && (
                                <span className="text-danger/60 text-xs max-w-[100px] truncate" title={item.error_msg}>
                                  {item.error_msg}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 text-sm text-muted hover:text-fore
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <span className="text-muted text-sm">
                Página {page} de {pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-2 text-sm text-muted hover:text-fore
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Limpiar todos los registros"
          message={`¿Eliminar todos los registros (${total.toLocaleString()})? Esta acción no se puede deshacer.`}
          confirmLabel="Limpiar registros"
          loading={clearing}
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  )
}

export default function Logs() {
  return (
    <ToastProvider>
      <LogsInner />
    </ToastProvider>
  )
}
