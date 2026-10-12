import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { validateImageFile } from '../../utils/images'

const MAX_GALLERY_FILES = 10 // POST /product accepts up to 10 gallery images

// Create only: the chosen gallery files are kept here (with their previews) and sent with «حفظ».
// onChange(files) gives the parent the plain list of files
function ProductGalleryPicker({ onChange }) {
  const [items, setItems] = useState([]) // [{ file, previewUrl }]
  const [error, setError] = useState('')

  function handleChange(event) {
    const pickedFiles = [...event.target.files]
    event.target.value = '' // so picking the same file again still fires onChange
    if (pickedFiles.length === 0) return

    // Invalid files are skipped; the valid ones are still added
    const validFiles = pickedFiles.filter((file) => !validateImageFile(file))
    const invalidFile = pickedFiles.find((file) => validateImageFile(file))
    let newError = invalidFile ? validateImageFile(invalidFile) : ''

    const freeSlots = MAX_GALLERY_FILES - items.length
    if (validFiles.length > freeSlots) newError = `يمكن اختيار ${MAX_GALLERY_FILES} صور كحد أقصى`

    const newItems = validFiles
      .slice(0, freeSlots)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    const allItems = [...items, ...newItems]

    setError(newError)
    setItems(allItems)
    onChange(allItems.map((item) => item.file))
  }

  function handleRemove(previewUrl) {
    const remainingItems = items.filter((item) => item.previewUrl !== previewUrl)
    setError('')
    setItems(remainingItems)
    onChange(remainingItems.map((item) => item.file))
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-text">صور المعرض</span>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div
            key={item.previewUrl}
            className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
          >
            {/* Once the preview is shown the temporary URL isn't needed — free it from memory */}
            <img
              src={item.previewUrl}
              alt=""
              onLoad={() => URL.revokeObjectURL(item.previewUrl)}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(item.previewUrl)}
              aria-label="إزالة الصورة"
              title="إزالة الصورة"
              className="absolute top-1 end-1 rounded-full border border-border bg-surface p-0.5 text-error transition-colors duration-150 hover:bg-error hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {items.length < MAX_GALLERY_FILES && (
          // The real file input is hidden; this label, styled as a tile, opens it
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-text-secondary transition-colors duration-150 hover:bg-background focus-within:ring-2 focus-within:ring-primary/20">
            <ImagePlus size={20} />
            إضافة صور
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              aria-label="إضافة صور للمعرض"
              onChange={handleChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : (
        <p className="text-xs text-text-muted">
          اختياري، حتى {MAX_GALLERY_FILES} صور — JPG أو PNG أو WEBP، حتى 10 ميجابايت لكل صورة
        </p>
      )}
    </div>
  )
}

export default ProductGalleryPicker
