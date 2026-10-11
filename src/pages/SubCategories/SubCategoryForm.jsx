import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import ImageInput from '../../components/ImageInput'
import Modal from '../../components/Modal'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import { createSubCategory, updateSubCategory } from './subCategories.api'

// subCategory = null → create; a list row → edit (the row already has every editable field).
// defaultCategoryId: the category chosen in the page's filter ('' = none), pre-selected on create
function SubCategoryForm({ subCategory, subCategories, categories, defaultCategoryId, onClose, onSaved }) {
  const isEdit = Boolean(subCategory)

  // New sub-categories go to the end of their category by default
  function getNextDisplayOrder(categoryId) {
    const orders = subCategories
      .filter((item) => String(item.category_id) === categoryId)
      .map((item) => item.display_order)
    return orders.length > 0 ? Math.max(...orders) + 1 : 0
  }

  const initialCategoryId = isEdit ? String(subCategory.category_id) : defaultCategoryId

  const [values, setValues] = useState({
    category_id: initialCategoryId,
    name: isEdit ? subCategory.name : '',
    display_order: String(isEdit ? subCategory.display_order : getNextDisplayOrder(initialCategoryId)),
    is_hidden: isEdit ? subCategory.is_hidden : false,
    imageFile: null,
  })
  const [isDisplayOrderEdited, setIsDisplayOrderEdited] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const hasNoCategories = categories.length === 0
  const isMovingCategory = isEdit && values.category_id !== String(subCategory.category_id)

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    const newValues = { ...values, [name]: type === 'checkbox' ? checked : value }

    if (name === 'display_order') setIsDisplayOrderEdited(true)
    // On create, keep the suggested order in sync with the chosen category until the user types their own
    if (name === 'category_id' && !isEdit && !isDisplayOrderEdited) {
      newValues.display_order = String(getNextDisplayOrder(value))
    }

    setValues(newValues)
  }

  function validate() {
    const errors = {}
    const name = values.name.trim()
    const displayOrder = Number(values.display_order)

    // The backend allows duplicate names, so we block them here — only inside the same category
    const isDuplicate = subCategories.some(
      (item) =>
        item.id !== subCategory?.id &&
        String(item.category_id) === values.category_id &&
        item.name.trim().toLowerCase() === name.toLowerCase(),
    )

    // The backend doesn't check the category exists (a wrong id fails with a 500), so it must come from the list
    if (!values.category_id) errors.category_id = 'اختر القسم الرئيسي'

    if (!name) errors.name = 'اسم القسم الفرعي مطلوب'
    else if (name.length < 2) errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
    else if (isDuplicate) errors.name = 'يوجد قسم فرعي بنفس الاسم في هذا القسم الرئيسي'

    if (values.display_order.trim() === '' || !Number.isInteger(displayOrder) || displayOrder < 0) {
      errors.display_order = 'ترتيب العرض يجب أن يكون رقماً صحيحاً 0 أو أكبر'
    }

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (hasNoCategories) return

    const errors = validate()
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    const data = {
      name: values.name,
      category_id: Number(values.category_id),
      display_order: Number(values.display_order),
      is_hidden: values.is_hidden,
      imageFile: values.imageFile,
    }

    setIsSaving(true)
    try {
      if (isEdit) await updateSubCategory(subCategory.id, data)
      else await createSubCategory(data)
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
      title={isEdit ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي'}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="sub-category-form": the footer sits outside the <form>, this links the button to it */}
          <Button type="submit" form="sub-category-form" disabled={isSaving || hasNoCategories}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </>
      }
    >
      {/* noValidate: our Arabic checks replace the browser's English validation popups */}
      <form id="sub-category-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        <div className="grid gap-1.5">
          <FormField
            label="القسم الرئيسي"
            error={
              hasNoCategories
                ? 'أضف قسماً رئيسياً أولاً من صفحة الأقسام الرئيسية'
                : fieldErrors.category_id
            }
          >
            <Select
              name="category_id"
              value={values.category_id}
              onChange={handleChange}
              hasError={hasNoCategories || Boolean(fieldErrors.category_id)}
            >
              <option value="" disabled>
                اختر القسم الرئيسي
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_hidden && ' (مخفي)'}
                </option>
              ))}
            </Select>
          </FormField>
          {/* Backend gotcha: changing category_id moves the sub-category together with all its products */}
          {isMovingCategory && (
            <p className="text-xs text-warning">سيتم نقل كل منتجات هذا القسم الفرعي إلى القسم الرئيسي الجديد</p>
          )}
        </div>

        <FormField label="الاسم" error={fieldErrors.name}>
          <TextInput
            name="name"
            value={values.name}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.name)}
            placeholder="مثال: قهوة"
          />
        </FormField>

        <FormField
          label="ترتيب العرض"
          error={fieldErrors.display_order}
          hint="الأقسام الفرعية ذات الرقم الأصغر تظهر أولاً داخل القسم الرئيسي"
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
          إخفاء القسم الفرعي من التطبيق
        </label>

        <div className="grid gap-1.5">
          <ImageInput
            label="الصورة"
            currentImageUrl={isEdit ? getImageUrl(subCategory.image) : null}
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

export default SubCategoryForm
