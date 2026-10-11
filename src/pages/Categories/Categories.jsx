import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ImageIcon, Pencil, Plus } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import { getCategories, hideCategory, showCategory } from './categories.api'
import CategoryForm from './CategoryForm'

const selectClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function Categories() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / hide / show

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'visible' | 'hidden'

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null) // null = the form creates a new one
  const [hidingCategory, setHidingCategory] = useState(null) // the row waiting for hide confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const data = await getCategories()
        if (!ignore) {
          setCategories(data)
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
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    setReloadKey(reloadKey + 1)
  }

  async function handleHide() {
    setBusyId(hidingCategory.id)
    try {
      await hideCategory(hidingCategory.id)
      toast.success('تم إخفاء القسم')
      setHidingCategory(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Showing isn't destructive, so no confirm dialog
  async function handleShow(category) {
    setBusyId(category.id)
    try {
      await showCategory(category.id)
      toast.success('تم إظهار القسم')
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so search and filter happen here
  const query = search.trim().toLowerCase()
  const filteredCategories = categories.filter((category) => {
    if (statusFilter === 'visible' && category.is_hidden) return false
    if (statusFilter === 'hidden' && !category.is_hidden) return false
    return category.name.toLowerCase().includes(query)
  })

  const addButton = (
    <Button onClick={openCreateForm}>
      <Plus size={18} />
      إضافة قسم
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (categories.length === 0) return <EmptyState message="لا توجد أقسام بعد">{addButton}</EmptyState>

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-72">
            <TextInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث باسم القسم..."
              aria-label="بحث باسم القسم"
            />
          </div>
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="تصفية حسب الحالة"
              className={selectClass}
            >
              <option value="all">الكل</option>
              <option value="visible">ظاهر</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الصورة</th>
                  <th className="px-4 py-3 text-start font-medium">الاسم</th>
                  <th className="px-4 py-3 text-start font-medium">ترتيب العرض</th>
                  <th className="px-4 py-3 text-start font-medium">الأقسام الفرعية</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const imageUrl = getImageUrl(category.image)
                  const isBusy = busyId === category.id

                  return (
                    <tr
                      key={category.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-text-muted">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{category.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{category.display_order}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {category.subcategories?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {category.is_hidden ? (
                          <Badge variant="neutral">مخفي</Badge>
                        ) : (
                          <Badge variant="success">ظاهر</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(category)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          {category.is_hidden ? (
                            <button
                              type="button"
                              onClick={() => handleShow(category)}
                              disabled={isBusy}
                              aria-label="إظهار"
                              title="إظهار"
                              className={iconButtonClass}
                            >
                              <Eye size={18} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setHidingCategory(category)}
                              disabled={isBusy}
                              aria-label="إخفاء"
                              title="إخفاء"
                              className={iconButtonClass}
                            >
                              <EyeOff size={18} />
                            </button>
                          )}
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
        title="الأقسام الرئيسية"
        description="إدارة الأقسام الرئيسية التي تظهر في تطبيق العملاء"
      >
        {addButton}
      </PageHeader>

      {renderContent()}

      {isFormOpen && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {hidingCategory && (
        <ConfirmDialog
          title="إخفاء القسم"
          message="سيتم إخفاء القسم وكل منتجاته من التطبيق، ويمكنك إظهاره لاحقاً."
          confirmLabel="إخفاء"
          variant="danger"
          isLoading={busyId === hidingCategory.id}
          onConfirm={handleHide}
          onCancel={() => setHidingCategory(null)}
        />
      )}
    </div>
  )
}

export default Categories
