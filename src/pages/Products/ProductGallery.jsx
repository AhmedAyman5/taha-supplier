import { useState } from 'react'
import toast from 'react-hot-toast'
import { ImagePlus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl, validateImageFile } from '../../utils/images'
import { addProductImages, deleteProductImage, getProduct } from './products.api'

const MAX_FILES_PER_UPLOAD = 10 // POST /product/:id/images accepts up to 10 files per request

// Edit only: gallery changes go to the backend IMMEDIATELY (they have their own endpoints),
// not with the form's «حفظ»
function ProductGallery({ productId, initialImages }) {
  const [images, setImages] = useState(initialImages) // [{ id, image_url, ... }] from GET /product/admin/:id
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImage, setDeletingImage] = useState(null) // the image waiting for delete confirmation
  const [isDeleting, setIsDeleting] = useState(false)

  // addProductImages returns no image ids, so the gallery is always reloaded from the admin endpoint
  async function reloadImages() {
    try {
      const product = await getProduct(productId)
      setImages(product.images)
    } catch {
      toast.error('تعذر تحديث صور المعرض، أعد تحميل الصفحة')
    }
  }

  async function handleAdd(event) {
    const files = [...event.target.files]
    event.target.value = '' // so picking the same file again still fires onChange
    if (files.length === 0) return

    const invalidFile = files.find((file) => validateImageFile(file))
    if (invalidFile) {
      setError(validateImageFile(invalidFile))
      return
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      setError(`يمكن إضافة ${MAX_FILES_PER_UPLOAD} صور كحد أقصى في كل مرة`)
      return
    }

    setError('')
    setIsUploading(true)
    try {
      await addProductImages(productId, files)
      toast.success('تمت إضافة الصور')
      await reloadImages()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteProductImage(productId, deletingImage.id)
      toast.success('تم حذف الصورة')
      setDeletingImage(null)
      await reloadImages()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-text">صور المعرض</span>
      <p className="text-xs text-warning">التغييرات على صور المعرض تُحفظ فوراً</p>

      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
          >
            <img src={getImageUrl(image.image_url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setDeletingImage(image)}
              disabled={isUploading}
              aria-label="حذف الصورة"
              title="حذف الصورة"
              className="absolute top-1 end-1 rounded-full border border-border bg-surface p-1 text-error transition-colors duration-150 hover:bg-error hover:text-white disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* The real file input is hidden; this label, styled as a tile, opens it */}
        <label
          className={`flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-center text-xs text-text-secondary transition-colors duration-150 focus-within:ring-2 focus-within:ring-primary/20 ${
            isUploading ? 'opacity-50' : 'cursor-pointer hover:bg-background'
          }`}
        >
          <ImagePlus size={20} />
          {isUploading ? 'جاري الرفع...' : 'إضافة صور'}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            disabled={isUploading}
            aria-label="إضافة صور للمعرض"
            onChange={handleAdd}
            className="sr-only"
          />
        </label>
      </div>

      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : (
        <p className="text-xs text-text-muted">
          {images.length === 0 && 'لا توجد صور في المعرض. '}
          حتى {MAX_FILES_PER_UPLOAD} صور في كل مرة — JPG أو PNG أو WEBP، حتى 10 ميجابايت لكل صورة
        </p>
      )}

      {deletingImage && (
        <ConfirmDialog
          title="حذف الصورة"
          message="سيتم حذف الصورة نهائياً."
          confirmLabel="حذف"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingImage(null)}
        />
      )}
    </div>
  )
}

export default ProductGallery
