import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { Plus, Search } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import {
  activateProduct,
  deactivateProduct,
  getBrandOptions,
  getCategoryOptions,
  getProducts,
  getSubCategoryOptions,
} from './products.api'
import ProductTable from './ProductTable'

const EMPTY_FILTERS = { search: '', category_id: '', subcategory_id: '', brand_id: '', is_available: '' }

function Products() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true) // first load only — shows the full loading card
  const [isFetching, setIsFetching] = useState(false) // later loads — the table stays, a small hint shows
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after deactivate / activate

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('') // what is typed; applied to filters.search on submit

  // Filter options — this page's own calls to the other modules
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [areOptionsLoaded, setAreOptionsLoaded] = useState(false)

  const [deactivatingProduct, setDeactivatingProduct] = useState(null) // the row waiting for confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page or filters change quickly
    async function load() {
      try {
        const data = await getProducts(page, filters)
        if (ignore) return
        // e.g. the last product of the last page was deactivated while filtering by «متاح»
        if (data.items.length === 0 && page > data.last_page) {
          setPage(data.last_page)
          return
        }
        setProducts(data.items)
        setLastPage(data.last_page)
        setTotal(data.total)
        setError('')
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err))
      } finally {
        if (!ignore) {
          setIsLoading(false)
          setIsFetching(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [page, filters, reloadKey])

  // If the options fail, the selects only show «الكل» and the row warnings stay hidden
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
          setAreOptionsLoaded(true)
        }
      } catch {
        // the products list still works without the options
      }
    }
    loadOptions()
    return () => {
      ignore = true
    }
  }, [])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  // Any filter change goes back to page 1
  function changeFilter(name, value) {
    const newFilters = { ...filters, [name]: value }
    if (name === 'category_id') newFilters.subcategory_id = '' // the old sub-category may not belong to it
    setFilters(newFilters)
    setPage(1)
    setIsFetching(true)
  }

  // Search runs on Enter / the «بحث» button, not on every keystroke
  function handleSearchSubmit(event) {
    event.preventDefault()
    changeFilter('search', searchInput.trim())
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
    setSearchInput('')
    setPage(1)
    setIsFetching(true)
  }

  function handlePageChange(newPage) {
    setPage(newPage)
    setIsFetching(true)
  }

  async function handleDeactivate() {
    setBusyId(deactivatingProduct.id)
    try {
      await deactivateProduct(deactivatingProduct.id)
      toast.success('تم إيقاف المنتج')
      setDeactivatingProduct(null)
      setIsFetching(true)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Activating isn't destructive, so no confirm dialog
  async function handleActivate(product) {
    setBusyId(product.id)
    try {
      await activateProduct(product.id)
      toast.success('تم تفعيل المنتج')
      setIsFetching(true)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  // With a category chosen, only its sub-categories make sense in the sub-category filter
  const subCategoryOptions = filters.category_id
    ? subCategories.filter((subCategory) => String(subCategory.category_id) === filters.category_id)
    : subCategories

  const addButton = (
    <Button onClick={() => navigate('/products/new')}>
      <Plus size={18} />
      إضافة منتج
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (products.length === 0) {
      return hasActiveFilters ? (
        <EmptyState message="لا توجد نتائج مطابقة" />
      ) : (
        <EmptyState message="لا توجد منتجات بعد">{addButton}</EmptyState>
      )
    }

    return (
      <div className="space-y-4">
        <ProductTable
          products={products}
          subCategories={subCategories}
          brands={brands}
          areOptionsLoaded={areOptionsLoaded}
          busyId={busyId}
          onDeactivate={setDeactivatingProduct}
          onActivate={handleActivate}
        />
        <Pagination page={page} lastPage={lastPage} total={total} onPageChange={handlePageChange} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="المنتجات" description="إدارة المنتجات وأسعارها وظهورها في التطبيق">
        {addButton}
      </PageHeader>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 sm:w-96">
            <TextInput
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ابحث باسم المنتج أو العلامة التجارية"
              aria-label="بحث باسم المنتج أو العلامة التجارية"
            />
            <Button type="submit" variant="secondary">
              <Search size={18} />
              بحث
            </Button>
          </form>
          {hasActiveFilters && (
            <Button variant="secondary" onClick={handleClearFilters}>
              مسح الفلاتر
            </Button>
          )}
          {isFetching && <p className="text-xs text-text-muted">جاري تحميل البيانات...</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="القسم الرئيسي">
            <Select value={filters.category_id} onChange={(event) => changeFilter('category_id', event.target.value)}>
              <option value="">الكل</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_hidden && ' (مخفي)'}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="القسم الفرعي">
            <Select
              value={filters.subcategory_id}
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
            <Select value={filters.brand_id} onChange={(event) => changeFilter('brand_id', event.target.value)}>
              <option value="">الكل</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="الحالة">
            <Select
              value={filters.is_available}
              onChange={(event) => changeFilter('is_available', event.target.value)}
            >
              <option value="">الكل</option>
              <option value="true">متاح</option>
              <option value="false">غير متاح</option>
            </Select>
          </FormField>
        </div>
      </div>

      {renderContent()}

      {deactivatingProduct && (
        <ConfirmDialog
          title="إيقاف المنتج"
          message="سيتوقف ظهور المنتج للعملاء ولن يمكن إضافته إلى السلة، ويمكنك تفعيله لاحقاً."
          confirmLabel="إيقاف"
          variant="danger"
          isLoading={busyId === deactivatingProduct.id}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivatingProduct(null)}
        />
      )}
    </div>
  )
}

export default Products
