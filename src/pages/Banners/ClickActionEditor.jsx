import FormField from '../../components/FormField'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { EMPTY_FILTER } from './banners.api'
import ProductPicker from './ProductPicker'

// PAGE exists in the backend enum but is ALWAYS rejected, so it is never offered
const ACTION_OPTIONS = [
  { value: 'NONE', label: 'بدون إجراء' },
  { value: 'CATEGORY', label: 'فتح قسم رئيسي' },
  { value: 'PRODUCT', label: 'فتح منتج' },
  { value: 'BRAND', label: 'فتح علامة تجارية' },
  { value: 'FILTER', label: 'فتح قائمة منتجات بفلتر' },
]

// min_rating = "average rating ≥ value" (the backend accepts 1–5; we offer 2, 3 and 4)
const RATING_OPTIONS = ['2', '3', '4']

const SORT_OPTIONS = [
  { value: 'bestSelling', label: 'الأكثر مبيعاً' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'topRated', label: 'الأعلى تقييماً' },
  { value: 'nameAsc', label: 'حسب الاسم' },
]

const checkboxLabelClass = 'flex items-center gap-2 text-sm text-text'

// value = { click_action_type, click_target_id, click_target_data } (form values of ONE image)
// options = { categories, subCategories, brands, isLoaded }
function ClickActionEditor({ value, onChange, options, error }) {
  const type = value.click_action_type
  const filter = value.click_target_data

  // A new action never keeps the old target (the backend rejects a target the action doesn't use)
  function handleTypeChange(event) {
    onChange({ click_action_type: event.target.value, click_target_id: '', click_target_data: EMPTY_FILTER })
  }

  function handleTargetChange(event) {
    onChange({ ...value, click_target_id: event.target.value })
  }

  function changeFilter(name, newValue) {
    const newFilter = { ...filter, [name]: newValue }
    if (name === 'category_id') newFilter.subcategory_id = '' // the old sub-category may not belong to it
    onChange({ ...value, click_target_data: newFilter })
  }

  const selectedCategory = options.categories.find((category) => String(category.id) === value.click_target_id)
  const isBrandInList = options.brands.some((brand) => String(brand.id) === value.click_target_id)
  // GET /brand/admin excludes soft-deleted brands, so a saved deleted brand is missing from the list
  const isSavedBrandDeleted = options.isLoaded && value.click_target_id !== '' && !isBrandInList

  const subCategoryOptions = filter.category_id
    ? options.subCategories.filter((subCategory) => String(subCategory.category_id) === filter.category_id)
    : options.subCategories

  // A saved rating outside 2 / 3 / 4 (e.g. set through the API) is kept as an extra option so it isn't lost
  const ratingOptions =
    filter.min_rating && !RATING_OPTIONS.includes(filter.min_rating)
      ? [...RATING_OPTIONS, filter.min_rating]
      : RATING_OPTIONS

  return (
    <div className="grid gap-4">
      <FormField label="عند الضغط على الصورة">
        <Select value={type} onChange={handleTypeChange}>
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormField>

      {type === 'CATEGORY' && (
        <div className="grid gap-1.5">
          <FormField label="القسم الرئيسي" error={error}>
            <Select value={value.click_target_id} onChange={handleTargetChange} hasError={Boolean(error)}>
              <option value="">اختر القسم</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_hidden && ' (مخفي)'}
                </option>
              ))}
            </Select>
          </FormField>
          {selectedCategory?.is_hidden && (
            <p className="text-xs text-warning">هذا القسم مخفي حالياً، ولن يجد العميل شيئاً عند الضغط</p>
          )}
        </div>
      )}

      {type === 'BRAND' && (
        <div className="grid gap-1.5">
          <FormField label="العلامة التجارية" error={error}>
            <Select
              value={isBrandInList ? value.click_target_id : ''}
              onChange={handleTargetChange}
              hasError={Boolean(error)}
            >
              <option value="">اختر العلامة التجارية</option>
              {options.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </FormField>
          {isSavedBrandDeleted && (
            <p className="text-xs text-warning">العلامة التجارية المحفوظة محذوفة، اختر وجهة أخرى</p>
          )}
        </div>
      )}

      {type === 'PRODUCT' && (
        <ProductPicker
          value={value.click_target_id}
          onChange={(id) => onChange({ ...value, click_target_id: id })}
          error={error}
        />
      )}

      {type === 'FILTER' && (
        <div className="grid gap-3">
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <FormField label="القسم الرئيسي">
              <Select value={filter.category_id} onChange={(event) => changeFilter('category_id', event.target.value)}>
                <option value="">الكل</option>
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.is_hidden && ' (مخفي)'}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="القسم الفرعي">
              <Select
                value={filter.subcategory_id}
                onChange={(event) => changeFilter('subcategory_id', event.target.value)}
              >
                <option value="">الكل</option>
                {subCategoryOptions.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                    {subCategory.is_hidden && ' (مخفي)'}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="العلامة التجارية">
              <Select value={filter.brand_id} onChange={(event) => changeFilter('brand_id', event.target.value)}>
                <option value="">الكل</option>
                {options.brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="كلمة بحث">
              <TextInput
                value={filter.search}
                onChange={(event) => changeFilter('search', event.target.value)}
                placeholder="مثال: قهوة"
              />
            </FormField>
            <FormField label="أقل تقييم">
              <Select value={filter.min_rating} onChange={(event) => changeFilter('min_rating', event.target.value)}>
                <option value="">بدون</option>
                {ratingOptions.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} نجوم فأكثر
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="الترتيب">
              <Select value={filter.sort} onChange={(event) => changeFilter('sort', event.target.value)}>
                <option value="">الافتراضي</option>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={filter.available}
                onChange={(event) => changeFilter('available', event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              المنتجات المتاحة فقط
            </label>
            <label className={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={filter.offers}
                onChange={(event) => changeFilter('offers', event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              العروض فقط
            </label>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default ClickActionEditor
