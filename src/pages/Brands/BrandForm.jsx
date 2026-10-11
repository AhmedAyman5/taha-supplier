import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import ImageInput from '../../components/ImageInput'
import LoadingState from '../../components/LoadingState'
import Modal from '../../components/Modal'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import {
  createBrand,
  getBrand,
  linkSubCategories,
  unlinkSubCategory,
  updateBrand,
} from './brands.api'
import SubCategoryPicker from './SubCategoryPicker'

// brand = null → create; a list row → edit. The list row has no sub-category links,
// so on edit the form loads the full brand (GET /brand/:id) before showing the fields
function BrandForm({ brand, brands, subCategories, onClose, onSaved }) {
  const isEdit = Boolean(brand)

  const [values, setValues] = useState({ name: '', logoFile: null, subcategory_ids: [] })
  const [originalName, setOriginalName] = useState('') // to skip the PATCH when nothing changed
  const [originalLinkedIds, setOriginalLinkedIds] = useState([]) // to know which links to add / remove
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [isLoadingBrand, setIsLoadingBrand] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [loadKey, setLoadKey] = useState(0) // bump to retry loading the brand

  useEffect(() => {
    if (!brand) return
    let ignore = false
    async function load() {
      try {
        const data = await getBrand(brand.id)
        if (!ignore) {
          const linkedIds = data.brandSubCategories.map((link) => link.subcategory_id)
          setValues({ name: data.name, logoFile: null, subcategory_ids: linkedIds })
          setOriginalName(data.name)
          setOriginalLinkedIds(linkedIds)
          setLoadError('')
        }
      } catch (err) {
        if (!ignore) setLoadError(getErrorMessage(err))
      } finally {
        if (!ignore) setIsLoadingBrand(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [brand, loadKey])

  function handleRetryLoad() {
    setLoadError('')
    setIsLoadingBrand(true)
    setLoadKey(loadKey + 1)
  }

  function validate() {
    const errors = {}
    const name = values.name.trim()

    // The backend also rejects duplicates (409), but checking here gives the message under the field
    const isDuplicate = brands.some(
      (item) => item.id !== brand?.id && item.name.trim().toLowerCase() === name.toLowerCase(),
    )

    if (!name) errors.name = 'اسم العلامة التجارية مطلوب'
    else if (name.length < 2) errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
    else if (isDuplicate) errors.name = 'توجد علامة تجارية بنفس الاسم بالفعل'

    if (!isEdit && !values.logoFile) errors.logo = 'شعار العلامة التجارية مطلوب'

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    setIsSaving(true)

    // Step 1 — the brand itself. If it fails, nothing was saved: keep the form open
    let brandId = brand?.id
    try {
      if (isEdit) {
        const isChanged = values.name.trim() !== originalName || values.logoFile
        if (isChanged) await updateBrand(brand.id, values)
      } else {
        const created = await createBrand(values)
        brandId = created.id
      }
    } catch (err) {
      setError(getErrorMessage(err, { 409: 'توجد علامة تجارية بنفس الاسم بالفعل' }))
      setIsSaving(false)
      return
    }

    // Step 2 — the links, through their own endpoints (POST adds, DELETE removes one at a time).
    // The brand is already saved here, so a failure closes the form and tells the admin to retry from «تعديل»
    const addedIds = values.subcategory_ids.filter((id) => !originalLinkedIds.includes(id))
    const removedIds = originalLinkedIds.filter((id) => !values.subcategory_ids.includes(id))
    try {
      if (addedIds.length > 0) await linkSubCategories(brandId, addedIds)
      for (const id of removedIds) {
        await unlinkSubCategory(brandId, id)
      }
    } catch {
      toast.error('تم حفظ العلامة التجارية، لكن تعذر تحديث الأقسام الفرعية. افتحها من «تعديل» وحاول مرة أخرى')
      onSaved()
      return
    }

    toast.success('تم الحفظ بنجاح')
    onSaved()
  }

  // Don't let Escape / overlay close the form while the request is still running
  function handleClose() {
    if (!isSaving) onClose()
  }

  function renderBody() {
    if (isLoadingBrand) return <LoadingState />
    if (loadError) return <ErrorState message={loadError} onRetry={handleRetryLoad} />

    return (
      // noValidate: our Arabic checks replace the browser's English validation popups
      <form id="brand-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        <FormField label="الاسم" error={fieldErrors.name}>
          <TextInput
            name="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            hasError={Boolean(fieldErrors.name)}
            placeholder="مثال: لافازا (Lavazza)"
          />
        </FormField>

        <div className="grid gap-1.5">
          <ImageInput
            label="الشعار"
            maxSizeMB={5}
            currentImageUrl={isEdit ? getImageUrl(brand.logo) : null}
            onChange={(file) => setValues({ ...values, logoFile: file })}
            error={fieldErrors.logo}
          />
          {/* Backend gotcha: the logo column can't be empty — PATCH can only replace it */}
          {isEdit && (
            <p className="text-xs text-text-muted">يمكن استبدال الشعار فقط، ولا يمكن حذفه</p>
          )}
        </div>

        {/* Not inside FormField: its <label> would wrap the picker's own checkbox labels */}
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-text">الأقسام الفرعية المرتبطة</span>
          <SubCategoryPicker
            options={subCategories}
            selectedIds={values.subcategory_ids}
            onChange={(ids) => setValues({ ...values, subcategory_ids: ids })}
          />
        </div>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      </form>
    )
  }

  return (
    <Modal
      title={isEdit ? 'تعديل العلامة التجارية' : 'إضافة علامة تجارية'}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="brand-form": the footer sits outside the <form>, this links the button to it */}
          <Button
            type="submit"
            form="brand-form"
            disabled={isSaving || isLoadingBrand || Boolean(loadError)}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </>
      }
    >
      {renderBody()}
    </Modal>
  )
}

export default BrandForm
