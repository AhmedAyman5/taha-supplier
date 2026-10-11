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
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import {
  getCategoryOptions,
  getSubCategories,
  hideSubCategory,
  showSubCategory,
} from './subCategories.api'
import SubCategoryForm from './SubCategoryForm'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function SubCategories() {
  const [subCategories, setSubCategories] = useState([])
  const [categories, setCategories] = useState([]) // options for the category filter and the form
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / hide / show

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' or a category id (as a string)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'visible' | 'hidden'

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubCategory, setEditingSubCategory] = useState(null) // null = the form creates a new one
  const [hidingSubCategory, setHidingSubCategory] = useState(null) // the row waiting for hide confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const [subCategoriesData, categoriesData] = await Promise.all([
          getSubCategories(),
          getCategoryOptions(),
        ])
        if (!ignore) {
          setSubCategories(subCategoriesData)
          setCategories(categoriesData)
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
    setEditingSubCategory(null)
    setIsFormOpen(true)
  }

  function openEditForm(subCategory) {
    setEditingSubCategory(subCategory)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    setReloadKey(reloadKey + 1)
  }

  async function handleHide() {
    setBusyId(hidingSubCategory.id)
    try {
      await hideSubCategory(hidingSubCategory.id)
      toast.success('تم إخفاء القسم الفرعي')
      setHidingSubCategory(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Showing isn't destructive, so no confirm dialog
  async function handleShow(subCategory) {
    setBusyId(subCategory.id)
    try {
      await showSubCategory(subCategory.id)
      toast.success('تم إظهار القسم الفرعي')
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so search, filter and sort happen here
  const query = search.trim().toLowerCase()
  const filteredSubCategories = subCategories.filter((subCategory) => {
    if (categoryFilter !== 'all' && String(subCategory.category_id) !== categoryFilter) return false
    if (statusFilter === 'visible' && subCategory.is_hidden) return false
    if (statusFilter === 'hidden' && !subCategory.is_hidden) return false
    return subCategory.name.toLowerCase().includes(query)
  })

  // Group rows like the app shows them: by the parent's display_order, then the sub-category's own.
  // category_id breaks ties so two parents with the same display_order don't get mixed together
  const categoryOrder = {}
  categories.forEach((category) => {
    categoryOrder[category.id] = category.display_order
  })
  const sortedSubCategories = [...filteredSubCategories].sort(
    (a, b) =>
      categoryOrder[a.category_id] - categoryOrder[b.category_id] ||
      a.category_id - b.category_id ||
      a.display_order - b.display_order,
  )

  const addButton = (
    <Button onClick={openCreateForm}>
      <Plus size={18} />
      إضافة قسم فرعي
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (subCategories.length === 0) {
      return <EmptyState message="لا توجد أقسام فرعية بعد">{addButton}</EmptyState>
    }

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-72">
            <TextInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث باسم القسم الفرعي..."
              aria-label="بحث باسم القسم الفرعي"
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="تصفية حسب القسم الرئيسي"
            >
              <option value="all">كل الأقسام</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_hidden && ' (مخفي)'}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-40">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="تصفية حسب الحالة"
            >
              <option value="all">الكل</option>
              <option value="visible">ظاهر</option>
              <option value="hidden">مخفي</option>
            </Select>
          </div>
        </div>

        {sortedSubCategories.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الصورة</th>
                  <th className="px-4 py-3 text-start font-medium">الاسم</th>
                  <th className="px-4 py-3 text-start font-medium">القسم الرئيسي</th>
                  <th className="px-4 py-3 text-start font-medium">ترتيب العرض</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sortedSubCategories.map((subCategory) => {
                  const imageUrl = getImageUrl(subCategory.image)
                  const isBusy = busyId === subCategory.id

                  return (
                    <tr
                      key={subCategory.id}
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
                      <td className="px-4 py-3 font-medium text-text">{subCategory.name}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        <div className="flex items-center gap-2">
                          {subCategory.category.name}
                          {/* A visible sub-category under a hidden parent is still invisible in the app */}
                          {subCategory.category.is_hidden && (
                            <Badge variant="warning">القسم الرئيسي مخفي</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{subCategory.display_order}</td>
                      <td className="px-4 py-3">
                        {subCategory.is_hidden ? (
                          <Badge variant="neutral">مخفي</Badge>
                        ) : (
                          <Badge variant="success">ظاهر</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(subCategory)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          {subCategory.is_hidden ? (
                            <button
                              type="button"
                              onClick={() => handleShow(subCategory)}
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
                              onClick={() => setHidingSubCategory(subCategory)}
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
      <PageHeader title="الأقسام الفرعية" description="إدارة الأقسام الفرعية داخل كل قسم رئيسي">
        {addButton}
      </PageHeader>

      {renderContent()}

      {isFormOpen && (
        <SubCategoryForm
          subCategory={editingSubCategory}
          subCategories={subCategories}
          categories={categories}
          defaultCategoryId={categoryFilter === 'all' ? '' : categoryFilter}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {hidingSubCategory && (
        <ConfirmDialog
          title="إخفاء القسم الفرعي"
          message="سيتم إخفاء القسم الفرعي وكل منتجاته من التطبيق، ويمكنك إظهاره لاحقاً."
          confirmLabel="إخفاء"
          variant="danger"
          isLoading={busyId === hidingSubCategory.id}
          onConfirm={handleHide}
          onCancel={() => setHidingSubCategory(null)}
        />
      )}
    </div>
  )
}

export default SubCategories
