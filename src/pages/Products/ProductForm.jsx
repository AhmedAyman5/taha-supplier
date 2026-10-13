import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import toast from 'react-hot-toast'
import { ChevronRight, RotateCw } from 'lucide-react'
import Button from '../../components/Button'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import ImageInput from '../../components/ImageInput'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import {
  createProduct,
  getBrandOptions,
  getCategoryOptions,
  getProduct,
  getSubCategoryOptions,
  removeProductDiscount,
  updateProduct,
} from './products.api'
import ProductGallery from './ProductGallery'
import ProductGalleryPicker from './ProductGalleryPicker'

const cardClass = 'rounded-lg border border-border bg-surface p-5'
const cardTitleClass = 'mb-4 text-base font-semibold text-text'
const checkboxLabelClass = 'flex items-center gap-2 text-sm text-text'

const EMPTY_VALUES = {
  name: '',
  description: '',
  unit: '',
  category_id: '', // only filters the sub-category select — never sent
  subcategory_id: '',
  brand_id: '',
  price: '',
  discount_price: '',
  is_available: true, // the backend default
  is_new: false,
  is_best_seller: false,
  display_order: '0',
  imageFile: null,
  galleryFiles: [], // create only
}

// /products/new → create · /products/:id/edit → edit
function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  // Dropdown options — loaded on their own, so a failure never hides the form (inline warning instead)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsFailed, setOptionsFailed] = useState(false)
  const [optionsKey, setOptionsKey] = useState(0) // bump to reload ONLY the options

  // Edit only: without the product there is nothing to edit, so its failure is a full-page error
  const [product, setProduct] = useState(null) // the loaded product (main image, gallery, rating)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [loadKey, setLoadKey] = useState(0) // bump to retry loading the product

  const [values, setValues] = useState(EMPTY_VALUES)
  // The discount saved in the database ('' = none). Only then can the admin remove it
  const [savedDiscountPrice, setSavedDiscountPrice] = useState('')
  const [removeDiscount, setRemoveDiscount] = useState(false) // the «إزالة الخصم» checkbox

  const [fieldErrors, setFieldErrors] = useState({})
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
        const productData = await getProduct(id)
        if (ignore) return
        // Money comes back as Decimal strings ("520.00") → "520"
        const discountPrice = productData.discount_price ? String(Number(productData.discount_price)) : ''

        setProduct(productData)
        setSavedDiscountPrice(discountPrice)
        setValues({
          ...EMPTY_VALUES,
          name: productData.name,
          description: productData.description,
          unit: productData.unit,
          category_id: String(productData.subCategory.category_id),
          subcategory_id: String(productData.subcategory_id),
          brand_id: String(productData.brand_id),
          price: String(Number(productData.price)),
          discount_price: discountPrice,
          is_available: productData.is_available,
          is_new: productData.is_new,
          is_best_seller: productData.is_best_seller,
          display_order: String(productData.display_order),
        })
        setLoadError('')
      } catch (err) {
        if (!ignore) setLoadError(getErrorMessage(err, { 400: 'المنتج غير موجود', 404: 'المنتج غير موجود' }))
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

  // Reloads only the dropdown options — everything already typed in the form stays
  function handleRetryOptions() {
    setIsLoadingOptions(true)
    setOptionsKey(optionsKey + 1)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues({ ...values, [name]: type === 'checkbox' ? checked : value })
  }

  // The old sub-category may not belong to the new category, so it is cleared
  function handleCategoryChange(event) {
    setValues({ ...values, category_id: event.target.value, subcategory_id: '' })
  }

  // Checked → the input is cleared and disabled. Unchecked → the saved discount comes back
  function handleRemoveDiscountChange(event) {
    const checked = event.target.checked
    setRemoveDiscount(checked)
    setValues({ ...values, discount_price: checked ? '' : savedDiscountPrice })
  }

  // A select only counts as chosen when its value is one of the LOADED options. In edit mode the ids
  // are pre-filled before (or without) the options, so this keeps saving blocked until they load
  const isSubCategorySelected = subCategories.some((item) => String(item.id) === values.subcategory_id)
  const isBrandSelected = brands.some((brand) => String(brand.id) === values.brand_id)

  // GET /brand/admin excludes soft-deleted brands, so the product's brand is missing from the options
  const isCurrentBrandDeleted =
    Boolean(product) && !isLoadingOptions && !optionsFailed && !brands.some((brand) => brand.id === product.brand_id)

  function validate() {
    const errors = {}
    const name = values.name.trim()
    const price = Number(values.price)
    const isPriceValid = values.price.trim() !== '' && Number.isFinite(price) && price >= 0
    const discountPrice = Number(values.discount_price)
    const displayOrder = Number(values.display_order)

    if (!name) errors.name = 'اسم المنتج مطلوب'
    else if (name.length < 2) errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
    if (!values.description.trim()) errors.description = 'وصف المنتج مطلوب'
    if (!values.unit.trim()) errors.unit = 'الوحدة مطلوبة'
    if (!isSubCategorySelected) errors.subcategory_id = 'اختر القسم الفرعي'
    if (!isBrandSelected) errors.brand_id = 'اختر العلامة التجارية'

    if (!isPriceValid) errors.price = 'السعر مطلوب ويجب أن يكون 0 أو أكثر'

    // Backend rules: discount_price ≥ 1 and strictly less than price
    if (values.discount_price.trim() !== '') {
      if (!Number.isFinite(discountPrice) || discountPrice < 1 || (isPriceValid && discountPrice >= price)) {
        errors.discount_price = 'السعر بعد الخصم يجب أن يكون 1 أو أكثر وأقل من السعر الأصلي'
      }
    } else if (savedDiscountPrice && !removeDiscount) {
      // An emptied input is NEVER treated as a removal — only the checkbox removes a discount
      errors.discount_price = 'لإزالة الخصم علّم على خيار «إزالة الخصم»'
    }

    if (values.display_order.trim() === '' || !Number.isInteger(displayOrder) || displayOrder < 0) {
      errors.display_order = 'ترتيب العرض يجب أن يكون رقماً صحيحاً 0 أو أكبر'
    }

    if (!isEdit && !values.imageFile) errors.image = 'الصورة الرئيسية مطلوبة'

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('راجع الحقول المظللة باللون الأحمر')
      return
    }
    setError('')

    const data = {
      subcategory_id: values.subcategory_id,
      brand_id: values.brand_id,
      name: values.name,
      description: values.description,
      price: values.price.trim(),
      discount_price: values.discount_price.trim(), // '' → not sent at all (keeps the current discount)
      unit: values.unit,
      is_available: values.is_available,
      is_best_seller: values.is_best_seller,
      is_new: values.is_new,
      display_order: values.display_order.trim(),
      imageFile: values.imageFile,
      galleryFiles: values.galleryFiles,
    }

    setIsSaving(true)

    if (!isEdit) {
      try {
        await createProduct(data)
      } catch (err) {
        setError(getErrorMessage(err))
        setIsSaving(false)
        return
      }
    } else {
      // Removing comes FIRST: otherwise, if the price is lowered in the same save, the backend
      // would compare the new price with the OLD discount and reject it
      if (removeDiscount) {
        try {
          await removeProductDiscount(id)
        } catch (err) {
          setError(getErrorMessage(err))
          setIsSaving(false)
          return
        }
      }

      try {
        await updateProduct(id, data)
      } catch (err) {
        if (removeDiscount) {
          // The discount is already gone in the database — the form must now treat it that way
          setSavedDiscountPrice('')
          setRemoveDiscount(false)
          setError(`تم إلغاء الخصم، لكن تعذر حفظ باقي التعديلات. ${getErrorMessage(err)}`)
        } else {
          setError(getErrorMessage(err))
        }
        setIsSaving(false)
        return
      }
    }

    toast.success('تم الحفظ بنجاح')
    navigate('/products')
  }

  // With a category chosen, only its sub-categories are offered
  const subCategoryOptions = values.category_id
    ? subCategories.filter((subCategory) => String(subCategory.category_id) === values.category_id)
    : subCategories

  // Display only — the server computes and stores the real percentage
  const price = Number(values.price)
  const discountPrice = Number(values.discount_price)
  const showDiscountPreview =
    !removeDiscount &&
    values.price.trim() !== '' &&
    values.discount_price.trim() !== '' &&
    price > 0 &&
    discountPrice >= 1 &&
    discountPrice < price
  const discountPercentage = showDiscountPreview ? Math.round(((price - discountPrice) / price) * 100) : 0

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
          <h2 className={cardTitleClass}>البيانات الأساسية</h2>

          {optionsFailed && (
            <div className="mb-4 flex flex-col gap-3 rounded-md bg-warning/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-warning">تعذر تحميل الأقسام والعلامات التجارية</p>
              <Button variant="secondary" onClick={handleRetryOptions} disabled={isLoadingOptions}>
                <RotateCw size={18} />
                إعادة المحاولة
              </Button>
            </div>
          )}

          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label="الاسم" error={fieldErrors.name}>
              <TextInput
                name="name"
                value={values.name}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.name)}
                placeholder="مثال: قهوة لافازا 1 كجم"
              />
            </FormField>

            <FormField label="الوحدة" error={fieldErrors.unit}>
              <TextInput
                name="unit"
                value={values.unit}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.unit)}
                placeholder="مثال: كجم، لتر، علبة"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="الوصف" error={fieldErrors.description}>
                <Textarea
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  hasError={Boolean(fieldErrors.description)}
                />
              </FormField>
            </div>

            <FormField label="القسم الرئيسي" hint="لتصفية قائمة الأقسام الفرعية فقط">
              <Select name="category_id" value={values.category_id} onChange={handleCategoryChange}>
                <option value="">كل الأقسام</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.is_hidden && ' (مخفي)'}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="القسم الفرعي" error={fieldErrors.subcategory_id}>
              <Select
                name="subcategory_id"
                value={values.subcategory_id}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.subcategory_id)}
              >
                <option value="">اختر القسم الفرعي</option>
                {subCategoryOptions.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                    {subCategory.is_hidden && ' (مخفي)'}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid gap-1.5">
              <FormField label="العلامة التجارية" error={fieldErrors.brand_id}>
                <Select
                  name="brand_id"
                  value={values.brand_id}
                  onChange={handleChange}
                  hasError={Boolean(fieldErrors.brand_id)}
                >
                  <option value="">اختر العلامة التجارية</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              {isCurrentBrandDeleted && !isBrandSelected && (
                <p className="text-xs text-warning">العلامة التجارية الحالية محذوفة، اختر علامة أخرى</p>
              )}
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>السعر</h2>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label="السعر" error={fieldErrors.price} hint="بالجنيه المصري">
              <TextInput
                name="price"
                type="number"
                min="0"
                step="any"
                value={values.price}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.price)}
              />
            </FormField>

            <div className="grid content-start gap-1.5">
              <FormField label="السعر بعد الخصم" error={fieldErrors.discount_price} hint="اختياري">
                <TextInput
                  name="discount_price"
                  type="number"
                  min="1"
                  step="any"
                  value={values.discount_price}
                  onChange={handleChange}
                  disabled={removeDiscount}
                  hasError={Boolean(fieldErrors.discount_price)}
                />
              </FormField>
              {showDiscountPreview && (
                <p className="text-xs text-text-secondary">نسبة الخصم: {discountPercentage}%</p>
              )}

              {/* Only a product that HAS a saved discount can remove it — always an explicit choice */}
              {savedDiscountPrice && (
                <label className={checkboxLabelClass}>
                  <input
                    type="checkbox"
                    checked={removeDiscount}
                    onChange={handleRemoveDiscountChange}
                    className="h-4 w-4 accent-primary"
                  />
                  إزالة الخصم
                </label>
              )}
              {removeDiscount && (
                <p className="text-xs text-warning">سيعود المنتج لسعره الأصلي عند الحفظ</p>
              )}
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>الظهور في التطبيق</h2>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <div className="grid content-start gap-3">
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={values.is_available}
                  onChange={handleChange}
                  className="h-4 w-4 accent-primary"
                />
                متاح للبيع
              </label>
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  name="is_new"
                  checked={values.is_new}
                  onChange={handleChange}
                  className="h-4 w-4 accent-primary"
                />
                منتج جديد
              </label>
              <label className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  name="is_best_seller"
                  checked={values.is_best_seller}
                  onChange={handleChange}
                  className="h-4 w-4 accent-primary"
                />
                من الأكثر مبيعاً
              </label>
            </div>

            <FormField label="ترتيب العرض" error={fieldErrors.display_order} hint="الرقم الأصغر يظهر أولاً">
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
          </div>

          {/* rating and review_count are owned by the reviews module — read-only here */}
          {isEdit && (
            <p className="mt-4 text-sm text-text-secondary">
              التقييم: {Number(product.rating)} ({product.review_count} تقييم)
            </p>
          )}
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>الصور</h2>
          <div className="grid gap-6">
            <div className="grid gap-1.5">
              <ImageInput
                label="الصورة الرئيسية"
                currentImageUrl={isEdit ? getImageUrl(product.image) : null}
                onChange={(file) => setValues({ ...values, imageFile: file })}
                error={fieldErrors.image}
              />
              {/* Backend gotcha: the main image can't be empty — PATCH can only replace it */}
              {isEdit && <p className="text-xs text-text-muted">يمكن استبدال الصورة الرئيسية فقط</p>}
            </div>

            {isEdit ? (
              <ProductGallery productId={id} initialImages={product.images} />
            ) : (
              <ProductGalleryPicker onChange={(files) => setValues({ ...values, galleryFiles: files })} />
            )}
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/products')} disabled={isSaving}>
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
      <PageHeader title={isEdit ? 'تعديل المنتج' : 'إضافة منتج'}>
        <Button variant="secondary" onClick={() => navigate('/products')}>
          <ChevronRight size={18} />
          رجوع للمنتجات
        </Button>
      </PageHeader>

      {renderBody()}
    </div>
  )
}

export default ProductForm
