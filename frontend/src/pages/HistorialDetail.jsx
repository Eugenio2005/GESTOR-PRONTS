import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, Download, FileText, Clock, Zap,
  CheckCircle, XCircle, Tag, Plus, X, RefreshCw,
} from 'lucide-react'
import { getHistorialItem, getHistorialFile, exportQueryPdf, exportQueryDocx, updateHistorialTags, retryHistorialQuery } from '../lib/api'
import Spinner from '../components/Spinner'
import MarkdownView from '../components/MarkdownView'

function MetaBadge({ icon, label, value, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 bg-surface2 px-3 py-1.5 rounded-lg ${className}`}>
      {icon}
      <span className="text-muted text-xs">{label}:</span>
      <span className="text-fore text-xs font-medium">{value}</span>
    </div>
  )
}

export default function HistorialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [addingTag, setAddingTag] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getHistorialItem(id)
      .then(setItem)
      .catch((err) => setError(err.message || 'Error al cargar la consulta'))
      .finally(() => setLoading(false))
  }, [id])

  function handleCopy() {
    if (!item?.result) return
    navigator.clipboard.writeText(item.result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await exportQueryPdf(id)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respuesta_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando PDF:', err)
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportDocx() {
    setExportingDocx(true)
    try {
      const res = await exportQueryDocx(id)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `respuesta_${id}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando DOCX:', err)
    } finally {
      setExportingDocx(false)
    }
  }

  async function handleAddTag(e) {
    e.preventDefault()
    const tag = newTag.trim()
    if (!tag) return
    const tags = [...(item.tags || []), tag]
    try {
      const res = await updateHistorialTags(id, tags)
      setItem(prev => ({ ...prev, tags: res.tags }))
      setNewTag('')
      setAddingTag(false)
    } catch (err) { console.error(err) }
  }

  async function handleRemoveTag(tagToRemove) {
    const tags = (item.tags || []).filter(t => t !== tagToRemove)
    try {
      const res = await updateHistorialTags(id, tags)
      setItem(prev => ({ ...prev, tags: res.tags }))
    } catch (err) { console.error(err) }
  }

  async function handleRetry() {
    try {
      const data = await retryHistorialQuery(id)
      sessionStorage.setItem('retry_data', JSON.stringify(data))
      navigate('/')
    } catch (err) {
      console.error('Error al reintentar:', err)
    }
  }

  async function handleDownload(filename) {
    try {
      const res = await getHistorialFile(id, filename)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando archivo:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner label="Cargando consulta..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="bg-danger/10 border border-danger/30 rounded-[10px] px-5 py-4 text-danger text-sm max-w-md w-full text-center">
          <p className="mb-3">{error}</p>
          <button onClick={() => navigate('/historial')} className="text-sm text-muted hover:text-fore">
            Volver al historial
          </button>
        </div>
      </div>
    )
  }

  if (!item) return null

  const date = new Date(item.created_at)
  const dateStr = date.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const totalTokens = (item.input_tokens || 0) + (item.output_tokens || 0)

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/historial')}
            className="flex items-center gap-2 text-muted hover:text-fore transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Historial
          </button>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{item.section_icon || '🔧'}</span>
          <div>
            <h1 className="text-fore text-xl font-semibold">{item.section_name}</h1>
            <p className="text-muted text-sm capitalize">{dateStr} &middot; {timeStr}</p>
          </div>
          <div className="ml-auto">
            {item.status === 'ok' ? (
              <span className="flex items-center gap-1.5 text-sm text-success bg-success/10 px-3 py-1.5 rounded-full">
                <CheckCircle size={14} />
                Completado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-danger bg-danger/10 px-3 py-1.5 rounded-full">
                <XCircle size={14} />
                Error
              </span>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {totalTokens > 0 && (
            <MetaBadge
              icon={<Zap size={12} className="text-accent" />}
              label="Tokens"
              value={totalTokens.toLocaleString()}
            />
          )}
          {item.input_tokens != null && (
            <MetaBadge
              icon={<Zap size={12} className="text-muted" />}
              label="Entrada"
              value={item.input_tokens.toLocaleString()}
            />
          )}
          {item.output_tokens != null && (
            <MetaBadge
              icon={<Zap size={12} className="text-muted" />}
              label="Salida"
              value={item.output_tokens.toLocaleString()}
            />
          )}
          {item.duration_ms != null && (
            <MetaBadge
              icon={<Clock size={12} className="text-muted" />}
              label="Duración"
              value={`${(item.duration_ms / 1000).toFixed(2)}s`}
            />
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {(item.tags || []).map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">
              <Tag size={11} />
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 text-accent/70 hover:text-danger transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          {addingTag ? (
            <form onSubmit={handleAddTag} className="flex items-center gap-1">
              <input
                autoFocus
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nueva etiqueta..."
                maxLength={50}
                className="bg-surface2 border border-border rounded-lg px-2.5 py-1 text-fore text-xs outline-none focus:border-accent w-36"
              />
              <button type="submit" className="text-accent hover:text-accent-hover text-xs"><Check size={14}/></button>
              <button type="button" onClick={() => { setAddingTag(false); setNewTag('') }} className="text-muted hover:text-fore text-xs"><X size={14}/></button>
            </form>
          ) : (
            <button
              onClick={() => setAddingTag(true)}
              className="flex items-center gap-1 text-xs text-muted hover:text-accent border border-dashed border-border hover:border-accent px-2.5 py-1 rounded-full transition-colors"
            >
              <Plus size={11} /> Etiqueta
            </button>
          )}
        </div>

        {/* Question */}
        {item.client_text && (
          <div className="bg-surface border border-border rounded-[10px] p-5 mb-4">
            <p className="text-muted text-xs uppercase tracking-wider font-medium mb-3">
              Consulta
            </p>
            <p className="text-fore text-sm leading-relaxed whitespace-pre-wrap">{item.client_text}</p>
          </div>
        )}

        {/* Files */}
        {item.files && item.files.length > 0 && (
          <div className="bg-surface border border-border rounded-[10px] p-5 mb-4">
            <p className="text-muted text-xs uppercase tracking-wider font-medium mb-3">
              Archivos adjuntos
            </p>
            <div className="flex flex-col gap-2">
              {item.files.map((filename) => (
                <button
                  key={filename}
                  onClick={() => handleDownload(filename)}
                  className="flex items-center gap-3 text-sm text-fore hover:text-accent
                    transition-colors group text-left"
                >
                  <FileText size={15} className="text-muted group-hover:text-accent shrink-0" />
                  <span className="truncate">{filename}</span>
                  <Download size={13} className="text-muted ml-auto shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {item.result && (
          <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="text-muted text-xs uppercase tracking-wider font-medium">
                Resultado
              </p>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleRetry}
                  title="Reintentar esta consulta"
                  className="flex items-center gap-1.5 text-muted hover:text-fore transition-colors bg-surface2 px-2.5 py-1 rounded text-xs"
                >
                  <RefreshCw size={13} />
                  Reintentar
                </button>
              </div>
            </div>
            <div className="px-5 py-5">
              <MarkdownView content={item.result} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
