import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let _id = 0

const ICONS = {
  success: <CheckCircle size={16} className="text-success shrink-0" />,
  error: <XCircle size={16} className="text-danger shrink-0" />,
  info: <Info size={16} className="text-accent shrink-0" />,
}

const BORDER = {
  success: 'border-success/30',
  error: 'border-danger/30',
  info: 'border-accent/30',
}

function ToastItem({ id, message, type, onRemove }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onRemove(id), 250)
  }, [id, onRemove])

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, 3000)
    return () => clearTimeout(timerRef.current)
  }, [dismiss])

  return (
    <div
      className={`
        flex items-start gap-3 bg-surface border ${BORDER[type] || 'border-border'}
        rounded-[10px] px-4 py-3 shadow-xl min-w-[260px] max-w-[360px]
        ${exiting ? 'toast-exit' : 'toast-enter'}
      `}
      role="alert"
    >
      {ICONS[type] || ICONS.info}
      <span className="text-fore text-sm flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        className="text-muted hover:text-fore transition-colors shrink-0 mt-0.5"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info') => {
    const id = ++_id
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
