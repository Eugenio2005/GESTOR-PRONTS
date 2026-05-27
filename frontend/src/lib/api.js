const BASE = ''

async function apiFetch(url, options = {}) {
  const res = await fetch(BASE + url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      message = data.detail || data.message || data.error || message
    } catch {
      // ignore parse error
    }
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res
}

// ─── Auth ─────────────────────────────────────────────────────
export function getMe() {
  return apiFetch('/api/me')
}

export function login(username, password) {
  return apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return apiFetch('/api/logout', { method: 'POST' })
}

// ─── Sections ─────────────────────────────────────────────────
export function getSections() {
  return apiFetch('/api/sections')
}

// ─── Process ──────────────────────────────────────────────────
export function processSection(sectionId, formData) {
  return apiFetch(`/api/process/${sectionId}`, {
    method: 'POST',
    body: formData,
  })
}

export function streamSection(sectionId, formData, signal) {
  return fetch(`/api/process/${sectionId}/stream`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    signal,
  })
}

export function exportQueryPdf(queryId) {
  return apiFetch(`/api/historial/${queryId}/pdf`)
}

export function exportQueryDocx(queryId) {
  return apiFetch(`/api/historial/${queryId}/docx`)
}

// ─── Historial ────────────────────────────────────────────────
export function getHistorial(page = 1, q = '', filters = {}) {
  const params = new URLSearchParams({ page })
  if (q) params.set('q', q)
  if (filters.section_id) params.set('section_id', filters.section_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.status) params.set('status', filters.status)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.favorites) params.set('favorites', 'true')
  return apiFetch(`/api/historial?${params}`)
}

export function updateHistorialTags(id, tags) {
  return apiFetch(`/api/historial/${id}/tags`, {
    method: 'PATCH',
    body: JSON.stringify({ tags }),
  })
}

export function retryHistorialQuery(id) {
  return apiFetch(`/api/historial/${id}/retry`, { method: 'POST' })
}

export function getHistorialItem(id) {
  return apiFetch(`/api/historial/${id}`)
}

export function getHistorialFile(id, filename) {
  return apiFetch(`/api/historial/${id}/archivo/${encodeURIComponent(filename)}`)
}

// ─── Admin Auth ───────────────────────────────────────────────
export function getAdminMe() {
  return apiFetch('/api/admin/me')
}

