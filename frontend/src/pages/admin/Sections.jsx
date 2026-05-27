import { useEffect, useRef, useState } from 'react'
import { Plus, Edit2, Copy, Trash2, X, Save, ChevronUp, ChevronDown, Eye, History, RotateCcw } from 'lucide-react'
import {
  getAdminSections, createAdminSection, updateAdminSection,
  deleteAdminSection, duplicateAdminSection, reorderAdminSections,
  getAdminUsers, getSectionVersions, restoreSectionVersion,
} from '../../lib/api'
import Spinner from '../../components/Spinner'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ToastProvider, useToast } from '../../components/Toast'

const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'file', label: 'Archivo' },
  { value: 'both', label: 'Ambos' },
]

const DEFAULT_SECTION = {
  name: '',
  icon: '🔧',
  description: '',
  input_type: 'text',
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 4096,
  sort_order: 0,
  prompt: '',
  allowed_users: [],
  quick_inputs: [],
}

function modelProvider(model) {
  if (!model || model === 'chatgpt-manual') return 'manual'
  if (model.startsWith('gemini')) return 'gemini'
  return 'openai'
}

const PROVIDER_BADGE = {
  openai: 'bg-emerald-500/10 text-emerald-400',
  gemini: 'bg-blue-500/10 text-blue-400',
  manual: 'bg-yellow-500/10 text-yellow-400',
}
const PROVIDER_LABEL = { openai: 'OpenAI', gemini: 'Gemini', manual: 'ChatGPT Manual' }

