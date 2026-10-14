import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronRight, Printer } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { ORDER_STATUS } from '../../constants/orders'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime, formatPrice } from '../../utils/format'
import { getOrder } from './orders.api'
import OrderPaymentCard from './OrderPaymentCard'
import OrderPrintSheet from './OrderPrintSheet'
import OrderStatusCard from './OrderStatusCard'

const cardClass = 'rounded-lg border border-border bg-surface p-5'
const cardTitleClass = 'mb-4 text-base font-semibold text-text'

function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after a status / payment change

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getOrder(id)
        if (!ignore) {
          setOrder(data)
          setError('')
        }
      } catch (err) {
        // A non-numeric id is a 400 here, not a 404
        if (!ignore) setError(getErrorMessage(err, { 400: 'الطلب غير موجود', 404: 'الطلب غير موجود' }))
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

  // The PATCH responses lack `coupon` and `user.status`, so refetch the full order.
  // No setIsLoading here: the current data stays on screen while it refreshes
  function handleChanged() {
    setReloadKey(reloadKey + 1)
  }

  const title = order ? (
    <span className="flex flex-wrap items-center gap-2">
      طلب #{order.id}
      <Badge variant={ORDER_STATUS[order.status].variant}>{ORDER_STATUS[order.status].label}</Badge>
    </span>
  ) : (
    'تفاصيل الطلب'
  )

  const hasLocation = order && order.delivery_lat && order.delivery_lng

  function renderBody() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />

    return (
      <>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <OrderStatusCard order={order} onChanged={handleChanged} />
          <OrderPaymentCard order={order} onChanged={handleChanged} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className={cardClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text">العميل</h2>
              <Link to={`/customers/${order.user.id}`} className="text-sm text-primary hover:underline">
                صفحة العميل
              </Link>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">الاسم</dt>
                <dd className="flex flex-wrap items-center gap-2 text-sm text-text">
                  {order.user.name}
                  {order.user.status === 'BANNED' && <Badge variant="error">العميل محظور</Badge>}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">اسم المحل</dt>
                <dd className="text-sm text-text">{order.user.shop_name || '—'}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">الهاتف</dt>
                <dd className="text-sm text-text">
                  <span dir="ltr">{order.user.phone}</span>
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">البريد الإلكتروني</dt>
                <dd className="text-sm text-text">
                  {order.user.email ? <span dir="ltr">{order.user.email}</span> : '—'}
                </dd>
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-sm text-text-secondary">العنوان</dt>
                <dd className="text-sm text-text">{order.user.address || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>التوصيل</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-sm text-text-secondary">عنوان التوصيل</dt>
                <dd className="text-sm text-text">{order.delivery_address}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">المنطقة</dt>
                <dd className="text-sm text-text">{order.shippingZone?.name || '—'}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-sm text-text-secondary">الموقع</dt>
                <dd className="text-sm text-text">
                  {hasLocation ? (
                    <a
                      href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
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
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-sm text-text-secondary">ملاحظات العميل</dt>
                <dd className="text-sm text-text">{order.delivery_notes || 'لا توجد ملاحظات'}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 text-base font-semibold text-text">المنتجات</h2>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">المنتج</th>
                  <th className="px-4 py-3 text-start font-medium">الوحدة</th>
                  <th className="px-4 py-3 text-start font-medium">الكمية</th>
                  <th className="px-4 py-3 text-start font-medium">سعر الوحدة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border-light text-sm last:border-b-0 hover:bg-background">
                    {/* product_name is a snapshot from the order time — the product may have been renamed since */}
                    <td className="px-4 py-3">
                      <Link to={`/products/${item.product_id}/edit`} className="font-medium text-primary hover:underline">
                        {item.product_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.product_unit}</td>
                    <td className="px-4 py-3 text-text">{item.quantity}</td>
                    <td className="px-4 py-3 text-text">{formatPrice(item.unit_price)}</td>
                    <td className="px-4 py-3 text-text">{formatPrice(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Order money is already whole numbers from the backend — displayed only, never recalculated */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>الحساب</h2>
          <dl className="grid gap-3 text-sm sm:max-w-md">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">المجموع</dt>
              <dd className="text-text">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">
                الخصم
                {order.coupon && (
                  <span className="ms-2 text-xs text-text-muted">
                    كوبون {order.coupon.code} ({order.coupon.discount_value}%)
                  </span>
                )}
              </dt>
              <dd className="text-text">- {formatPrice(order.discount_amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">التوصيل</dt>
              <dd className="text-text">{order.shipping_fee === 0 ? 'مجاني' : formatPrice(order.shipping_fee)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="font-bold text-text">الإجمالي</dt>
              <dd className="font-bold text-text">{formatPrice(order.total_amount)}</dd>
            </div>
          </dl>
        </section>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6 print:hidden">
        <PageHeader title={title} description={order ? formatDateTime(order.created_at) : undefined}>
          <Button variant="secondary" onClick={() => window.print()} disabled={!order || Boolean(error)}>
            <Printer size={18} />
            طباعة الطلب
          </Button>
          <Button variant="secondary" onClick={() => navigate('/orders')}>
            <ChevronRight size={18} />
            رجوع للطلبات
          </Button>
        </PageHeader>

        {renderBody()}
      </div>

      {order && !error && <OrderPrintSheet order={order} />}
    </>
  )
}

export default OrderDetails
