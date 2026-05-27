import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, UserCheck, UserX, X, Save, Eye, EyeOff, KeyRound, Copy, Check, Layers, RotateCcw } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import {
  getAdminUsers, createAdminUser, updateAdminUser,
  toggleAdminUser, deleteAdminUser, generateResetToken,
  getAdminSections, setUserSections, restoreAdminUser,
} from '../../lib/api'
import Spinner from '../../components/Spinner'
import { ToastProvider, useToast } from '../../components/Toast'

const DEFAULT_USER = {
  username: '',
  display_name: '',
  department: '',
  password: '',
  daily_limit: '',
  monthly_limit: '',
}

function UserModal({ user, onClose, onSave }) {
  const { toast } = useToast()
  const isEdit = Boolean(user?.id)
  const [form, setForm] = useState(() => ({
    ...DEFAULT_USER,
    ...(user
      ? {
          display_name: user.display_name,
          department: user.department || '',
          username: user.username,
          daily_limit: user.daily_limit ?? '',
          monthly_limit: user.monthly_limit ?? '',
        }
      : {}),
    password: '',
  }))
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isEdit && (!form.username.trim() || !form.password)) {
      toast('Usuario y contraseña son obligatorios', 'error')
      return
    }
    if (!form.display_name.trim()) {
      toast('El nombre es obligatorio', 'error')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        const payload = { display_name: form.display_name, department: form.department }
        if (form.password) payload.password = form.password
        payload.daily_limit = form.daily_limit !== '' ? parseInt(form.daily_limit) || null : null
        payload.monthly_limit = form.monthly_limit !== '' ? parseInt(form.monthly_limit) || null : null
        await updateAdminUser(user.id, payload)
        toast('Usuario actualizado', 'success')
      } else {
        await createAdminUser({
          username: form.username.trim(),
          display_name: form.display_name.trim(),
          department: form.department.trim(),
          password: form.password,
        })
        toast('Usuario creado', 'success')
      }
      onSave()
    } catch (err) {
      toast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-fore font-semibold">
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fore transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Username (only on create) */}
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted font-medium">
                Nombre de usuario <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="usuario.ejemplo"
                autoComplete="off"
                className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">
              Nombre completo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => set('display_name', e.target.value)}
              placeholder="Nombre Apellido"
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Departamento</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              placeholder="Ej: Siniestros, Comercial..."
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm
                outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Daily limit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Límite diario de consultas</label>
            <input
              type="number"
              min="0"
              value={form.daily_limit}
              onChange={(e) => set('daily_limit', e.target.value)}
              placeholder="Sin límite"
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-muted/70">Déjalo vacío para sin límite</p>
          </div>

          {/* Monthly limit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">Límite mensual de consultas</label>
            <input
              type="number"
              min="0"
              value={form.monthly_limit}
              onChange={(e) => set('monthly_limit', e.target.value)}
              placeholder="Sin límite"
              className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-fore text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted font-medium">
              {isEdit ? 'Nueva contraseña' : 'Contraseña *'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={isEdit ? 'Escribe una nueva contraseña...' : '••••••••'}
                autoComplete="new-password"
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 pr-10 text-fore text-sm
                  outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fore transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isEdit && (
              <p className="text-muted/70 text-xs">
                Las contraseñas se almacenan cifradas y no se pueden recuperar. Déjalo vacío para no cambiarla, o escribe una nueva.
              </p>
            )}
          </div>

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
    </div>
  )
}

function UserSectionsModal({ user, onClose }) {
  const { toast } = useToast()
  const [sections, setSections] = useState([])
  const [selected, setSelected] = useState(new Set(user.section_ids || []))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAdminSections()
      .then(setSections)
      .catch(() => toast('Error al cargar secciones', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function toggle(sid) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(sid) ? next.delete(sid) : next.add(sid)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await setUserSections(user.id, [...selected].map(sid => ({ section_id: sid, daily_limit: null })))
      toast('Permisos actualizados', 'success')
      onClose()
    } catch (err) {
      toast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isRestricted = selected.size > 0
  const allCount = sections.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-surface border border-border rounded-[10px] w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-fore font-semibold">Permisos de secciones</h2>
            <p className="text-muted text-xs mt-0.5">{user.display_name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fore transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <p className="text-muted text-xs mb-3">
            {isRestricted
              ? `Acceso a ${selected.size} de ${allCount} secciones`
              : `Sin restricciones — acceso a todas las secciones (${allCount})`}
          </p>
          {!isRestricted && (
            <p className="text-xs text-accent/80 mb-3">
              Selecciona secciones para restringir el acceso. Dejar todo vacío = acceso total.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={20} /></div>
        ) : (
          <div className="px-6 pb-4 max-h-64 overflow-y-auto flex flex-col gap-1.5">
            {sections.map(s => (
              <label
                key={s.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-surface2 px-2 py-1.5 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="accent-accent shrink-0"
                />
                <span className="text-xl shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-fore text-sm font-medium">{s.name}</p>
                  {s.description && <p className="text-muted text-xs truncate">{s.description}</p>}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="text-muted hover:text-fore transition-colors text-sm px-4 py-2">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Spinner size={15} /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersInner() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalUser, setModalUser] = useState(undefined) // undefined=closed, null=new, obj=edit
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [resetResult, setResetResult] = useState(null) // { token, username, expires_at }
  const [generatingReset, setGeneratingReset] = useState(null)
  const [copiedReset, setCopiedReset] = useState(false)
  const [sectionsUser, setSectionsUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showDeleted, setShowDeleted] = useState(false)

  async function load() {
    try {
      const params = showDeleted ? '?include_deleted=true' : ''
      const data = await getAdminUsers(params)
      setUsers(data)
    } catch (err) {
      toast(err.message || 'Error al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showDeleted])

  async function handleRestore(id) {
    try {
      await restoreAdminUser(id)
      toast('Usuario restaurado', 'success')
      await load()
    } catch (err) {
      toast(err.message || 'Error al restaurar', 'error')
    }
  }

  async function handleToggle(id) {
    setToggling(id)
    try {
      await toggleAdminUser(id)
      toast('Estado actualizado', 'success')
      await load()
    } catch (err) {
      toast(err.message || 'Error al cambiar estado', 'error')
    } finally {
      setToggling(null)
    }
  }

  async function handleGenerateReset(uid) {
    setGeneratingReset(uid)
    try {
      const data = await generateResetToken(uid)
      setResetResult(data)
    } catch (err) {
      toast(err.message || 'Error al generar enlace', 'error')
    } finally {
      setGeneratingReset(null)
    }
  }

  function copyResetLink() {
    if (!resetResult) return
    const url = `${window.location.origin}/reset-password?token=${resetResult.token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedReset(true)
      setTimeout(() => setCopiedReset(false), 2000)
    })
  }

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await deleteAdminUser(id)
      toast('Usuario eliminado', 'success')
      await load()
    } catch (err) {
      toast(err.message || 'Error al eliminar', 'error')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-fore text-2xl font-semibold">Usuarios</h1>
          <p className="text-muted text-sm mt-1">{users.filter(u => !u.deleted_at).length} activos{showDeleted && users.some(u => u.deleted_at) ? ` · ${users.filter(u => u.deleted_at).length} eliminados` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleted(v => !v)}
            className={`flex items-center gap-2 border text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${showDeleted ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-surface border-border text-muted hover:border-accent hover:text-fore'}`}
          >
            <Trash2 size={15} />
            {showDeleted ? 'Ocultar eliminados' : 'Ver eliminados'}
          </button>
          <button
            onClick={() => setModalUser(null)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white
              font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Cargando usuarios..." />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">No hay usuarios. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface2/50">
                <th className="px-5 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Usuario</th>
                <th className="px-5 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Departamento</th>
                <th className="px-5 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Consultas</th>
                <th className="px-5 py-3.5 text-left text-muted text-xs uppercase tracking-wider font-medium">Límites</th>
                <th className="px-5 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Estado</th>
                <th className="px-5 py-3.5 text-center text-muted text-xs uppercase tracking-wider font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-border/50 hover:bg-surface2/30 transition-colors ${u.deleted_at ? 'opacity-50' : ''}`}
                >
                  {/* User info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                        ${u.is_active ? 'bg-accent/20 text-accent' : 'bg-muted/10 text-muted'}`}>
                        {u.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className={`font-medium ${u.is_active ? 'text-fore' : 'text-muted'}`}>
                          {u.display_name}
                        </p>
                        <p className="text-muted text-xs">@{u.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 text-muted text-sm">
                    <div>{u.department || '—'}</div>
                    {u.section_ids?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Layers size={11} className="text-accent/70" />
                        <span className="text-xs text-accent/70">{u.section_ids.length} secc.</span>
                      </div>
                    )}
                  </td>

                  {/* Query count */}
                  <td className="px-5 py-4 text-center">
                    <span className="text-fore text-sm">{u.query_count?.toLocaleString() ?? 0}</span>
                  </td>

                  {/* Limits */}
                  <td className="px-5 py-4 text-muted text-xs">
                    {u.daily_limit ? `${u.daily_limit}/día` : ''}
                    {u.daily_limit && u.monthly_limit ? ' · ' : ''}
                    {u.monthly_limit ? `${u.monthly_limit}/mes` : ''}
                    {!u.daily_limit && !u.monthly_limit ? <span className="text-muted/50">Sin límite</span> : ''}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    {u.is_active ? (
                      <span className="text-success text-xs bg-success/10 px-2.5 py-1 rounded-full">
                        Activo
                      </span>
                    ) : (
                      <span className="text-muted text-xs bg-surface2 px-2.5 py-1 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {u.deleted_at ? (
                        <button
                          onClick={() => handleRestore(u.id)}
                          className="flex items-center gap-1.5 text-xs text-success hover:text-success bg-success/10 hover:bg-success/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="Restaurar usuario"
                        >
                          <RotateCcw size={13} /> Restaurar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setModalUser(u)}
                            className="p-2 text-muted hover:text-fore hover:bg-surface2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(u.id)}
                            disabled={toggling === u.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40
                              ${u.is_active
                                ? 'text-muted hover:text-danger hover:bg-danger/10'
                                : 'text-muted hover:text-success hover:bg-success/10'
                              }`}
                            title={u.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {toggling === u.id ? <Spinner size={14} /> : u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => setSectionsUser(u)}
                            className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Gestionar secciones"
                          >
                            <Layers size={14} />
                          </button>
                          <button
                            onClick={() => handleGenerateReset(u.id)}
                            disabled={generatingReset === u.id}
                            className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-40"
                            title="Generar enlace de reset"
                          >
                            {generatingReset === u.id ? <Spinner size={14} /> : <KeyRound size={14} />}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={deleting === u.id}
                            className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-40"
                            title="Eliminar (papelera)"
                          >
                            {deleting === u.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={async () => {
            setModalUser(undefined)
            await load()
          }}
        />
      )}

      {/* Confirm delete user */}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Mover a "${confirmDelete.display_name}" a la papelera? El usuario no podrá acceder y su historial se conserva. Puedes restaurarlo después.`}
          confirmLabel="Eliminar usuario"
          loading={deleting === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Section access modal */}
      {sectionsUser && (
        <UserSectionsModal
          user={sectionsUser}
          onClose={async () => {
            setSectionsUser(null)
            await load()
          }}
        />
      )}

      {/* Reset token result modal */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-fore font-semibold">Enlace de reset generado</p>
              <button onClick={() => setResetResult(null)} className="text-muted hover:text-fore">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-muted text-sm mb-1">
                Usuario: <strong className="text-fore">{resetResult.username}</strong>
              </p>
              <p className="text-muted text-xs mb-4">
                Válido hasta: {new Date(resetResult.expires_at).toLocaleString('es-ES')}
              </p>
              <div className="bg-surface2 border border-border rounded-lg px-3 py-2.5 text-xs font-mono text-fore break-all mb-4">
                {`${window.location.origin}/reset-password?token=${resetResult.token}`}
              </div>
              <p className="text-muted text-xs mb-4">
                Comparte este enlace con el usuario. Expira en 24 horas y solo se puede usar una vez.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={copyResetLink}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1 justify-center"
                >
                  {copiedReset ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar enlace</>}
                </button>
                <button
                  onClick={() => setResetResult(null)}
                  className="px-4 py-2 text-sm text-muted hover:text-fore transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Users() {
  return (
    <ToastProvider>
      <UsersInner />
    </ToastProvider>
  )
}
