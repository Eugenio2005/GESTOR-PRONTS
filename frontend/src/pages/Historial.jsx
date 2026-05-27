import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, CheckCircle, XCircle, Clock, Search, Tag, SlidersHorizontal, ChevronDown, X, Download, Star } from 'lucide-react'
import { getHistorial, exportMyHistorial, exportMyHistorialPdf, toggleFavorite } from '../lib/api'
import Spinner from '../components/Spinner'

function StatusBadge({ status }) {
  if (status === 'ok') {
    return (
      <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
        <CheckCircle size={11} />
        OK
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-danger bg-danger/10 px-2 py-0.5 rounded-full">
        <XCircle size={11} />
        Error
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted bg-surface2 px-2 py-0.5 rounded-full">
      <Clock size={11} />
      {status}
    </span>
  )
}

function HistorialCard({ item, onClick, onTagClick, onToggleFavorite }) {
  const date = new Date(item.created_at)
  const dateStr = date.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border rounded-[10px] p-5 cursor-pointer
        hover:border-accent/40 hover:bg-surface2/50 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{item.section_icon || '🔧'}</span>
          <span className="text-fore text-sm font-medium truncate group-hover:text-accent transition-colors">
            {item.section_name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.has_file && (
            <span className="flex items-center gap-1 text-xs text-muted bg-surface2 px-2 py-0.5 rounded-full">
              <FileText size={11} />
              Archivo
            </span>
          )}
          <StatusBadge status={item.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(item) }}
            title={item.is_favorite ? 'Quitar favorito' : 'Marcar como favorito'}
            className={`transition-colors ${item.is_favorite ? 'text-yellow-400' : 'text-muted hover:text-yellow-400'}`}
          >
            <Star size={13} fill={item.is_favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Question snippet */}
      {item.client_text && (
        <p className="text-muted text-sm mb-2 line-clamp-2 leading-relaxed">
          {item.client_text}
        </p>
      )}

      {/* Result snippet */}
      {item.result && (
        <p className="text-fore/60 text-xs mb-3 line-clamp-2 leading-relaxed">
          {item.result}
        </p>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2" onClick={e => e.stopPropagation()}>
          {item.tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-accent/20 transition-colors"
            >
              <Tag size={10} />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-muted text-xs">
          {dateStr} &middot; {timeStr}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted">
          {item.input_tokens != null && (
            <span>{(item.input_tokens + (item.output_tokens || 0)).toLocaleString()} tokens</span>
          )}
          {item.duration_ms != null && (
            <span>{(item.duration_ms / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Historial() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ section_id: '', date_from: '', date_to: '', status: '', tag: '' })
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [availableSections, setAvailableSections] = useState([])
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const abortRef = useRef(null)

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  // Debounce search input 400ms
  function handleSearch(value) {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      setDebouncedQ(value)
    }, 400)
  }

  function handleFilterChange(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ section_id: '', date_from: '', date_to: '', status: '', tag: '' })
    setPage(1)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await exportMyHistorial()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando CSV:', err)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await exportMyHistorialPdf()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando PDF:', err)
    } finally {
      setExportingPdf(false)
    }
  }

  function handleTagClick(tag) {
    setFilters(f => ({ ...f, tag }))
    setPage(1)
    setShowFilters(true)
  }

  async function handleToggleFavorite(item) {
    try {
      const res = await toggleFavorite(item.id)
      setData(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, is_favorite: res.is_favorite } : i),
      }) : prev)
    } catch (err) {
      console.error('Error al actualizar favorito:', err)
    }
  }

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError('')
    getHistorial(page, debouncedQ, { ...filters, favorites: onlyFavorites })
      .then(d => {
        if (controller.signal.aborted) return
        setData(d)
        if (d.sections) setAvailableSections(d.sections)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.message || 'Error al cargar el historial')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, debouncedQ, filters, onlyFavorites])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted hover:text-fore transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <div className="flex-1">
            <h1 className="text-fore text-2xl font-semibold">Historial</h1>
            {data && (
              <p className="text-muted text-sm mt-0.5">
                {data.total.toLocaleString()} consulta{data.total !== 1 ? 's' : ''} en total
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setOnlyFavorites(v => !v); setPage(1) }}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${onlyFavorites ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'bg-surface border-border text-muted hover:border-accent hover:text-fore'}`}
              title="Ver solo favoritos"
            >
              <Star size={14} fill={onlyFavorites ? 'currentColor' : 'none'} />
              Favoritos
            </button>
            {data?.total > 0 && (
              <>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-surface border border-border hover:border-accent text-fore text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  {exporting ? 'Exportando...' : 'CSV'}
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-2 bg-surface border border-border hover:border-accent text-fore text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  {exportingPdf ? 'Exportando...' : 'PDF'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar en historial..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5
                text-fore text-sm outline-none focus:border-accent transition-colors
                placeholder:text-muted/50"
            />
            {q !== debouncedQ && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                Buscando...
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 text-muted hover:text-fore text-sm transition-colors mb-3"
          >
            <SlidersHorizontal size={15} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full ml-1">{activeFiltersCount}</span>
            )}
            <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} style={{transition:'transform 0.2s'}} />
          </button>

          {showFilters && (
            <div className="bg-surface border border-border rounded-[10px] p-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Sección</label>
                <select
                  value={filters.section_id}
                  onChange={e => handleFilterChange('section_id', e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
                >
                  <option value="">Todas</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Desde</label>
                <input type="date" value={filters.date_from}
                  onChange={e => handleFilterChange('date_from', e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Hasta</label>
                <input type="date" value={filters.date_to}
                  onChange={e => handleFilterChange('date_to', e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Estado</label>
                <select value={filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
                >
                  <option value="">Todos</option>
                  <option value="ok">Completado</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Tag</label>
                <div className="relative">
                  <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={filters.tag}
                    onChange={e => handleFilterChange('tag', e.target.value)}
                    placeholder="Filtrar por tag..."
                    className="w-full bg-surface2 border border-border rounded-lg pl-7 pr-2.5 py-1.5 text-fore text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters}
                  className="col-span-2 sm:col-span-5 text-xs text-muted hover:text-danger transition-colors text-left flex items-center gap-1 mt-1"
                >
                  <X size={12} /> Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner label="Cargando historial..." />
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger/30 rounded-[10px] px-5 py-4 text-danger text-sm">
            {error}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg mb-2">
              {debouncedQ ? 'Sin resultados para esta búsqueda' : 'Sin consultas todavía'}
            </p>
            <p className="text-muted/60 text-sm">
              {debouncedQ ? 'Prueba con otros términos' : 'Tus consultas aparecerán aquí'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {data.items.map((item) => (
                <HistorialCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/historial/${item.id}`)}
                  onTagClick={handleTagClick}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 text-sm text-muted hover:text-fore
                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(7, data.pages) }, (_, i) => {
                    let p
                    if (data.pages <= 7) {
                      p = i + 1
                    } else if (page <= 4) {
                      p = i + 1
                    } else if (page >= data.pages - 3) {
                      p = data.pages - 6 + i
                    } else {
                      p = page - 3 + i
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded text-sm transition-colors ${
                          p === page
                            ? 'bg-accent text-white'
                            : 'text-muted hover:text-fore hover:bg-surface2'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
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
      </div>
    </div>
  )
}