export function adminLogin(password) {
  return apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function adminLogout() {
  return apiFetch('/api/admin/logout', { method: 'POST' })
}

// ─── Admin Stats ──────────────────────────────────────────────
export function getAdminStats() {
  return apiFetch('/api/admin/stats')
}

export function getAdminApiStatus() {
  return apiFetch('/api/admin/api-status')
}

export function getAdminMetrics() {
  return apiFetch('/api/admin/metrics')
}

// ─── Admin Sections ───────────────────────────────────────────
export function getAdminSections() {
  return apiFetch('/api/admin/sections')
}

export function getAdminSection(id) {
  return apiFetch(`/api/admin/sections/${id}`)
}

export function createAdminSection(data) {
  return apiFetch('/api/admin/sections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAdminSection(id, data) {
  return apiFetch(`/api/admin/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteAdminSection(id) {
  return apiFetch(`/api/admin/sections/${id}`, { method: 'DELETE' })
}

export function duplicateAdminSection(id) {
  return apiFetch(`/api/admin/sections/${id}/duplicate`, { method: 'POST' })
}

export function reorderAdminSections(order) {
  return apiFetch('/api/admin/sections/reorder', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

// ─── Admin Users ──────────────────────────────────────────────
export function getAdminUsers(qs = '') {
  return apiFetch(`/api/admin/users${qs}`)
}

export function createAdminUser(data) {
  return apiFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAdminUser(id, data) {
  return apiFetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function toggleAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}/toggle`, { method: 'POST' })
}

export function deleteAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export function compareModels(sectionId, formData) {
  return apiFetch(`/api/compare/${sectionId}`, {
    method: 'POST',
    body: formData,
  })
}

// ─── Admin Queries ────────────────────────────────────────────
export function getAdminQueryDetail(id) {
  return apiFetch(`/api/admin/queries/${id}`)
}

export function getAdminQueries({ page = 1, section_id = '', user_id = '', status = '', q = '' } = {}) {
  const params = new URLSearchParams({ page })
  if (section_id) params.set('section_id', section_id)
  if (user_id) params.set('user_id', user_id)
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  return apiFetch(`/api/admin/queries?${params.toString()}`)
}

// ─── Admin Logs ───────────────────────────────────────────────
export function getAdminLogs(page = 1) {
  return apiFetch(`/api/admin/logs?page=${page}`)
}

export function clearAdminLogs() {
  return apiFetch('/api/admin/logs', { method: 'DELETE' })
}

export function exportAdminLogs() {
  return apiFetch('/api/admin/logs/export')
}

// ─── User limits ──────────────────────────────────────────────
export function getMyLimits() {
  return apiFetch('/api/me/limits')
}

// ─── Admin Audit ──────────────────────────────────────────────
export function getAdminAudit(page = 1) {
  return apiFetch(`/api/admin/audit?page=${page}`)
}

// ─── Admin Cleanup ────────────────────────────────────────────
export function getCleanupPreview(days = 30) {
  return apiFetch(`/api/admin/cleanup/preview?days=${days}`)
}

export function runCleanup(days, excludeIds = []) {
  return apiFetch('/api/admin/cleanup/run', {
    method: 'POST',
    body: JSON.stringify({ days, exclude_ids: excludeIds }),
  })
}

export function toggleQueryProtection(id) {
  return apiFetch(`/api/admin/queries/${id}/protect`, { method: 'PATCH' })
}

// ─── Historial export ─────────────────────────────────────────
export function exportMyHistorial() {
  return apiFetch('/api/historial/export?format=csv')
}

export function exportMyHistorialPdf() {
  return apiFetch('/api/historial/export?format=pdf')
}

// ─── Favorites ────────────────────────────────────────────────
export function toggleFavorite(id) {
  return apiFetch(`/api/historial/${id}/favorite`, { method: 'PATCH' })
}

// ─── App config ───────────────────────────────────────────────
export function getAppConfig() {
  return apiFetch('/api/config')
}

// ─── Admin queries export ─────────────────────────────────────
export function exportAdminQueries(format = 'csv', filters = {}) {
  const params = new URLSearchParams({ format })
  if (filters.section_id) params.set('section_id', filters.section_id)
  if (filters.user_id) params.set('user_id', filters.user_id)
  if (filters.status) params.set('status', filters.status)
  return apiFetch(`/api/admin/queries/export?${params}`)
}

// ─── Soft-delete restore ──────────────────────────────────────
export function restoreAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}/restore`, { method: 'POST' })
}

export function restoreAdminSection(id) {
  return apiFetch(`/api/admin/sections/${id}/restore`, { method: 'POST' })
}

// ─── Section versions ─────────────────────────────────────────
export function getSectionVersions(id) {
  return apiFetch(`/api/admin/sections/${id}/versions`)
}

export function restoreSectionVersion(sid, vid) {
  return apiFetch(`/api/admin/sections/${sid}/versions/${vid}/restore`, { method: 'POST' })
}

// ─── Password reset ───────────────────────────────────────────
export function generateResetToken(uid) {
  return apiFetch(`/api/admin/users/${uid}/reset-token`, { method: 'POST' })
}

export function validateResetToken(token) {
  return apiFetch(`/api/reset-password/validate?token=${encodeURIComponent(token)}`)
}

export function resetPassword(token, password) {
  return apiFetch('/api/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

// ─── User section access ──────────────────────────────────────
export function setUserSections(uid, sections) {
  return apiFetch(`/api/admin/users/${uid}/sections`, {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  })
}

// ─── Admin Logs (with filters) ────────────────────────────────
export function getAdminLogsFiltered({ page = 1, user = '', section = '', status = '', date_from = '', date_to = '' } = {}) {
  const params = new URLSearchParams({ page })
  if (user) params.set('user', user)
  if (section) params.set('section', section)
  if (status) params.set('status', status)
  if (date_from) params.set('date_from', date_from)
  if (date_to) params.set('date_to', date_to)
  return apiFetch(`/api/admin/logs?${params}`)
}
