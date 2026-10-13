import { useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Replace, Undo2, X } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getImageUrl, validateImageFile } from '../../utils/images'
import { EMPTY_FILTER } from './banners.api'
import ClickActionEditor from './ClickActionEditor'

const MAX_IMAGES = 10 // a banner holds 1–10 images

const iconButtonClass =
  'rounded-md p-1.5 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

// Rows: new file → { key, file, previewUrl, action } · existing image → { key, image_id, image_url, action }.
// The row order IS the display order in the app (sort_order = position).
// Create, or "replace all" on edit → the newImages rows. Otherwise → the banner's existingImages rows
// (reorder + actions only: there are no per-image add / delete endpoints yet)
function BannerImagesEditor({
  isEdit,
  existingImages,
  onExistingImagesChange,
  newImages,
  onNewImagesChange,
  isReplacing,
  onReplacingChange,
  options,
  actionErrors,
  imagesError,
}) {
  const [fileError, setFileError] = useState('')
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false)

  const isPickingFiles = !isEdit || isReplacing
  const rows = isPickingFiles ? newImages : existingImages
  const setRows = isPickingFiles ? onNewImagesChange : onExistingImagesChange

  function handleFilesChange(event) {
    const pickedFiles = [...event.target.files]
    event.target.value = '' // so picking the same file again still fires onChange
    if (pickedFiles.length === 0) return

    // Invalid files are skipped; the valid ones are still added
    const validFiles = pickedFiles.filter((file) => !validateImageFile(file))
    const invalidFile = pickedFiles.find((file) => validateImageFile(file))
    let newError = invalidFile ? validateImageFile(invalidFile) : ''

    const freeSlots = MAX_IMAGES - newImages.length
    if (validFiles.length > freeSlots) newError = 'الحد الأقصى 10 صور للبنر'

    const addedRows = validFiles.slice(0, freeSlots).map((file) => {
      const previewUrl = URL.createObjectURL(file)
      return {
        key: previewUrl,
        file,
        previewUrl,
        action: { click_action_type: 'NONE', click_target_id: '', click_target_data: EMPTY_FILTER },
      }
    })

    setFileError(newError)
    onNewImagesChange([...newImages, ...addedRows])
  }

  function moveRow(index, step) {
    const newRows = [...rows]
    const [row] = newRows.splice(index, 1)
    newRows.splice(index + step, 0, row)
    setRows(newRows)
  }

  function changeAction(index, action) {
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, action } : row)))
  }

  // The previews are temporary browser URLs — free them once their row is gone
  function removeNewRow(index) {
    URL.revokeObjectURL(newImages[index].previewUrl)
    setFileError('')
    onNewImagesChange(newImages.filter((row, rowIndex) => rowIndex !== index))
  }

  function handleConfirmReplace() {
    setIsReplaceConfirmOpen(false)
    setFileError('')
    onNewImagesChange([])
    onReplacingChange(true)
  }

  // The existing rows (and any changes made to them) were never touched, so they simply come back
  function handleCancelReplace() {
    newImages.forEach((row) => URL.revokeObjectURL(row.previewUrl))
    setFileError('')
    onNewImagesChange([])
    onReplacingChange(false)
  }

  return (
    <div className="grid gap-4">
      {isEdit && !isReplacing && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            {existingImages.length === 0
              ? 'لا توجد صور لهذا البنر، ولن يظهر في التطبيق. استخدم «استبدال كل الصور» لإضافة صور.'
              : 'يمكنك تغيير ترتيب الصور وإجراء كل صورة. لتغيير الصور نفسها استخدم «استبدال كل الصور».'}
          </p>
          <Button variant="secondary" onClick={() => setIsReplaceConfirmOpen(true)}>
            <Replace size={18} />
            استبدال كل الصور
          </Button>
        </div>
      )}

      {isReplacing && (
        <div className="flex flex-col gap-3 rounded-md bg-warning/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-warning">
            سيتم حذف الصور الحالية واستبدالها بهذه الصور عند الحفظ
          </p>
          <Button variant="secondary" onClick={handleCancelReplace}>
            <Undo2 size={18} />
            إلغاء الاستبدال
          </Button>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="divide-y divide-border-light rounded-md border border-border">
          {rows.map((row, index) => (
            <li key={row.key} className="flex flex-col gap-4 p-4 md:flex-row">
              <div className="grid shrink-0 content-start gap-2 md:w-48">
                <img
                  src={row.previewUrl || getImageUrl(row.image_url)}
                  alt=""
                  className="h-20 w-full rounded-md border border-border object-cover"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-muted">الصورة {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      aria-label="تحريك لأعلى"
                      title="تحريك لأعلى"
                      className={iconButtonClass}
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, 1)}
                      disabled={index === rows.length - 1}
                      aria-label="تحريك لأسفل"
                      title="تحريك لأسفل"
                      className={iconButtonClass}
                    >
                      <ChevronDown size={18} />
                    </button>
                    {isPickingFiles && (
                      <button
                        type="button"
                        onClick={() => removeNewRow(index)}
                        aria-label="إزالة الصورة"
                        title="إزالة الصورة"
                        className={iconButtonClass}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <ClickActionEditor
                  value={row.action}
                  onChange={(action) => changeAction(index, action)}
                  options={options}
                  error={actionErrors[row.key]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {isPickingFiles && (
        <div className="grid gap-1.5">
          {newImages.length < MAX_IMAGES && (
            // The real file input is hidden; this label, styled as a secondary button, opens it
            <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-background focus-within:ring-2 focus-within:ring-primary/20">
              <ImagePlus size={18} />
              إضافة صور
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                aria-label="إضافة صور للبنر"
                onChange={handleFilesChange}
                className="sr-only"
              />
            </label>
          )}
          {fileError || imagesError ? (
            <p className="text-xs text-error">{fileError || imagesError}</p>
          ) : (
            <p className="text-xs text-text-muted">
              من 1 إلى {MAX_IMAGES} صور — JPG أو PNG أو WEBP، حتى 10 ميجابايت لكل صورة. ترتيب الصور هنا هو ترتيب
              ظهورها في التطبيق.
            </p>
          )}
        </div>
      )}

      {isReplaceConfirmOpen && (
        <ConfirmDialog
          title="استبدال كل الصور"
          message="سيتم حذف كل صور البنر الحالية واستبدالها بالصور الجديدة عند الحفظ. لتغيير صورة واحدة يجب رفع كل الصور من جديد."
          confirmLabel="استبدال"
          variant="danger"
          isLoading={false}
          onConfirm={handleConfirmReplace}
          onCancel={() => setIsReplaceConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default BannerImagesEditor
