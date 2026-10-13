import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import toast from 'react-hot-toast'
import { ChevronRight, RotateCw } from 'lucide-react'
import Button from '../../components/Button'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import {
  EMPTY_FILTER,
  createBanner,
  getBanner,
  getBrandOptions,
  getCategoryOptions,
  getSubCategoryOptions,
  updateBanner,
} from './banners.api'
import BannerImagesEditor from './BannerImagesEditor'

const cardClass = 'rounded-lg border border-border bg-surface p-5'
const cardTitleClass = 'mb-4 text-base font-semibold text-text'

const EMPTY_VALUES = { title: '', sort_order: '0', is_active: true } // the backend defaults

// A saved image's action → the form values ClickActionEditor works with (ids as strings)
function toFormAction(image) {
  const data = image.click_target_data || {}
  return {
    click_action_type: image.click_action_type,
    click_target_id: image.click_target_id ? String(image.click_target_id) : '',
    click_target_data: {
      ...EMPTY_FILTER,
      category_id: data.category_id ? String(data.category_id) : '',
      subcategory_id: data.subcategory_id ? String(data.subcategory_id) : '',
      brand_id: data.brand_id ? String(data.brand_id) : '',
      search: data.search || '',
      available: Number(data.available) === 1,
      offers: Number(data.offers) === 1,
      min_rating: data.min_rating ? String(data.min_rating) : '',
      sort: data.sort || '',
    },
  }
}

// '' when the action is complete. A category / brand counts only when it is in the LOADED list:
// a deleted brand (or options that failed to load) must be chosen again before saving
function getActionError(action, options) {
  const type = action.click_action_type
  const id = action.click_target_id
  if (type === 'CATEGORY' && !options.categories.some((category) => String(category.id) === id)) return 'اختر الوجهة'
  if (type === 'BRAND' && !options.brands.some((brand) => String(brand.id) === id)) return 'اختر الوجهة'
  if (type === 'PRODUCT' && !id) return 'اختر الوجهة'
  if (type === 'FILTER') {
    const filter = action.click_target_data
    const hasValue =
      filter.category_id ||
      filter.subcategory_id ||
      filter.brand_id ||
      filter.search.trim() ||
      filter.available ||
      filter.offers ||
      filter.min_rating ||
      filter.sort
    if (!hasValue) return 'اختر فلتراً واحداً على الأقل'
  }
  return ''
}

