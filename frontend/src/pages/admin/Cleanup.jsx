import { useEffect, useState } from 'react'
import { Trash2, ShieldCheck, Shield, RefreshCw, AlertTriangle, HardDrive } from 'lucide-react'
import { getCleanupPreview, runCleanup, toggleQueryProtection } from '../../lib/api'
import Spinner from '../../components/Spinner'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ToastProvider, useToast } from '../../components/Toast'

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function CleanupInner() {
  const { toast } = useToast()
  const [days, setDays] = useState(30)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [excluded, setExcluded] = useState(new Set())
  const [confirmRun, setConfirmRun] = useState(false)

  async function loadPreview() {
    setLoading(true)
    try {
      const d = await getCleanupPreview(days)
      setPreview(d)
      setExcluded(new Set())
    } catch (err) {
      toast(err.message || 'Error al cargar preview', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleProtect(id) {
    try {
      const res = await toggleQueryProtection(id)
      setPreview(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, is_protected: res.is_protected } : i),
      }))
      toast(res.is_protected ? 'Consulta protegida' : 'Protección retirada', 'success')
    } catch (err) {
      toast(err.message || 'Error', 'error')
    }
  }

  function toggleExclude(id) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRun() {
    const toDelete = (preview?.items || []).filter(i => !i.is_protected && !excluded.has(i.id))
    if (toDelete.length === 0) {
      toast('No hay archivos a eliminar', 'info')
      return
    }
    setConfirmRun(true)
  }

  async function executeRun() {
    setRunning(true)
    try {
      const res = await runCleanup(days, [...excluded])
      toast(`Limpieza completada: ${res.deleted} consultas, ${fmt(res.freed_bytes)} liberados`, 'success')
      await loadPreview()
    } catch (err) {
      toast(err.message || 'Error al ejecutar limpieza', 'error')
    } finally {
      setRunning(false)
      setConfirmRun(false)
    }
  }

  const deletable = (preview?.items || []).filter(i => !i.is_protected && !excluded.has(i.id))
  const totalSize = deletable.reduce((acc, i) => acc + (i.size_bytes || 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-fore text-2xl font-semibold">Limpieza de archivos</h1>
        <p className="text-muted text-sm mt-1">
          Elimina los archivos adjuntos de consultas antiguas. El texto y los registros se conservan.
        </p>
      </div>

      {/* Config */}
      <div className="bg-surface border border-border rounded-[10px] p-5 mb-6">
        <h2 className="text-fore text-base font-semibold mb-4">Configuración</h2>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Eliminar archivos con más de</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-24 bg-surface2 border border-border rounded-lg px-3 py-2 text-fore text-sm outline-none focus:border-accent"
              />
              <span className="text-muted text-sm">días de antigüedad</span>
            </div>
          </div>
          <button
            onClick={loadPreview}
            disabled={loading}
            className="flex items-center gap-2 bg-surface2 border border-border hover:border-accent text-fore text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner size={15} /> : <RefreshCw size={15} />}
            Previsualizar
          </button>
        </div>
      </div>

      {preview && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-[10px] p-4">
              <p className="text-muted text-xs mb-1">Consultas a procesar</p>
              <p className="text-fore text-2xl font-bold">{preview.total}</p>
            </div>
            <div className="bg-surface border border-border rounded-[10px] p-4">
              <p className="text-muted text-xs mb-1">Se eliminarán</p>
              <p className="text-danger text-2xl font-bold">{deletable.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-[10px] p-4">
              <p className="text-muted text-xs mb-1">Espacio a liberar</p>
              <p className="text-success text-2xl font-bold flex items-center gap-1.5">
                <HardDrive size={18} />
                {fmt(totalSize)}
              </p>
            </div>
          </div>

          {preview.total === 0 ? (
            <div className="text-center py-16 text-muted">
              <ShieldCheck size={40} className="mx-auto mb-3 text-success/50" />
              <p>No hay consultas con archivos anteriores a {days} días.</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-border rounded-[10px] overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-fore text-base font-semibold">
                    Consultas afectadas
                    <span className="text-muted text-sm font-normal ml-2">
                      — marca como protegida o excluye de esta ejecución
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface2/50 text-muted text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Excluir</th>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-left">Usuario</th>
                        <th className="px-4 py-3 text-left">Sección</th>
                        <th className="px-4 py-3 text-left">Archivo</th>
                        <th className="px-4 py-3 text-right">Tamaño</th>
                        <th className="px-4 py-3 text-center">Protegida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.items.map(item => {
                        const isExcluded = excluded.has(item.id)
                        const willDelete = !item.is_protected && !isExcluded
                        return (
                          <tr key={item.id}
                            className={`border-b border-border/50 transition-colors ${item.is_protected ? 'bg-success/5' : isExcluded ? 'bg-surface2/40' : willDelete ? '' : ''}`}>
                            <td className="px-4 py-3">
                              {!item.is_protected && (
                                <input
                                  type="checkbox"
                                  checked={isExcluded}
                                  onChange={() => toggleExclude(item.id)}
                                  className="accent-accent"
                                  title="Excluir de esta limpieza"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-fore text-sm">{item.user_display_name || '—'}</td>
                            <td className="px-4 py-3 text-muted text-sm">{item.section_name || '—'}</td>
                            <td className="px-4 py-3 text-muted text-xs truncate max-w-[160px]">
                              {item.has_file ? (item.filename || 'Archivo') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-muted text-xs">
                              {item.folder_exists ? fmt(item.size_bytes || 0) : <span className="text-muted/40">ya eliminado</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleProtect(item.id)}
                                title={item.is_protected ? 'Quitar protección' : 'Proteger (nunca borrar)'}
                                className={`transition-colors ${item.is_protected ? 'text-success hover:text-muted' : 'text-muted hover:text-success'}`}
                              >
                                {item.is_protected ? <ShieldCheck size={16} /> : <Shield size={16} />}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {deletable.length > 0 && (
                <div className="bg-danger/5 border border-danger/20 rounded-[10px] p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-fore text-sm font-medium">Confirma la limpieza</p>
                      <p className="text-muted text-sm mt-0.5">
                        Se eliminarán los archivos de <strong className="text-fore">{deletable.length}</strong> consultas
                        liberando <strong className="text-fore">{fmt(totalSize)}</strong>.
                        El historial de texto permanece en la base de datos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="flex items-center gap-2 bg-danger hover:bg-danger/80 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {running ? <Spinner size={15} /> : <Trash2 size={15} />}
                    {running ? 'Eliminando...' : 'Ejecutar limpieza'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!preview && !loading && (
        <div className="text-center py-20 text-muted">
          <HardDrive size={40} className="mx-auto mb-3 opacity-30" />
          <p>Configura los días de retención y pulsa "Previsualizar"</p>
        </div>
      )}

      {confirmRun && (
        <ConfirmDialog
          title="Ejecutar limpieza"
          message={`¿Eliminar archivos adjuntos de ${(preview?.items || []).filter(i => !i.is_protected && !excluded.has(i.id)).length} consultas? Los registros de texto se conservan en la base de datos.`}
          confirmLabel="Ejecutar limpieza"
          loading={running}
          onConfirm={executeRun}
          onCancel={() => setConfirmRun(false)}
        />
      )}
    </div>
  )
}

export default function Cleanup() {
  return (
    <ToastProvider>
      <CleanupInner />
    </ToastProvider>
  )
}
