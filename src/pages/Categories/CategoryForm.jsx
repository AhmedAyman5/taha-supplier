import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import ImageInput from '../../components/ImageInput'
import Modal from '../../components/Modal'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import { createCategory, updateCategory } from './categories.api'

// category = null → create; a list row → edit (the row already has every editable field)
function CategoryForm({ category, categories, onClose, onSaved }) {
  const isEdit = Boolean(category)

  // New categories go to the end of the list by default
  const nextDisplayOrder =
    categories.length > 0 ? Math.max(...categories.map((item) => item.display_order)) + 1 : 0

  const [values, setValues] = useState({
    name: isEdit ? category.name : '',
    display_order: String(isEdit ? category.display_order : nextDisplayOrder),
    is_hidden: isEdit ? category.is_hidden : false,
    imageFile: null,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues({ ...values, [name]: type === 'checkbox' ? checked : value })
  }

  function validate() {
    const errors = {}
    const name = values.name.trim()
    const displayOrder = Number(values.display_order)

    // The backend allows two categories with the same name, so we block duplicates here
    const isDuplicate = categories.some(
      (item) => item.id !== category?.id && item.name.trim().toLowerCase() === name.toLowerCase(),
    )

    if (!name) errors.name = 'اسم القسم مطلوب'
    else if (name.length < 2) errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
    else if (isDuplicate) errors.name = 'يوجد قسم بنفس الاسم بالفعل'

    if (values.display_order.trim() === '' || !Number.isInteger(displayOrder) || displayOrder < 0) {
      errors.display_order = 'ترتيب العرض يجب أن يكون رقماً صحيحاً 0 أو أكبر'
    }

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    const data = {
      name: values.name,
      display_order: Number(values.display_order),
      is_hidden: values.is_hidden,
      imageFile: values.imageFile,
    }

    setIsSaving(true)
    try {
      if (isEdit) await updateCategory(category.id, data)
      else await createCategory(data)
      toast.success('تم الحفظ بنجاح')
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setIsSaving(false)
    }
  }

  // Don't let Escape / overlay close the form while the request is still running
  function handleClose() {
    if (!isSaving) onClose()
  }

  return (
    <Modal
      title={isEdit ? 'تعديل القسم' : 'إضافة قسم'}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="category-form": the footer sits outside the <form>, this links the button to it */}
          <Button type="submit" form="category-form" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </>
      }
    >
      {/* noValidate: our Arabic checks replace the browser's English validation popups */}
      <form id="category-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        <FormField label="الاسم" error={fieldErrors.name}>
          <TextInput
            name="name"
            value={values.name}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.name)}
            placeholder="مثال: المواد الخام"
          />
        </FormField>

        <FormField
          label="ترتيب العرض"
          error={fieldErrors.display_order}
          hint="الأقسام ذات الرقم الأصغر تظهر أولاً في التطبيق"
        >
          <TextInput
            name="display_order"
            type="number"
            min="0"
            step="1"
            value={values.display_order}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.display_order)}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="is_hidden"
            checked={values.is_hidden}
            onChange={handleChange}
            className="h-4 w-4 accent-primary"
          />
          إخفاء القسم من التطبيق
        </label>

        <div className="grid gap-1.5">
          <ImageInput
            label="الصورة"
            currentImageUrl={isEdit ? getImageUrl(category.image) : null}
            onChange={(file) => setValues({ ...values, imageFile: file })}
          />
          {/* Backend gotcha: PATCH can replace the image but has no way to remove it */}
          {isEdit && (
            <p className="text-xs text-text-muted">يمكن استبدال الصورة فقط، ولا يمكن حذفها</p>
          )}
        </div>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default CategoryForm
