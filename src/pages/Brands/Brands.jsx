import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getImageUrl } from '../../utils/images'
import { deleteBrand, getBrands, getSubCategoryOptions } from './brands.api'
import BrandForm from './BrandForm'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function Brands() {
  const [brands, setBrands] = useState([])
  const [subCategories, setSubCategories] = useState([]) // options for the form's sub-category picker
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / delete

  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null) // null = the form creates a new one
  const [deletingBrand, setDeletingBrand] = useState(null) // the row waiting for delete confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const [brandsData, subCategoriesData] = await Promise.all([
          getBrands(),
          getSubCategoryOptions(),
        ])
        if (!ignore) {
          setBrands(brandsData)
          setSubCategories(subCategoriesData)
          setError('')
        }
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  function openCreateForm() {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  function openEditForm(brand) {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    setReloadKey(reloadKey + 1)
  }

  async function handleDelete() {
    setBusyId(deletingBrand.id)
    try {
      await deleteBrand(deletingBrand.id)
      toast.success('تم حذف العلامة التجارية')
      setDeletingBrand(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so search happens here
  const query = search.trim().toLowerCase()
  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(query))

  const addButton = (
    <Button onClick={openCreateForm}>
      <Plus size={18} />
      إضافة علامة تجارية
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (brands.length === 0) {
      return <EmptyState message="لا توجد علامات تجارية بعد">{addButton}</EmptyState>
    }

    return (
      <>
        <div className="sm:w-72">
          <TextInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="بحث باسم العلامة التجارية..."
            aria-label="بحث باسم العلامة التجارية"
          />
        </div>

        {filteredBrands.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الشعار</th>
                  <th className="px-4 py-3 text-start font-medium">الاسم</th>
                  <th className="px-4 py-3 text-start font-medium">تاريخ الإضافة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => {
                  const isBusy = busyId === brand.id

                  return (
                    <tr
                      key={brand.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3">
                        {/* object-contain: logos must not be cropped */}
                        <img
                          src={getImageUrl(brand.logo)}
                          alt=""
                          className="h-10 w-10 rounded-md border border-border bg-surface object-contain"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{brand.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(brand.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(brand)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBrand(brand)}
                            disabled={isBusy}
                            aria-label="حذف"
                            title="حذف"
                            className={iconButtonClass}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="العلامات التجارية"
        description="إدارة العلامات التجارية وربطها بالأقسام الفرعية"
      >
        {addButton}
      </PageHeader>

      {renderContent()}

      {isFormOpen && (
        <BrandForm
          brand={editingBrand}
          brands={brands}
          subCategories={subCategories}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Backend gotchas: no restore endpoint, and the brand's products are NOT touched by the delete */}
      {deletingBrand && (
        <ConfirmDialog
          title="حذف العلامة التجارية"
          message={`سيتم حذف «${deletingBrand.name}» نهائياً ولا يمكن استرجاعها من لوحة التحكم. منتجات هذه العلامة لن تُحذف وستظل ظاهرة في التطبيق، لذلك انقلها لعلامة أخرى أو أوقفها أولاً.`}
          confirmLabel="حذف نهائياً"
          variant="danger"
          isLoading={busyId === deletingBrand.id}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBrand(null)}
        />
      )}
    </div>
  )
}

export default Brands
