import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Power, PowerOff } from 'lucide-react'
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
import { formatDate, formatPrice } from '../../utils/format'
import { getCoupons, setCouponStatus } from './coupons.api'
import CouponForm from './CouponForm'

const COUPON_STATES = {
  paused: { label: 'متوقف مؤقتاً', variant: 'neutral' },
  expired: { label: 'منتهي', variant: 'error' },
  scheduled: { label: 'مجدول', variant: 'info' },
  exhausted: { label: 'مستنفد', variant: 'warning' },
  active: { label: 'نشط', variant: 'success' },
}

// The backend has only ACTIVE / PAUSED — the displayed state is computed here, in this order
// (admin.coupon.txt §3)
function getCouponState(coupon) {
  const now = new Date()
  if (coupon.status === 'PAUSED') return 'paused'
  if (coupon.end_date && now > new Date(coupon.end_date)) return 'expired'
  if (coupon.start_date && now < new Date(coupon.start_date)) return 'scheduled'
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return 'exhausted'
  return 'active'
}

function formatValidity(coupon) {
  const { start_date: start, end_date: end } = coupon
  if (start && end) return `من ${formatDate(start)} إلى ${formatDate(end)}`
  if (start) return `من ${formatDate(start)}`
  if (end) return `حتى ${formatDate(end)}`
  return 'مفتوحة'
}

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / pause / activate

  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('all') // 'all' or a key of COUPON_STATES

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null) // null = the form creates a new one
  const [pausingCoupon, setPausingCoupon] = useState(null) // the row waiting for pause confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const data = await getCoupons()
        if (!ignore) {
          setCoupons(data)
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
    setEditingCoupon(null)
    setIsFormOpen(true)
  }

  function openEditForm(coupon) {
    setEditingCoupon(coupon)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    setReloadKey(reloadKey + 1)
  }

  async function handlePause() {
    setBusyId(pausingCoupon.id)
    try {
      await setCouponStatus(pausingCoupon.id, 'PAUSED')
      toast.success('تم إيقاف الكوبون')
      setPausingCoupon(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Activating isn't destructive, so no confirm dialog
  async function handleActivate(coupon) {
    setBusyId(coupon.id)
    try {
      await setCouponStatus(coupon.id, 'ACTIVE')
      // An ACTIVE coupon whose end date has passed is still unusable — tell the admin why
      const isExpired = coupon.end_date && new Date() > new Date(coupon.end_date)
      toast.success(
        isExpired ? 'تم التفعيل، لكن الكوبون منتهي — عدّل تاريخ الانتهاء لإعادة تشغيله' : 'تم تفعيل الكوبون',
      )
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so search and filter happen here
  const query = search.trim().toUpperCase()
  const filteredCoupons = coupons.filter((coupon) => {
    if (stateFilter !== 'all' && getCouponState(coupon) !== stateFilter) return false
    return coupon.code.toUpperCase().includes(query)
  })

  const addButton = (
    <Button onClick={openCreateForm}>
      <Plus size={18} />
      إضافة كوبون
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (coupons.length === 0) return <EmptyState message="لا توجد كوبونات بعد">{addButton}</EmptyState>

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-72">
            <TextInput
              type="search"
              dir="ltr"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالكود..."
              aria-label="بحث بالكود"
            />
          </div>
          <div className="sm:w-44">
            <Select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              aria-label="تصفية حسب الحالة"
            >
              <option value="all">الكل</option>
              {Object.entries(COUPON_STATES).map(([key, state]) => (
                <option key={key} value={key}>
                  {state.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filteredCoupons.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الكود</th>
                  <th className="px-4 py-3 text-start font-medium">الخصم</th>
                  <th className="px-4 py-3 text-start font-medium">الحد الأدنى للطلب</th>
                  <th className="px-4 py-3 text-start font-medium">الصلاحية</th>
                  <th className="px-4 py-3 text-start font-medium">الاستخدام</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const isBusy = busyId === coupon.id
                  const state = COUPON_STATES[getCouponState(coupon)]

                  return (
                    <tr
                      key={coupon.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3 font-semibold text-text">
                        <span dir="ltr">{coupon.code}</span>
                      </td>
                      {/* discount_value and min_order_amount are Decimal strings from the backend */}
                      <td className="px-4 py-3 text-text">{Number(coupon.discount_value)}%</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {coupon.min_order_amount === null
                          ? 'بدون حد أدنى'
                          : formatPrice(Number(coupon.min_order_amount))}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatValidity(coupon)}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {coupon.usage_limit === null
                          ? `${coupon.usage_count} — غير محدود`
                          : `${coupon.usage_count} من ${coupon.usage_limit}`}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(coupon)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          {coupon.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => setPausingCoupon(coupon)}
                              disabled={isBusy}
                              aria-label="إيقاف مؤقت"
                              title="إيقاف مؤقت"
                              className={iconButtonClass}
                            >
                              <PowerOff size={18} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(coupon)}
                              disabled={isBusy}
                              aria-label="تفعيل"
                              title="تفعيل"
                              className={iconButtonClass}
                            >
                              <Power size={18} />
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
      <PageHeader title="الكوبونات" description="إدارة كوبونات الخصم بالنسبة المئوية">
        {addButton}
      </PageHeader>

      {renderContent()}

      {isFormOpen && (
        <CouponForm
          coupon={editingCoupon}
          coupons={coupons}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {pausingCoupon && (
        <ConfirmDialog
          title="إيقاف الكوبون مؤقتاً"
          message="لن يتمكن العملاء من استخدام الكوبون حتى تعيد تفعيله."
          confirmLabel="إيقاف مؤقت"
          variant="danger"
          isLoading={busyId === pausingCoupon.id}
          onConfirm={handlePause}
          onCancel={() => setPausingCoupon(null)}
        />
      )}
    </div>
  )
}

export default Coupons
