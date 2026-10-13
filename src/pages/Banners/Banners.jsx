import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { ImageIcon, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Select from '../../components/Select'
import { getErrorMessage } from '../../utils/errors'
import { getImageUrl } from '../../utils/images'
import { deleteBanner, getBanners, setBannerActive } from './banners.api'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function Banners() {
  const navigate = useNavigate()

  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after activate / deactivate / delete

  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'

  const [deletingBanner, setDeletingBanner] = useState(null) // the row waiting for delete confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const data = await getBanners()
        if (!ignore) {
          setBanners(data)
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

  // Deactivating is reversible and keeps the images, so no confirm dialog either way
  async function handleToggleActive(banner) {
    setBusyId(banner.id)
    try {
      await setBannerActive(banner.id, !banner.is_active)
      toast.success(banner.is_active ? 'تم إيقاف البنر' : 'تم تفعيل البنر')
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    setBusyId(deletingBanner.id)
    try {
      await deleteBanner(deletingBanner.id)
      toast.success('تم حذف البنر')
      setDeletingBanner(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so filtering happens here
  const filteredBanners = banners.filter((banner) => {
    if (statusFilter === 'active') return banner.is_active
    if (statusFilter === 'inactive') return !banner.is_active
    return true
  })

  const addButton = (
    <Button onClick={() => navigate('/banners/new')}>
      <Plus size={18} />
      إضافة بنر
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (banners.length === 0) return <EmptyState message="لا توجد بنرات بعد">{addButton}</EmptyState>

    return (
      <>
        <div className="sm:w-44">
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="تصفية حسب الحالة"
          >
            <option value="all">الكل</option>
            <option value="active">مفعّل</option>
            <option value="inactive">متوقف</option>
          </Select>
        </div>

        {filteredBanners.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الصورة</th>
                  <th className="px-4 py-3 text-start font-medium">العنوان</th>
                  <th className="px-4 py-3 text-start font-medium">عدد الصور</th>
                  <th className="px-4 py-3 text-start font-medium">ترتيب العرض</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((banner) => {
                  const imageUrl = getImageUrl(banner.images[0]?.image_url)
                  const isBusy = busyId === banner.id

                  return (
                    <tr
                      key={banner.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-10 w-24 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-24 items-center justify-center rounded-md bg-background text-text-muted">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {banner.title ? (
                            <span className="font-medium text-text">{banner.title}</span>
                          ) : (
                            <span className="text-text-muted">بدون عنوان</span>
                          )}
                          {/* A banner with no images shows nothing in the app */}
                          {banner.images.length === 0 && <Badge variant="warning">بدون صور</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{banner.images.length}</td>
                      <td className="px-4 py-3 text-text-secondary">{banner.sort_order}</td>
                      <td className="px-4 py-3">
                        {banner.is_active ? (
                          <Badge variant="success">مفعّل</Badge>
                        ) : (
                          <Badge variant="neutral">متوقف</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/banners/${banner.id}/edit`)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          {banner.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(banner)}
                              disabled={isBusy}
                              aria-label="إيقاف"
                              title="إيقاف"
                              className={iconButtonClass}
                            >
                              <PowerOff size={18} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(banner)}
                              disabled={isBusy}
                              aria-label="تفعيل"
                              title="تفعيل"
                              className={iconButtonClass}
                            >
                              <Power size={18} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingBanner(banner)}
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
      <PageHeader title="البنرات" description="إدارة البنرات الإعلانية في الصفحة الرئيسية للتطبيق">
        {addButton}
      </PageHeader>

      {renderContent()}

      {/* HARD delete on the backend: no restore. «إيقاف» is the reversible way to hide a banner */}
      {deletingBanner && (
        <ConfirmDialog
          title="حذف البنر نهائياً"
          message="سيتم حذف البنر وكل صوره نهائياً ولا يمكن التراجع. لإخفائه مؤقتاً استخدم «إيقاف» بدلاً من الحذف."
          confirmLabel="حذف نهائياً"
          variant="danger"
          isLoading={busyId === deletingBanner.id}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBanner(null)}
        />
      )}
    </div>
  )
}

export default Banners
