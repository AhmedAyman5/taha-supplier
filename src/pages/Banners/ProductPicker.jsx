import { useEffect, useState } from 'react'
import { ImageIcon, Search } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import { getProduct, searchProducts } from './banners.api'

function renderThumbnail(product) {
  const imageUrl = getImageUrl(product.image)
  return imageUrl ? (
    <img src={imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md border border-border object-cover" />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-text-muted">
      <ImageIcon size={18} />
    </div>
  )
}

// value = the chosen product id ('' = none). onChange(id) gives the parent the new id
function ProductPicker({ value, onChange, error }) {
  const [selectedProduct, setSelectedProduct] = useState(null) // the product shown as chosen
  const [loadFailed, setLoadFailed] = useState(false)
  const [isChanging, setIsChanging] = useState(false) // «تغيير» opens the search again

  const [search, setSearch] = useState('')
  const [results, setResults] = useState(null) // null = no search yet
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Edit: the saved target is only an id — load the product to show its name.
  // After a pick the ids already match, so nothing is loaded again
  const selectedId = selectedProduct ? String(selectedProduct.id) : ''
  useEffect(() => {
    if (!value || value === selectedId) return
    let ignore = false
    async function load() {
      try {
        const product = await getProduct(value)
        if (!ignore) setSelectedProduct(product)
      } catch {
        if (!ignore) setLoadFailed(true)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [value, selectedId])

  async function handleSearch() {
    setIsSearching(true)
    setSearchError('')
    try {
      const data = await searchProducts(search.trim())
      setResults(data.items)
    } catch (err) {
      setSearchError(getErrorMessage(err))
    } finally {
      setIsSearching(false)
    }
  }

  // The picker sits inside the banner <form>: Enter must search here, not submit the whole form
  function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  function handlePick(product) {
    setSelectedProduct(product)
    setLoadFailed(false)
    setIsChanging(false)
    setResults(null)
    setSearch('')
    onChange(String(product.id))
  }

  if (value && !isChanging) {
    return (
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-text">المنتج</span>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
          {selectedProduct ? (
            <div className="flex min-w-0 items-center gap-3">
              {renderThumbnail(selectedProduct)}
              <span className="truncate text-sm font-medium text-text">{selectedProduct.name}</span>
            </div>
          ) : (
            <span className="text-sm text-text-muted">
              {loadFailed ? 'تعذر تحميل بيانات المنتج' : 'جاري تحميل البيانات...'}
            </span>
          )}
          <Button variant="secondary" onClick={() => setIsChanging(true)}>
            تغيير
          </Button>
        </div>
        {selectedProduct && !selectedProduct.is_available && (
          <p className="text-xs text-warning">هذا المنتج غير متاح حالياً</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-text">المنتج</span>
      <div className="flex gap-2">
        <TextInput
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="ابحث باسم المنتج أو العلامة التجارية"
          aria-label="بحث عن منتج"
          hasError={Boolean(error)}
        />
        <Button variant="secondary" onClick={handleSearch} disabled={isSearching}>
          <Search size={18} />
          بحث
        </Button>
        {value && (
          <Button variant="secondary" onClick={() => setIsChanging(false)}>
            إلغاء
          </Button>
        )}
      </div>

      {isSearching && <p className="text-xs text-text-muted">جاري تحميل البيانات...</p>}
      {searchError && <p className="text-xs text-error">{searchError}</p>}
      {!isSearching && results?.length === 0 && <p className="text-xs text-text-muted">لا توجد نتائج مطابقة</p>}

      {results?.length > 0 && (
        <ul className="divide-y divide-border-light rounded-md border border-border">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => handlePick(product)}
                className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm text-text transition-colors duration-150 hover:bg-background"
              >
                {renderThumbnail(product)}
                <span className="truncate">{product.name}</span>
                {!product.is_available && <Badge variant="neutral">غير متاح</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

export default ProductPicker
