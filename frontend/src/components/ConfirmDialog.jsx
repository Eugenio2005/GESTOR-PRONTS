import { AlertTriangle, X } from 'lucide-react'
import Spinner from './Spinner'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className={danger ? 'text-danger' : 'text-accent'} />
            <h2 className="text-fore font-semibold text-sm">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-muted hover:text-fore transition-colors disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-muted text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-muted hover:text-fore transition-colors text-sm px-4 py-2 disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50
              ${danger
                ? 'bg-danger/10 border border-danger/30 hover:bg-danger/20 text-danger'
                : 'bg-accent hover:bg-accent-hover text-white'
              }`}
          >
            {loading && <Spinner size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
