import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Search, X, Download } from 'lucide-react'
import { getAdminQueries, getAdminQueryDetail, getAdminSections, getAdminUsers, exportAdminQueries } from '../../lib/api'
import Spinner from '../../components/Spinner'
import MarkdownView from '../../components/MarkdownView'
import { ToastProvider, useToast } from '../../components/Toast'

function QueriesInner() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detailQuery, setDetailQuery] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const debounceRef = useRef(null)

  const [sections, setSections] = useState([])
  const [users, setUsers] = useState([])
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState({
    section_id: '',
    user_id: '',
    status: '',
  })

  useEffect(() => {
    Promise.all([getAdminSections(), getAdminUsers()])
      .then(([s, u]) => { setSections(s); setUsers(u) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [page, filters, debouncedQ])

  async function loadData() {
    setLoading(true)
    try {
      const data = await getAdminQueries({ page, ...filters, q: debouncedQ })
      setItems(data.items || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      toast(err.message || 'Error al cargar consultas', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(value) {
    setSearchQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      setDebouncedQ(value)
    }, 400)
  }

  async function handleViewDetail(id) {
    setLoadingDetail(true)
    try {
      const data = await getAdminQueryDetail(id)
      setDetailQuery(data)
    } catch (err) {
      toast(err.message || 'Error al cargar detalle', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  function handleFilter(field, value) {
    setFilters((f) => ({ ...f, [field]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters({ section_id: '', user_id: '', status: '' })
    setPage(1)
  }

  async function handleExport(format) {
    setExporting(format)
    try {
      const res = await exportAdminQueries(format, filters)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consultas_admin_${new Date().toISOString().slice(0, 10)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast(err.message || 'Error al exportar', 'error')
    } finally {
      setExporting(false)
    }
  }

  const hasFilters = filters.section_id || filters.user_id || filters.status

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-fore text-2xl font-semibold">Consultas</h1>
          <p className="text-muted text-sm mt-1">
            {total.toLocaleString()} consulta{total !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="flex items-center gap-2 bg-surface border border-border hover:border-accent text-fore text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exporting === 'csv' ? 'Exportando...' : 'CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="flex items-center gap-2 bg-surface border border-border hover:border-accent text-fore text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exporting === 'pdf' ? 'Exportando...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQ}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar en consultas..."
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-fore text-sm outline-none focus:border-accent transition-colors placeholder:text-muted/50"
        />
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-[10px] p-4 mb-5 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={15} className="text-muted" />
          <span className="text-muted text-sm font-medium">Filtros</span>
        </div>

        {/* Section filter */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted">Sección</label>
          <select
            value={filters.section_id}
            onChange={(e) => handleFilter('section_id', e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm
              outline-none focus:border-accent transition-colors"
          >
            <option value="">Todas</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        {/* User filter */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted">Usuario</label>
          <select
            value={filters.user_id}
            onChange={(e) => handleFilter('user_id', e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm
              outline-none focus:border-accent transition-colors"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.display_name}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs text-muted">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm
              outline-none focus:border-accent transition-colors"
          >
            <option value="">Todos</option>
            <option value="ok">OK</option>
            <option value="error">Error</option>
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-muted hover:text-fore text-sm transition-colors self-end pb-1.5"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Cargando consultas..." />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">No hay consultas con los filtros aplicados.</p>
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
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Consulta</th>
                    <th className="px-4 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Resultado</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium whitespace-nowrap">Tokens</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium whitespace-nowrap">Tiempo</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Estado</th>
                    <th className="px-4 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const date = new Date(item.created_at)
                    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    const totalTokens = (item.input_tokens || 0) + (item.output_tokens || 0)
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 hover:bg-surface2/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {dateStr}<br />{timeStr}
                        </td>
                        <td className="px-4 py-3 text-fore text-sm">
                          {item.user_display_name || item.user || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted text-xs bg-surface2 px-2 py-0.5 rounded whitespace-nowrap">
                            {item.section_icon} {item.section_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs max-w-[160px]">
                          <span className="block truncate" title={item.client_text}>
                            {item.client_text ? item.client_text.slice(0, 60) + (item.client_text.length > 60 ? '…' : '') : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs max-w-[160px]">
                          <span className="block truncate" title={item.result}>
                            {item.result ? item.result.slice(0, 60) + (item.result.length > 60 ? '…' : '') : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs whitespace-nowrap">
                          {totalTokens > 0 ? totalTokens.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs whitespace-nowrap">
                          {item.duration_ms ? `${(item.duration_ms / 1000).toFixed(1)}s` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.status === 'ok' ? (
                            <span className="text-success text-xs bg-success/10 px-2 py-0.5 rounded-full">OK</span>
                          ) : (
                            <span className="text-danger text-xs bg-danger/10 px-2 py-0.5 rounded-full">Error</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewDetail(item.id)}
                            className="text-accent hover:text-accent-hover text-xs transition-colors"
                          >
                            Ver
                          </button>
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
      {detailQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-fore font-semibold">{detailQuery.section_icon} {detailQuery.section_name}</h2>
                <p className="text-muted text-xs mt-0.5">{detailQuery.user_display_name} · {new Date(detailQuery.created_at).toLocaleString('es-ES')}</p>
              </div>
              <button onClick={() => setDetailQuery(null)} className="text-muted hover:text-fore"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {detailQuery.client_text && (
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-2">Consulta</p>
                  <p className="text-fore text-sm whitespace-pre-wrap">{detailQuery.client_text}</p>
                </div>
              )}
              {detailQuery.result && (
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-2">Resultado</p>
                  <MarkdownView content={detailQuery.result} />
                </div>
              )}
              {detailQuery.tags && detailQuery.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detailQuery.tags.map(t => (
                    <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Queries() {
  return (
    <ToastProvider>
      <QueriesInner />
    </ToastProvider>
  )
}
