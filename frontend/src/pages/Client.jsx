import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  History, LogOut, Copy, Check, Sparkles, ChevronRight, Zap,
  Download, X, MessageSquare, Info, FileText, Columns2, Sun, Moon,
} from 'lucide-react'
import { getSections, streamSection, logout, exportQueryPdf, exportQueryDocx, compareModels, getMyLimits } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { ToastProvider, useToast } from '../components/Toast'
import Spinner from '../components/Spinner'
import FileZone from '../components/FileZone'
import MarkdownView from '../components/MarkdownView'

const COMPANY = 'Pagola & Madorran'

// ─── ChatGPT Modal ────────────────────────────────────────────
function ChatGPTModal({ prompt, onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={18} className="text-accent" />
            <span className="text-fore font-semibold">Prompt listo para ChatGPT</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fore transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-3 bg-accent/5 border-b border-border shrink-0">
          <p className="text-sm text-muted leading-relaxed">
            <span className="text-fore font-medium">Cómo usarlo:</span>{' '}
            Copia el texto de abajo, ve a{' '}
            <span className="text-accent font-medium">chat.openai.com</span>, abre una conversación
            nueva y pégalo. ChatGPT procesará la consulta completa.
          </p>
          <ol className="mt-2 text-xs text-muted space-y-0.5 list-decimal list-inside">
            <li>Pulsa <strong className="text-fore">Copiar prompt</strong> (abajo)</li>
            <li>Abre <strong className="text-fore">chat.openai.com</strong> en tu navegador</li>
            <li>Pega el texto en el campo de mensaje y envía</li>
            <li>Copia la respuesta de ChatGPT y úsala en tu trabajo</li>
          </ol>
        </div>

        {/* Prompt content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-fore text-xs font-mono whitespace-pre-wrap bg-surface2 rounded-lg p-4 border border-border leading-relaxed">
            {prompt}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border shrink-0">
          <span className="text-muted text-xs">{prompt.length.toLocaleString()} caracteres</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-fore transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white
                font-medium px-5 py-2 rounded-lg transition-colors text-sm"
            >
              {copied ? (
                <><Check size={15} className="text-white" /> ¡Copiado!</>
              ) : (
                <><Copy size={15} /> Copiar prompt</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CompareModal ─────────────────────────────────────────────
function CompareModal({ section, text, onClose }) {
  const [modelB, setModelB] = useState('gemini-2.0-flash')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const ALL_MODELS = [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
    'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash',
    'chatgpt-manual',
  ]

  async function handleCompare() {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const fd = new FormData()
      if (text) fd.append('client_text', text)
      fd.append('model_b', modelB)
      const data = await compareModels(section.id, fd)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Error al comparar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Columns2 size={18} className="text-accent" />
            <span className="text-fore font-semibold">Comparar modelos</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fore"><X size={18}/></button>
        </div>

        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm">Modelo A:</span>
            <span className="text-accent text-sm font-medium bg-accent/10 px-2.5 py-1 rounded">{section.model}</span>
          </div>
          <span className="text-muted text-sm">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm">Modelo B:</span>
            <select
              value={modelB}
              onChange={e => setModelB(e.target.value)}
              className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-fore text-sm outline-none focus:border-accent"
            >
              {ALL_MODELS.filter(m => m !== section.model).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner size={14} /> : <Zap size={14} />}
            {loading ? 'Comparando...' : 'Comparar'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="px-5 py-4 text-danger text-sm">{error}</div>
          )}
          {results && (
            <div className="grid grid-cols-2 divide-x divide-border h-full">
              {[results.model_a, results.model_b].map((r, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i === 0 ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}`}>
                      {r.model}
                    </span>
                    {r.duration_ms > 0 && <span className="text-muted text-xs">{(r.duration_ms/1000).toFixed(1)}s</span>}
                    {r.tokens?.total > 0 && <span className="text-muted text-xs">{r.tokens.total} tokens</span>}
                  </div>
                  {r.error ? (
                    <p className="text-danger text-sm">{r.error}</p>
                  ) : (
                    <MarkdownView content={r.result || ''} />
                  )}
                </div>
              ))}
            </div>
          )}
          {!results && !error && !loading && (
            <div className="flex items-center justify-center h-40 text-muted text-sm">
              Selecciona el segundo modelo y pulsa "Comparar"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LimitBar ─────────────────────────────────────────────────
function LimitBar() {
  const [limits, setLimits] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    getMyLimits()
      .then(d => { if (mountedRef.current) setLimits(d) })
      .catch(() => {})
    return () => { mountedRef.current = false }
  }, [])

  if (!limits) return null
  const { daily_used, daily_limit, monthly_used, monthly_limit } = limits
  if (!daily_limit && !monthly_limit) return null

  function Bar({ used, limit, label }) {
    if (!limit) return null
    const pct = Math.min(100, Math.round((used / limit) * 100))
    const danger = pct >= 90
    const warn = pct >= 70
    return (
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-muted/70 text-xs">{label}</span>
          <span className={`text-xs font-medium ${danger ? 'text-danger' : warn ? 'text-yellow-400' : 'text-muted'}`}>
            {used}/{limit}
          </span>
        </div>
        <div className="h-1 bg-surface2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? 'bg-danger' : warn ? 'bg-yellow-400' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
      <Bar used={daily_used} limit={daily_limit} label="Hoy" />
      <Bar used={monthly_used} limit={monthly_limit} label="Este mes" />
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ sections, activeId, onSelect, user, onLogout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Logo + company */}
      <div className="px-5 py-4 border-b border-border">
        <img
          src="/asserts/logo.png"
          alt="Logo"
          className="h-8 w-auto object-contain mb-2"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <p className="text-muted text-xs font-medium tracking-wide">{COMPANY}</p>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-sm shrink-0">
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-fore text-sm font-medium truncate">{user?.display_name || user?.username}</p>
            <p className="text-muted text-xs truncate">{user?.department || 'Usuario'}</p>
          </div>
        </div>
      </div>

      {/* Usage limits */}
      <LimitBar />

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        <p className="text-muted/60 text-xs uppercase tracking-widest font-medium px-2 mb-1">
          Secciones
        </p>
        {sections.length === 0 && (
          <p className="text-muted text-sm px-2 py-2">Sin secciones disponibles</p>
        )}
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => onSelect(sec)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors text-left
              ${activeId === sec.id
                ? 'bg-accent text-white'
                : 'text-muted hover:text-fore hover:bg-surface2'
              }
            `}
          >
            <span className="text-base leading-none shrink-0">{sec.icon || '🔧'}</span>
            <span className="truncate">{sec.name}</span>
            {sec.model === 'chatgpt-manual' && (
              <MessageSquare size={12} className="ml-auto shrink-0 opacity-60" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-3 border-t border-border flex flex-col gap-1">
        <button
          onClick={() => navigate('/historial')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-muted hover:text-fore hover:bg-surface2 transition-colors"
        >
          <History size={16} className="shrink-0" />
          Historial
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-muted hover:text-fore hover:bg-surface2 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// ─── WorkArea ─────────────────────────────────────────────────
function WorkArea({ section, retryText = '', retryFiles = [], onRetryConsumed }) {
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState(null)
  const [streamText, setStreamText] = useState('')
  const [copied, setCopied] = useState(false)
  const [showChatGPT, setShowChatGPT] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const timerRef = useRef(null)
  const streamTextRef = useRef('')
  const abortRef = useRef(null)
  const mountedRef = useRef(true)
  const isManual = section.model === 'chatgpt-manual'

  // Track mounted state and cancel on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearInterval(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // Auto-save draft per section
  useEffect(() => {
    if (text) localStorage.setItem(`draft_${section.id}`, text)
    else localStorage.removeItem(`draft_${section.id}`)
  }, [text, section.id])

  // Load draft when section changes
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${section.id}`)
    setText(retryText || saved || '')
    if (retryText && onRetryConsumed) onRetryConsumed()
    setFiles(retryFiles)
    setResult(null)
    setStreamText('')
    streamTextRef.current = ''
    setCopied(false)
    setShowChatGPT(false)
  }, [section.id])  // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer() {
    setElapsed(0)
    timerRef.current = setInterval(() => {
      if (mountedRef.current) setElapsed((e) => e + 1)
    }, 1000)
  }
  function stopTimer() { clearInterval(timerRef.current) }

  const handleProcess = useCallback(async () => {
    const needsText = section.input_type === 'text' || section.input_type === 'both'
    const needsFile = section.input_type === 'file'

    // For chatgpt-manual the prompt template itself is the output — text is optional
    if (!isManual) {
      if (needsText && section.input_type === 'text' && !text.trim()) {
        toast('Escribe el texto antes de procesar', 'error')
        return
      }
      if (needsText && section.input_type === 'both' && !text.trim() && files.length === 0) {
        toast('Escribe el texto o adjunta un archivo antes de procesar', 'error')
        return
      }
    }
    if (needsFile && files.length === 0) {
      toast('Selecciona un archivo antes de procesar', 'error')
      return
    }

    // Request notification permission if not yet decided
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    setLoading(true)
    setResult(null)
    setStreamText('')
    streamTextRef.current = ''
    startTimer()

    const abort = new AbortController()
    abortRef.current = abort

    const fd = new FormData()
    if (text.trim()) fd.append('client_text', text.trim())
    for (const f of files) fd.append('files', f)

    try {
      const res = await streamSection(section.id, fd, abort.signal)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!mountedRef.current) { reader.cancel(); break }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text && mountedRef.current) {
              streamTextRef.current += data.text
              setStreamText(streamTextRef.current)
            }
            if (data.done && mountedRef.current) {
              const finalResult = { ...data, result: streamTextRef.current }
              setResult(finalResult)
              // Clear draft on success
              localStorage.removeItem(`draft_${section.id}`)
              // Browser notification if tab not focused
              if (document.hidden && Notification.permission === 'granted') {
                new Notification('Gestor IA — Pagola & Madorran', {
                  body: `Respuesta de "${section.name}" lista`,
                  icon: '/asserts/logo.png',
                })
              }
              if (data.mode === 'manual') {
                setShowChatGPT(true)
                toast('Prompt generado — cópialo y pégalo en ChatGPT', 'success')
              } else {
                toast('Procesado correctamente', 'success')
              }
            }
            if (data.error) throw new Error(data.error)
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.startsWith('JSON')) {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      if (mountedRef.current) toast(err.message || 'Error al procesar', 'error')
    } finally {
      setLoading(false)
      stopTimer()
    }
  }, [section, text, files, toast])

  // Ctrl+Enter to process
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading) handleProcess()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [loading, handleProcess])

  function handleCopy() {
    const content = result?.result || streamText
    if (!content) return
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleExportPdf() {
    if (!result?.query_id) return
    setExportingPdf(true)
    try {
      const res = await exportQueryPdf(result.query_id)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respuesta_${result.query_id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Error al generar el PDF', 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportDocx() {
    if (!result?.query_id) return
    setExportingDocx(true)
    try {
      const res = await exportQueryDocx(result.query_id)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respuesta_${result.query_id}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Error al generar el DOCX', 'error')
    } finally {
      setExportingDocx(false)
    }
  }

  function handleQuickInput(qi) {
    setText((prev) => prev ? prev + '\n' + qi : qi)
  }

  const showText = section.input_type === 'text' || section.input_type === 'both'
  const showFile = section.input_type === 'file' || section.input_type === 'both'
  const displayContent = loading ? streamText : (result?.result || streamText)

  return (
    <>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        {/* Section header */}
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-0.5">{section.icon || '🔧'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-fore text-xl font-semibold">{section.name}</h1>
              {isManual ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
                  <MessageSquare size={11} />
                  Para ChatGPT
                </span>
              ) : (
                section.model && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {section.model}
                  </span>
                )
              )}
            </div>
            {section.description && (
              <p className="text-muted text-sm mt-1 flex items-start gap-1.5">
                <Info size={13} className="mt-0.5 shrink-0" />
                {section.description}
              </p>
            )}
            {isManual && (
              <p className="text-yellow-400/70 text-xs mt-1">
                Esta sección genera un prompt optimizado para pegar en ChatGPT — no consume créditos de API.
              </p>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="bg-surface border border-border rounded-[10px] p-5 flex flex-col gap-4">
          {showText && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted font-medium">Texto de consulta</label>
                <span className="text-muted/50 text-xs">{text.length} caracteres</span>
              </div>

              {/* Quick inputs pills */}
              {section.quick_inputs && section.quick_inputs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {section.quick_inputs.map((qi, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickInput(qi)}
                      disabled={loading}
                      className="text-xs px-2.5 py-1 rounded-full border border-border
                        text-muted hover:text-fore hover:border-accent hover:bg-accent/5
                        transition-colors disabled:opacity-40"
                    >
                      {qi}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
                placeholder="Escribe tu consulta aquí..."
                rows={5}
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors resize-y
                  placeholder:text-muted/50 disabled:opacity-50 min-h-[100px]"
              />
            </div>
          )}

          {showFile && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted font-medium">
                Archivos adjuntos
                {files.length > 0 && (
                  <span className="ml-1.5 text-accent font-normal">({files.length})</span>
                )}
              </label>
              <FileZone onFiles={setFiles} initialFiles={files} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleProcess}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                text-white font-medium px-5 py-2.5 rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size={16} />
                  {isManual ? 'Generando...' : `Procesando... ${elapsed > 0 ? `(${elapsed}s)` : ''}`}
                </>
              ) : (
                <>
                  {isManual ? <MessageSquare size={16} /> : <Zap size={16} />}
                  {isManual ? 'Generar prompt' : 'Procesar'}
                </>
              )}
            </button>
            <span className="text-muted/40 text-xs">Ctrl + Enter</span>
            {!isManual && (
              <button
                onClick={() => setShowCompare(true)}
                disabled={loading}
                title="Comparar respuestas de dos modelos"
                className="flex items-center gap-1.5 text-muted hover:text-fore border border-border hover:border-accent px-3 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Columns2 size={15} />
                Comparar
              </button>
            )}
          </div>
        </div>

        {/* Manual mode: show re-open button after modal is closed */}
        {result?.mode === 'manual' && !showChatGPT && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[10px] px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={16} className="text-yellow-400 shrink-0" />
              <p className="text-yellow-400/90 text-sm">Prompt generado y listo para copiar en ChatGPT</p>
            </div>
            <button
              onClick={() => setShowChatGPT(true)}
              className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              <MessageSquare size={14} />
              Ver prompt
            </button>
          </div>
        )}

        {/* Streaming / Result area — AI response */}
        {(loading && streamText) || (result && !isManual) ? (
          <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className={loading ? 'text-accent animate-pulse' : 'text-accent'} />
                <span className="text-fore text-sm font-medium">
                  {loading ? 'Generando respuesta...' : 'Resultado'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {result?.tokens && (
                  <span className="text-muted text-xs bg-surface2 px-2 py-1 rounded">
                    {result.tokens.total?.toLocaleString() || 0} tokens
                  </span>
                )}
                {result?.model && (
                  <span className="text-accent text-xs bg-accent/10 px-2 py-1 rounded">
                    {result.model}
                  </span>
                )}
                {result?.duration_ms && (
                  <span className="text-muted text-xs">
                    {(result.duration_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-muted hover:text-fore transition-colors
                    bg-surface2 px-2.5 py-1 rounded text-xs"
                >
                  {copied ? (
                    <><Check size={13} className="text-success" /> Copiado</>
                  ) : (
                    <><Copy size={13} /> Copiar</>
                  )}
                </button>
                {result?.query_id && (
                  <>
                    <button
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      title="Descargar como PDF"
                      className="flex items-center gap-1.5 text-muted hover:text-fore transition-colors
                        bg-surface2 px-2.5 py-1 rounded text-xs disabled:opacity-50"
                    >
                      {exportingPdf ? <Spinner size={13} /> : <Download size={13} />}
                      PDF
                    </button>
                    <button
                      onClick={handleExportDocx}
                      disabled={exportingDocx}
                      title="Descargar como DOCX"
                      className="flex items-center gap-1.5 text-muted hover:text-fore transition-colors
                        bg-surface2 px-2.5 py-1 rounded text-xs disabled:opacity-50"
                    >
                      {exportingDocx ? <Spinner size={13} /> : <FileText size={13} />}
                      DOCX
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="px-5 py-4">
              <MarkdownView content={displayContent} />
              {loading && (
                <span className="inline-block w-1.5 h-4 bg-accent animate-pulse rounded-sm ml-0.5 align-middle" />
              )}
            </div>
            {result?.query_id && !loading && (
              <div className="px-5 py-3 border-t border-border">
                <Link
                  to={`/historial/${result.query_id}`}
                  className="flex items-center gap-1.5 text-accent text-sm hover:text-accent-hover transition-colors"
                >
                  Ver en historial
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        ) : null}

        {/* Result area — Manual/ChatGPT mode */}
        {result && isManual && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-500/20">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-yellow-400" />
                <span className="text-fore text-sm font-medium">Prompt generado para ChatGPT</span>
              </div>
              <button
                onClick={() => setShowChatGPT(true)}
                className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20
                  text-yellow-400 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Copy size={13} />
                Ver y copiar
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-muted text-sm mb-3">
                Tu consulta ha sido formateada como un prompt optimizado. Cópialo y pégalo en ChatGPT para obtener la respuesta.
              </p>
              <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
                <li>Pulsa <strong className="text-fore">"Ver y copiar"</strong> arriba</li>
                <li>Ve a <strong className="text-fore">chat.openai.com</strong></li>
                <li>Pega el texto y envía el mensaje</li>
              </ol>
            </div>
            {result.query_id && (
              <div className="px-5 py-3 border-t border-yellow-500/20">
                <Link
                  to={`/historial/${result.query_id}`}
                  className="flex items-center gap-1.5 text-accent text-sm hover:text-accent-hover transition-colors"
                >
                  Ver en historial
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {showChatGPT && result?.mode === 'manual' && (
        <ChatGPTModal
          prompt={result.result}
          onClose={() => setShowChatGPT(false)}
        />
      )}
      {showCompare && (
        <CompareModal
          section={section}
          text={text}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  )
}

// ─── Welcome state ────────────────────────────────────────────
function WelcomeState({ user }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
        <Sparkles size={28} className="text-accent" />
      </div>
      <div>
        <h2 className="text-fore text-xl font-semibold mb-1">
          Hola, {user?.display_name || user?.username}
        </h2>
        <p className="text-muted text-sm max-w-xs">
          Selecciona una sección en el panel izquierdo para comenzar a procesar consultas.
        </p>
      </div>
      <p className="text-muted/40 text-xs">{COMPANY}</p>
    </div>
  )
}

// ─── Main Client Page ─────────────────────────────────────────
function ClientInner() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [loadingSections, setLoadingSections] = useState(true)
  const [retryText, setRetryText] = useState('')
  const [retryFiles, setRetryFiles] = useState([])

  useEffect(() => {
    getSections()
      .then(async (data) => {
        setSections(data)
        const retryRaw = sessionStorage.getItem('retry_data')
        if (retryRaw) {
          try {
            const retry = JSON.parse(retryRaw)
            const sec = data.find(s => s.id === retry.section_id)
            if (sec) {
              setActiveSection(sec)
              setRetryText(retry.client_text || '')
              // Fetch original files from server if available
              if (retry.query_id && retry.filename) {
                const names = Array.isArray(retry.filename)
                  ? retry.filename
                  : [retry.filename]
                const fetched = await Promise.all(
                  names.map(async (name) => {
                    try {
                      const res = await fetch(
                        `/api/historial/${retry.query_id}/archivo/${encodeURIComponent(name)}`,
                        { credentials: 'include' }
                      )
                      if (!res.ok) return null
                      const blob = await res.blob()
                      return new File([blob], name, { type: blob.type })
                    } catch { return null }
                  })
                )
                setRetryFiles(fetched.filter(Boolean))
              }
            }
            sessionStorage.removeItem('retry_data')
          } catch {}
        }
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false))
  }, [])

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar
        sections={sections}
        activeId={activeSection?.id}
        onSelect={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        {loadingSections ? (
          <div className="flex items-center justify-center h-full">
            <Spinner label="Cargando secciones..." />
          </div>
        ) : activeSection ? (
          <div className="p-6">
            <WorkArea
              key={activeSection.id}
              section={activeSection}
              retryText={retryText}
              retryFiles={retryFiles}
              onRetryConsumed={() => { setRetryText(''); setRetryFiles([]) }}
            />
          </div>
        ) : (
          <WelcomeState user={user} />
        )}
      </main>
    </div>
  )
}

export default function Client() {
  return (
    <ToastProvider>
      <ClientInner />
    </ToastProvider>
  )
}
