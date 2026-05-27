import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'

export default function FileZone({ onFiles, initialFiles = [], accept = '*', className = '' }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState(initialFiles)

  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles)
    }
  }, [initialFiles])

  function addFiles(newFiles) {
    if (!newFiles || newFiles.length === 0) return
    setFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name))
      const unique = Array.from(newFiles).filter(f => !existingNames.has(f.name))
      const combined = [...prev, ...unique]
      onFiles(combined)
      return combined
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  function handleChange(e) {
    addFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove(e, index) {
    e.stopPropagation()
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      onFiles(next)
      return next
    })
  }

  return (
    <div
      className={`
        relative border-2 border-dashed border-border rounded-[10px]
        p-4 flex flex-col gap-2
        cursor-pointer transition-all duration-150
        hover:border-accent hover:bg-accent/5
        ${dragging ? 'file-zone-active' : ''}
        ${files.length > 0 ? 'border-accent/60 bg-accent/5' : ''}
        ${className}
      `}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {files.length > 0 ? (
        <div className="flex flex-col gap-2 w-full">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 w-full">
              <FileText size={16} className="text-accent shrink-0" />
              <span className="text-fore text-sm truncate flex-1">{file.name}</span>
              <span className="text-muted text-xs shrink-0">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={(e) => handleRemove(e, index)}
                className="text-muted hover:text-danger transition-colors shrink-0"
                title="Eliminar archivo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-border/40 mt-1">
            <Upload size={14} className="text-muted" />
            <span className="text-xs text-muted">Añadir más archivos</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <Upload size={24} className="text-muted" />
          <p className="text-sm text-muted text-center">
            <span className="text-accent font-medium">Haz clic para seleccionar</span>
            {' '}o arrastra archivos aquí
          </p>
          {accept !== '*' && (
            <p className="text-xs text-muted/60">{accept}</p>
          )}
        </div>
      )}
    </div>
  )
}
