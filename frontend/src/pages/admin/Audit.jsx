import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import { getAdminAudit } from '../../lib/api'
import Spinner from '../../components/Spinner'
import { ToastProvider, useToast } from '../../components/Toast'

const ACTION_LABELS = {
  'section.create':    { label: 'Sección creada', color: 'text-success bg-success/10' },
  'section.update':    { label: 'Sección editada', color: 'text-accent bg-accent/10' },
  'section.delete':    { label: 'Sección eliminada', color: 'text-danger bg-danger/10' },
  'section.restore':   { label: 'Versión restaurada', color: 'text-accent bg-accent/10' },
  'section.duplicate': { label: 'Sección duplicada', color: 'text-success bg-success/10' },
  'user.create':       { label: 'Usuario creado', color: 'text-success bg-success/10' },
  'user.update':       { label: 'Usuario editado', color: 'text-accent bg-accent/10' },
  'user.toggle':       { label: 'Usuario activado/desactivado', color: 'text-yellow-500 bg-yellow-500/10' },
  'user.delete':       { label: 'Usuario eliminado', color: 'text-danger bg-danger/10' },
  'user.sections.update': { label: 'Permisos actualizados', color: 'text-accent bg-accent/10' },
  'cleanup.run':       { label: 'Limpieza ejecutada', color: 'text-danger bg-danger/10' },
}

function ActionBadge({ action }) {
  const def = ACTION_LABELS[action]
  if (def) {
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${def.color}`}>
        {def.label}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full text-muted bg-surface2">
      {action}
    </span>
  )
}

function AuditInner() {
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const d = await getAdminAudit(page)
      setData(d)
    } catch (err) {
      toast(err.message || 'Error al cargar auditoría', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const items = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-fore text-2xl font-semibold">Auditoría</h1>
        <p className="text-muted text-sm mt-1">
          Registro de acciones administrativas sobre secciones y usuarios.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Cargando auditoría..." />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay entradas de auditoría todavía.</p>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-4">{total.toLocaleString()} acciones registradas</p>

          <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface2/50 text-muted text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 text-left">Acción</th>
                    <th className="px-4 py-3 text-left">Recurso</th>
                    <th className="px-4 py-3 text-left">Detalles</th>
                    <th className="px-4 py-3 text-left">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const date = new Date(item.created_at)
                    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {dateStr}<br />{timeStr}
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={item.action} />
                        </td>
                        <td className="px-4 py-3 text-fore text-sm">
                          {item.resource_name || '—'}
                          {item.resource_id && (
                            <span className="text-muted text-xs ml-1">#{item.resource_id}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted text-xs max-w-[260px]">
                          {item.details ? (
                            <span className="line-clamp-2" title={item.details}>{item.details}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted text-xs font-mono">
                          {item.admin_ip || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 text-sm text-muted hover:text-fore disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-muted text-sm">Página {page} de {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-2 text-sm text-muted hover:text-fore disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Audit() {
  return (
    <ToastProvider>
      <AuditInner />
    </ToastProvider>
  )
}