// /banners/new → create · /banners/:id/edit → edit
function BannerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  // Action options — loaded on their own, so a failure never hides the form (inline warning instead)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsFailed, setOptionsFailed] = useState(false)
  const [optionsKey, setOptionsKey] = useState(0) // bump to reload ONLY the options

  // Edit only: without the banner there is nothing to edit, so its failure is a full-page error
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [loadKey, setLoadKey] = useState(0) // bump to retry loading the banner

  const [values, setValues] = useState(EMPTY_VALUES)
  const [existingImages, setExistingImages] = useState([]) // edit: the banner's images (reorder + actions)
  const [areExistingImagesChanged, setAreExistingImagesChanged] = useState(false)
  const [newImages, setNewImages] = useState([]) // create, or "replace all" on edit
  const [isReplacing, setIsReplacing] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [actionErrors, setActionErrors] = useState({}) // by row key
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const errorRef = useRef(null)

  useEffect(() => {
    let ignore = false
    async function loadOptions() {
      try {
        const [categoriesData, subCategoriesData, brandsData] = await Promise.all([
          getCategoryOptions(),
          getSubCategoryOptions(),
          getBrandOptions(),
        ])
        if (!ignore) {
          setCategories(categoriesData)
          setSubCategories(subCategoriesData)
          setBrands(brandsData)
          setOptionsFailed(false)
        }
      } catch {
        if (!ignore) setOptionsFailed(true)
      } finally {
        if (!ignore) setIsLoadingOptions(false)
      }
    }
    loadOptions()
    return () => {
      ignore = true
    }
  }, [optionsKey])

  useEffect(() => {
    if (!id) return
    let ignore = false
    async function load() {
      try {
        const banner = await getBanner(id)
        if (ignore) return
        setValues({
          title: banner.title || '',
          sort_order: String(banner.sort_order),
          is_active: banner.is_active,
        })
        setExistingImages(
          banner.images.map((image) => ({
            key: String(image.id),
            image_id: image.id,
            image_url: image.image_url,
            action: toFormAction(image),
          })),
        )
        setLoadError('')
      } catch (err) {
        // A non-numeric id is a 400 here (ParseIntPipe), not a 404
        if (!ignore) setLoadError(getErrorMessage(err, { 400: 'البنر غير موجود', 404: 'البنر غير موجود' }))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [id, loadKey])

  // The form is long — bring the message at the top into view when it appears
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  function handleRetryLoad() {
    setLoadError('')
    setIsLoading(true)
    setLoadKey(loadKey + 1)
  }

  // Reloads only the options — everything already chosen in the form stays
  function handleRetryOptions() {
    setIsLoadingOptions(true)
    setOptionsKey(optionsKey + 1)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues({ ...values, [name]: type === 'checkbox' ? checked : value })
  }

  // Any reorder or action change means the images must be reconfigured on save
  function handleExistingImagesChange(rows) {
    setExistingImages(rows)
    setAreExistingImagesChanged(true)
  }

  const options = { categories, subCategories, brands, isLoaded: !isLoadingOptions && !optionsFailed }
  const isSendingNewImages = !isEdit || isReplacing
  const shownRows = isSendingNewImages ? newImages : existingImages

  function validate() {
    const errors = {}
    const sortOrder = Number(values.sort_order)
    if (values.sort_order.trim() === '' || !Number.isInteger(sortOrder) || sortOrder < 0) {
      errors.sort_order = 'ترتيب العرض يجب أن يكون رقماً صحيحاً 0 أو أكبر'
    }
    if (isSendingNewImages && newImages.length === 0) errors.images = 'أضف صورة واحدة على الأقل'
    return errors
  }

  function validateActions() {
    const errors = {}
    shownRows.forEach((row) => {
      const actionError = getActionError(row.action, options)
      if (actionError) errors[row.key] = actionError
    })
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    const newActionErrors = validateActions()
    setFieldErrors(errors)
    setActionErrors(newActionErrors)
    if (Object.keys(errors).length > 0 || Object.keys(newActionErrors).length > 0) {
      setError('راجع الحقول المظللة باللون الأحمر')
      return
    }
    setError('')

    const title = values.title.trim()
    const sortOrder = values.sort_order.trim()
    const imagesToUpload = newImages.map((row) => ({ file: row.file, action: row.action }))

    setIsSaving(true)
    try {
      if (!isEdit) {
        await createBanner({ title, is_active: values.is_active, sort_order: sortOrder, images: imagesToUpload })
      } else {
        // ONE request: the backend saves the fields and the images together, or nothing at all
        await updateBanner(id, {
          title,
          is_active: values.is_active,
          sort_order: sortOrder,
          newImages: isReplacing ? imagesToUpload : undefined,
          existingConfigs:
            !isReplacing && areExistingImagesChanged
              ? existingImages.map((row) => ({ image_id: row.image_id, action: row.action }))
              : undefined,
        })
      }
    } catch (err) {
      // Nothing was saved — the admin can fix the problem and save again
      setError(getErrorMessage(err, { 404: 'الوجهة المختارة غير موجودة أو تم حذفها، اخترها من جديد' }))
      setIsSaving(false)
      return
    }

    toast.success('تم الحفظ بنجاح')
    navigate('/banners')
  }

  function renderBody() {
    if (isLoading) return <LoadingState />
    if (loadError) return <ErrorState message={loadError} onRetry={handleRetryLoad} />

    return (
      // noValidate: our Arabic checks replace the browser's English validation popups
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <p ref={errorRef} className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <section className={cardClass}>
          <h2 className={cardTitleClass}>بيانات البنر</h2>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label="العنوان" hint="اختياري — يساعدك على تمييز البنر">
              <TextInput name="title" value={values.title} onChange={handleChange} placeholder="مثال: عروض الصيف" />
            </FormField>

            <FormField label="ترتيب العرض" error={fieldErrors.sort_order} hint="الرقم الأصغر يظهر أولاً">
              <TextInput
                name="sort_order"
                type="number"
                min="0"
                step="1"
                value={values.sort_order}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.sort_order)}
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="is_active"
                checked={values.is_active}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              البنر مفعّل
            </label>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>الصور وإجراء كل صورة</h2>

          {optionsFailed && (
            <div className="mb-4 flex flex-col gap-3 rounded-md bg-warning/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-warning">تعذر تحميل الأقسام والعلامات التجارية</p>
              <Button variant="secondary" onClick={handleRetryOptions} disabled={isLoadingOptions}>
                <RotateCw size={18} />
                إعادة المحاولة
              </Button>
            </div>
          )}

          <BannerImagesEditor
            isEdit={isEdit}
            existingImages={existingImages}
            onExistingImagesChange={handleExistingImagesChange}
            newImages={newImages}
            onNewImagesChange={setNewImages}
            isReplacing={isReplacing}
            onReplacingChange={setIsReplacing}
            options={options}
            actionErrors={actionErrors}
            imagesError={fieldErrors.images}
          />
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/banners')} disabled={isSaving}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'تعديل البنر' : 'إضافة بنر'}>
        <Button variant="secondary" onClick={() => navigate('/banners')}>
          <ChevronRight size={18} />
          رجوع للبنرات
        </Button>
      </PageHeader>

      {renderBody()}
    </div>
  )
}

export default BannerForm