function SectionModal({ section, users, onClose, onSave }) {
  const { toast } = useToast()

  function extractAllowedUsers(au) {
    if (!au || au.length === 0) return []
    if (typeof au[0] === 'object') return au.map(x => x.user_id)
    return [...au]
  }

  function extractSectionLimits(au) {
    if (!au || au.length === 0) return {}
    if (typeof au[0] === 'object') {
      return au.reduce((acc, x) => {
        if (x.daily_limit != null) acc[x.user_id] = String(x.daily_limit)
        return acc
      }, {})
    }
    return {}
  }

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SECTION,
    ...(section || {}),
    allowed_users: extractAllowedUsers(section?.allowed_users),
    quick_inputs: section?.quick_inputs ? [...section.quick_inputs] : [],
  }))
  const [sectionLimits, setSectionLimits] = useState(() => extractSectionLimits(section?.allowed_users))
  const [saving, setSaving] = useState(false)
  const [quickInputDraft, setQuickInputDraft] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [restoringVid, setRestoringVid] = useState(null)
  const [confirmRestoreVid, setConfirmRestoreVid] = useState(null)

  async function loadVersions() {
    if (!section?.id) return
    setLoadingVersions(true)
    try {
      const data = await getSectionVersions(section.id)
      setVersions(data)
    } catch { /* ignore */ } finally {
      setLoadingVersions(false)
    }
  }

  async function handleRestore(vid) {
    setRestoringVid(vid)
    try {
      const updated = await restoreSectionVersion(section.id, vid)
      set('prompt', updated.prompt)
      if (updated.model) set('model', updated.model)
      toast('Versión restaurada correctamente', 'success')
      setShowVersions(false)
    } catch (err) {
      toast(err.message || 'Error al restaurar', 'error')
    } finally {
      setRestoringVid(null)
      setConfirmRestoreVid(null)
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addQuickInput() {
    const val = quickInputDraft.trim()
    if (!val) return
    if (val.length > 100) { toast('Máximo 100 caracteres por plantilla', 'error'); return }
    if (form.quick_inputs.length >= 10) { toast('Máximo 10 plantillas rápidas', 'error'); return }
    setForm((f) => ({ ...f, quick_inputs: [...f.quick_inputs, val] }))
    setQuickInputDraft('')
  }

  function removeQuickInput(idx) {
    setForm((f) => ({ ...f, quick_inputs: f.quick_inputs.filter((_, i) => i !== idx) }))
  }

  function toggleUser(uid) {
    setForm((f) => {
      const ids = f.allowed_users.includes(uid)
        ? f.allowed_users.filter((x) => x !== uid)
        : [...f.allowed_users, uid]
      return { ...f, allowed_users: ids }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast('El nombre es obligatorio', 'error'); return }
    setSaving(true)
    const payload = {
      ...form,
      allowed_users: form.allowed_users.map(uid => ({
        user_id: uid,
        daily_limit: sectionLimits[uid] ? parseInt(sectionLimits[uid]) : null,
      })),
    }
    try {
      if (section?.id) {
        await updateAdminSection(section.id, payload)
        toast('Sección actualizada', 'success')
      } else {
        await createAdminSection(payload)
        toast('Sección creada', 'success')
      }
      onSave()
    } catch (err) {
      toast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-fore font-semibold">
            {section?.id ? 'Editar sección' : 'Nueva sección'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fore transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Name + Icon row */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">Icono</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
                maxLength={4}
                className="w-16 bg-surface2 border border-border rounded-lg px-2 py-2.5 text-fore text-center text-xl
                  outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">Nombre <span className="text-danger">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nombre de la sección"
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">
              Descripción <span className="text-muted/50 font-normal">(visible para el usuario)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={200}
              placeholder="Ej: Analiza pólizas y extrae coberturas, exclusiones y franquicias"
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Quick inputs */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted font-medium">
              Plantillas rápidas
              <span className="text-muted/60 ml-1 font-normal">(máx. 10, 100 chars cada una)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickInputDraft}
                onChange={(e) => setQuickInputDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuickInput() } }}
                maxLength={100}
                placeholder="Ej: Siniestro de hogar"
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={addQuickInput}
                disabled={form.quick_inputs.length >= 10}
                className="px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg
                  transition-colors disabled:opacity-40 shrink-0"
              >
                Añadir
              </button>
            </div>
            {form.quick_inputs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.quick_inputs.map((qi, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 text-xs bg-surface2 border border-border
                      text-fore px-2.5 py-1 rounded-full"
                  >
                    {qi}
                    <button
                      type="button"
                      onClick={() => removeQuickInput(idx)}
                      className="text-muted hover:text-danger transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Input type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Tipo de entrada</label>
            <div className="flex gap-3">
              {INPUT_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="input_type"
                    value={opt.value}
                    checked={form.input_type === opt.value}
                    onChange={() => set('input_type', opt.value)}
                    className="accent-accent"
                  />
                  <span className="text-fore text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Model + Temperature row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">Modelo</label>
              <select
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              >
                <optgroup label="OpenAI (requiere API key de pago)">
                  <option value="gpt-4o">GPT-4o — mejor calidad</option>
                  <option value="gpt-4o-mini">GPT-4o Mini — rápido y económico</option>
                  <option value="o3-mini">o3-mini — razonamiento</option>
                  <option value="o1-mini">o1-mini — análisis complejos</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo — más económico</option>
                </optgroup>
                <optgroup label="Google Gemini (capa gratuita disponible)">
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash — recomendado gratis</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro — alta calidad</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash — rápido</option>
                </optgroup>
                <optgroup label="Sin API — uso manual">
                  <option value="chatgpt-manual">ChatGPT Manual — genera prompt para copiar</option>
                </optgroup>
              </select>
              {form.model === 'chatgpt-manual' && (
                <p className="text-yellow-400/70 text-xs mt-1">
                  El usuario verá el prompt compilado listo para pegar en chat.openai.com — sin coste de API.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">
                Temperatura: <span className="text-fore">{form.temperature}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => set('temperature', parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => set('temperature', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-fore text-sm
                    outline-none focus:border-accent transition-colors text-center"
                />
              </div>
            </div>
          </div>

          {/* Max tokens + Sort order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">Max tokens</label>
              <input
                type="number"
                min="1"
                max="128000"
                value={form.max_tokens}
                onChange={(e) => set('max_tokens', parseInt(e.target.value) || 1)}
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">Orden</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)}
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted font-medium">Prompt del sistema</label>
              <div className="flex items-center gap-3">
                {form.prompt && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    <Eye size={12} /> Vista previa
                  </button>
                )}
                {section?.id && (
                  <button
                    type="button"
                    onClick={() => { setShowVersions(true); loadVersions() }}
                    className="flex items-center gap-1 text-xs text-muted hover:text-fore transition-colors"
                  >
                    <History size={12} /> Versiones
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={form.prompt}
              onChange={(e) => set('prompt', e.target.value)}
              rows={8}
              placeholder="Escribe el prompt del sistema aquí..."
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                outline-none focus:border-accent transition-colors resize-y font-mono"
            />
            <div className="bg-surface2 border border-border/50 rounded-lg px-3 py-2.5 text-xs text-muted">
              <p className="font-medium text-fore mb-1">Variables disponibles:</p>
              <p><code className="text-accent">{'{{text}}'}</code> — Texto introducido por el usuario</p>
              <p><code className="text-accent">{'{{filename}}'}</code> — Nombre del archivo adjunto</p>
              <p><code className="text-accent">{'{{file_content}}'}</code> — Contenido del archivo (si aplica)</p>
              <p><code className="text-accent">{'{{user_name}}'}</code> — Nombre del usuario</p>
              <p><code className="text-accent">{'{{department}}'}</code> — Departamento del usuario</p>
            </div>
          </div>

          {/* User permissions */}
          {users.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">
                Permisos de usuario
                <span className="text-muted/60 ml-1 font-normal">(vacío = todos)</span>
              </label>
              <div className="bg-surface2 border border-border rounded-lg p-3 max-h-40 overflow-y-auto flex flex-col gap-1.5">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5 hover:bg-surface/50 px-1 py-0.5 rounded">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={form.allowed_users.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="accent-accent shrink-0"
                      />
                      <span className="text-fore text-sm">{u.display_name}</span>
                      <span className="text-muted text-xs">@{u.username}</span>
                      {u.department && (
                        <span className="text-muted/60 text-xs">{u.department}</span>
                      )}
                    </label>
                    {form.allowed_users.includes(u.id) && (
                      <input
                        type="number"
                        min="1"
                        placeholder="∞"
                        title="Límite diario para esta sección"
                        value={sectionLimits[u.id] || ''}
                        onChange={e => setSectionLimits(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-16 bg-surface border border-border rounded px-2 py-1 text-xs text-fore outline-none focus:border-accent ml-auto shrink-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-fore transition-colors text-sm px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white
                font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Spinner size={15} /> : <Save size={15} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Versions modal */}
      {showVersions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <p className="text-fore font-semibold">Historial de versiones del prompt</p>
                <p className="text-muted text-xs mt-0.5">Versiones anteriores guardadas antes de cada edición</p>
              </div>
              <button onClick={() => setShowVersions(false)} className="text-muted hover:text-fore">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingVersions ? (
                <div className="text-center py-10 text-muted text-sm">Cargando versiones...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-muted text-sm">
                  <History size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Aún no hay versiones guardadas.</p>
                  <p className="text-xs mt-1">Se guardan automáticamente al editar el prompt.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {versions.map(v => (
                    <div key={v.id} className="bg-surface2 border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-fore text-sm font-medium">
                            {v.created_at ? new Date(v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                          {v.model && <span className="text-muted text-xs ml-2">· {v.model}</span>}
                        </div>
                        <button
                          onClick={() => setConfirmRestoreVid(v.id)}
                          disabled={restoringVid === v.id}
                          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={11} />
                          {restoringVid === v.id ? 'Restaurando...' : 'Restaurar'}
                        </button>
                      </div>
                      <pre className="text-muted text-xs font-mono whitespace-pre-wrap bg-surface rounded p-3 border border-border/50 max-h-32 overflow-y-auto leading-relaxed">
                        {v.prompt}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border shrink-0 flex justify-end">
              <button onClick={() => setShowVersions(false)}
                className="text-sm text-muted hover:text-fore transition-colors px-4 py-2">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm restore version */}
      {confirmRestoreVid && (
        <ConfirmDialog
          title="Restaurar versión"
          message="¿Restaurar esta versión del prompt? El estado actual se guardará automáticamente como nueva versión antes de restaurar."
          confirmLabel="Restaurar"
          danger={false}
          loading={restoringVid === confirmRestoreVid}
          onConfirm={() => handleRestore(confirmRestoreVid)}
          onCancel={() => setConfirmRestoreVid(null)}
        />
      )}

      {/* Prompt preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <p className="text-fore font-semibold">Vista previa del prompt</p>
                <p className="text-muted text-xs mt-0.5">Variables rellenas con datos de ejemplo</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-muted hover:text-fore">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <pre className="text-fore text-xs font-mono whitespace-pre-wrap bg-surface2 rounded-lg p-4 border border-border leading-relaxed">
                {form.prompt
                  .replace(/\{\{text\}\}/g, '[Consulta del usuario de ejemplo]')
                  .replace(/\{\{filename\}\}/g, 'documento_ejemplo.pdf')
                  .replace(/\{\{file_content\}\}/g, '[Contenido del archivo adjunto...]')
                  .replace(/\{\{user_name\}\}/g, 'Agente Ejemplo')
                  .replace(/\{\{department\}\}/g, 'Comercial')
                }
              </pre>
            </div>
            <div className="px-5 py-3 border-t border-border shrink-0 flex justify-between items-center">
              <span className="text-muted text-xs">{form.prompt.length} caracteres</span>
              <button onClick={() => setShowPreview(false)}
                className="text-sm text-muted hover:text-fore transition-colors px-4 py-2">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionsInner() {
  const { toast } = useToast()
  const [sections, setSections] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalSection, setModalSection] = useState(undefined) // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [confirmDeleteSection, setConfirmDeleteSection] = useState(null) // section obj

  async function load() {
    try {
      const [s, u] = await Promise.all([getAdminSections(), getAdminUsers()])
      setSections(s)
      setUsers(u)
    } catch (err) {
      toast(err.message || 'Error al cargar secciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await deleteAdminSection(id)
      toast('Sección eliminada', 'success')
      await load()
    } catch (err) {
      toast(err.message || 'Error al eliminar', 'error')
    } finally {
      setDeleting(null)
      setConfirmDeleteSection(null)
    }
  }

  async function handleDuplicate(id) {
    setDuplicating(id)
    try {
      await duplicateAdminSection(id)
      toast('Sección duplicada', 'success')
      await load()
    } catch (err) {
      toast(err.message || 'Error al duplicar', 'error')
    } finally {
      setDuplicating(null)
    }
  }

  async function handleMove(index, direction) {
    const newSections = [...sections]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    const order = newSections.map((s, i) => ({ id: s.id, sort_order: i }))
    setSections(newSections)
    try {
      await reorderAdminSections(order)
    } catch (err) {
      toast(err.message || 'Error al reordenar', 'error')
      await load()
    }
  }

  const INPUT_TYPE_LABELS = { text: 'Texto', file: 'Archivo', both: 'Ambos' }
  const INPUT_TYPE_COLORS = {
    text: 'text-accent bg-accent/10',
    file: 'text-success bg-success/10',
    both: 'text-fore bg-surface2',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-fore text-2xl font-semibold">Secciones</h1>
          <p className="text-muted text-sm mt-1">{sections.length} secciones configuradas</p>
        </div>
        <button
          onClick={() => setModalSection(null)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white
            font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Nueva sección
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Cargando secciones..." />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">No hay secciones. Crea la primera.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="bg-surface border border-border rounded-[10px] px-5 py-4
                flex items-center gap-4 hover:border-border/80 transition-colors"
            >
              {/* Order controls */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted hover:text-fore disabled:opacity-20 transition-colors"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === sections.length - 1}
                  className="text-muted hover:text-fore disabled:opacity-20 transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Icon */}
              <span className="text-2xl w-8 text-center shrink-0">{sec.icon || '🔧'}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-fore font-medium">{sec.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INPUT_TYPE_COLORS[sec.input_type] || 'text-muted bg-surface2'}`}>
                    {INPUT_TYPE_LABELS[sec.input_type] || sec.input_type}
                  </span>
                </div>
                {sec.description && (
                  <p className="text-muted/60 text-xs truncate mb-1">{sec.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROVIDER_BADGE[modelProvider(sec.model)]}`}>
                    {PROVIDER_LABEL[modelProvider(sec.model)]}
                  </span>
                  <span className="text-muted text-xs bg-surface2 px-2 py-0.5 rounded">
                    {sec.model}
                  </span>
                  {sec.model !== 'chatgpt-manual' && (
                    <>
                      <span className="text-muted text-xs">temp: {sec.temperature}</span>
                      <span className="text-muted text-xs">max: {sec.max_tokens?.toLocaleString()}</span>
                    </>
                  )}
                  {sec.allowed_users?.length > 0 && (
                    <span className="text-muted text-xs">
                      {sec.allowed_users.length} usuario{sec.allowed_users.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModalSection(sec)}
                  className="p-2 text-muted hover:text-fore hover:bg-surface2 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDuplicate(sec.id)}
                  disabled={duplicating === sec.id}
                  className="p-2 text-muted hover:text-fore hover:bg-surface2 rounded-lg transition-colors disabled:opacity-40"
                  title="Duplicar"
                >
                  {duplicating === sec.id ? <Spinner size={15} /> : <Copy size={15} />}
                </button>
                <button
                  onClick={() => setConfirmDeleteSection(sec)}
                  disabled={deleting === sec.id}
                  className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-40"
                  title="Eliminar"
                >
                  {deleting === sec.id ? <Spinner size={15} /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalSection !== undefined && (
        <SectionModal
          section={modalSection}
          users={users}
          onClose={() => setModalSection(undefined)}
          onSave={async () => {
            setModalSection(undefined)
            await load()
          }}
        />
      )}

      {confirmDeleteSection && (
        <ConfirmDialog
          title="Eliminar sección"
          message={`¿Eliminar la sección "${confirmDeleteSection.name}"? Esta acción no se puede deshacer y se perderá todo su historial de consultas.`}
          confirmLabel="Eliminar sección"
          loading={deleting === confirmDeleteSection.id}
          onConfirm={() => handleDelete(confirmDeleteSection.id)}
          onCancel={() => setConfirmDeleteSection(null)}
        />
      )}
    </div>
  )
}

export default function Sections() {
  return (
    <ToastProvider>
      <SectionsInner />
    </ToastProvider>
  )
}
