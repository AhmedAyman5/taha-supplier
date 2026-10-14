import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import toast from 'react-hot-toast'
import { ChevronRight } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { ORDER_STATUS } from '../../constants/orders'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatDateTime, formatPrice } from '../../utils/format'
import BanCustomerModal from './BanCustomerModal'
import { getCustomer, unbanCustomer } from './customers.api'

const cardClass = 'rounded-lg border border-border bg-surface p-5'
const cardTitleClass = 'mb-4 text-base font-semibold text-text'

function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to retry

  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [isUnbanConfirmOpen, setIsUnbanConfirmOpen] = useState(false)
  const [isUnbanning, setIsUnbanning] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getCustomer(id)
        if (!ignore) {
          setCustomer(data)
          setError('')
        }
      } catch (err) {
        // A non-numeric id is a 400 here, not a 404. An admin's id is a 404 too (clients only)
        if (!ignore) setError(getErrorMessage(err, { 400: 'العميل غير موجود', 404: 'العميل غير موجود' }))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [id, reloadKey])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  // The PATCH returns the full updated customer, so the page updates without another request
  function handleBanned(updatedCustomer) {
    setCustomer(updatedCustomer)
    setIsBanModalOpen(false)
  }

  async function handleUnban() {
    setIsUnbanning(true)
    try {
      const data = await unbanCustomer(customer.id)
      setCustomer(data)
      toast.success('تم إلغاء حظر العميل')
      setIsUnbanConfirmOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err, { 404: 'العميل غير موجود' }))
    } finally {
      setIsUnbanning(false)
    }
  }

  const isBanned = customer?.status === 'BANNED'
  const hasLocation = customer && customer.latitude !== null && customer.longitude !== null

  const title = customer ? (
    <span className="flex flex-wrap items-center gap-2">
      {customer.name}
      {isBanned ? <Badge variant="error">محظور</Badge> : <Badge variant="success">نشط</Badge>}
    </span>
  ) : (
    'تفاصيل العميل'
  )

  function renderBody() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />

    return (
      <>
        <section className={cardClass}>
          <h2 className={cardTitleClass}>بيانات العميل</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">اسم المحل</dt>
              <dd className="text-sm text-text">{customer.shop_name || '—'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">الهاتف</dt>
              {/* dir="ltr": otherwise "+2010…" shows as "…2010+" in RTL */}
              <dd className="text-sm text-text">
                <span dir="ltr">{customer.phone}</span>
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">البريد الإلكتروني</dt>
              <dd className="text-sm text-text">{customer.email ? <span dir="ltr">{customer.email}</span> : '—'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">العنوان</dt>
              <dd className="text-sm text-text">{customer.address || '—'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">تاريخ التسجيل</dt>
              <dd className="text-sm text-text">{formatDate(customer.created_at)}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-text-secondary">الموقع</dt>
              <dd className="text-sm text-text">
                {hasLocation ? (
                  <a
                    href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    فتح الموقع على الخريطة
                  </a>
                ) : (
                  'غير محدد'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>الطلبات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-text-secondary">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-text">{customer.orders_count}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-text-secondary">الطلبات الملغاة</p>
              <p className="text-2xl font-bold text-text">{customer.cancelled_orders_count}</p>
              <p className="text-xs text-text-muted">تشمل الملغاة من الإدارة ومن العميل</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">آخر الطلبات</h2>
              <p className="text-xs text-text-muted">يتم عرض آخر 10 طلبات فقط</p>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/orders?user_id=${customer.id}`)}>
              عرض كل طلبات العميل
            </Button>
          </div>
          {customer.orders.length === 0 ? (
            <p className="p-5 text-center text-sm text-text-secondary">لا توجد طلبات لهذا العميل بعد</p>
          ) : (
            // No payment_status here: this endpoint has no payment_method, and CASH orders stay PENDING
            // forever, so it would mislead
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="bg-background text-xs font-medium text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                    <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                    <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/orders/${order.id}`} className="text-primary hover:underline">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ORDER_STATUS[order.status].variant}>{ORDER_STATUS[order.status].label}</Badge>
                      </td>
                      {/* Already a whole number here (not a Decimal string) */}
                      <td className="px-4 py-3 text-text">{formatPrice(order.total_amount)}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDateTime(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>حالة الحساب</h2>
          {isBanned ? (
            <div className="grid gap-4">
              <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                سبب الحظر: {customer.block_reason}
              </p>
              <div>
                <Button onClick={() => setIsUnbanConfirmOpen(true)} disabled={isUnbanning}>
                  إلغاء الحظر
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">الحساب نشط ويمكن للعميل استخدام التطبيق</p>
              <Button variant="danger" onClick={() => setIsBanModalOpen(true)}>
                حظر العميل
              </Button>
            </div>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={customer?.shop_name}>
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          <ChevronRight size={18} />
          رجوع للعملاء
        </Button>
      </PageHeader>

      {renderBody()}

      {isBanModalOpen && (
        <BanCustomerModal
          customerId={customer.id}
          onClose={() => setIsBanModalOpen(false)}
          onBanned={handleBanned}
        />
      )}

      {isUnbanConfirmOpen && (
        <ConfirmDialog
          title="إلغاء حظر العميل"
          message="سيتمكن العميل من تسجيل الدخول مرة أخرى، وسيتم حذف سبب الحظر نهائياً."
          confirmLabel="إلغاء الحظر"
          variant="primary"
          isLoading={isUnbanning}
          onConfirm={handleUnban}
          onCancel={() => setIsUnbanConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default CustomerDetails
