import { useEffect, useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'

// The backend accepts only these types (shared upload rules in admin.general.txt)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Validates BEFORE calling onChange — the backend's own size message is wrong, so we never rely on it
function ImageInput({ label, currentImageUrl, maxSizeMB = 10, onChange, error }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileError, setFileError] = useState('')

  // Frees the old preview from memory when a new file is picked or the input unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleChange(event) {
    const file = event.target.files[0]
    event.target.value = '' // so picking the same file again still fires onChange
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('نوع الصورة غير مدعوم، استخدم JPG أو PNG أو WEBP')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setFileError(`حجم الصورة أكبر من ${maxSizeMB} ميجابايت`)
      return
    }

    setFileError('')
    setPreviewUrl(URL.createObjectURL(file))
    onChange(file)
  }

  const shownImageUrl = previewUrl || currentImageUrl
  const shownError = fileError || error

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-text">{label}</span>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background text-text-muted">
          {shownImageUrl ? (
            <img src={shownImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={24} />
          )}
        </div>

        {/* The real file input is hidden; this label, styled as a button, opens it */}
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-background focus-within:ring-2 focus-within:ring-primary/20">
          <Upload size={18} />
          {shownImageUrl ? 'تغيير الصورة' : 'اختيار صورة'}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            aria-label={label}
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      </div>

      {shownError ? (
        <p className="text-xs text-error">{shownError}</p>
      ) : (
        <p className="text-xs text-text-muted">JPG أو PNG أو WEBP، حتى {maxSizeMB} ميجابايت</p>
      )}
    </div>
  )
}

export default ImageInput
