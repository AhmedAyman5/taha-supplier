import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { ORDER_STATUS } from '../../constants/orders'
import { getErrorMessage } from '../../utils/errors'
import { updateOrderStatus } from './orders.api'

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

// The backend accepts ANY status change, so the workflow lives here: one step forward at a time,
// never back, and CLIENTCANCELLED is never sent (only the customer can set it)
const NEXT_STEP = {
  PENDING: { status: 'CONFIRMED', buttonLabel: 'تأكيد الطلب' },
  CONFIRMED: { status: 'PROCESSING', buttonLabel: 'بدء التجهيز' },
  PROCESSING: { status: 'SHIPPED', buttonLabel: 'خرج للتوصيل' },
  SHIPPED: { status: 'DELIVERED', buttonLabel: 'تم التوصيل' },
}

function OrderStatusCard({ order, onChanged }) {
  // null · 'next' · 'cancel' — which confirm dialog is open
  const [confirmAction, setConfirmAction] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const isCancelled = order.status === 'CANCELLED' || order.status === 'CLIENTCANCELLED'
  const currentIndex = STEPS.indexOf(order.status) // -1 when cancelled: no step is highlighted
  const nextStep = NEXT_STEP[order.status] // undefined in the final states
  const nextLabel = nextStep ? ORDER_STATUS[nextStep.status].label : ''

  // Confirming before the receipt is approved is allowed — the admin is only warned
  const showReceiptWarning =
    order.status === 'PENDING' && order.payment_method === 'CARD' && order.payment_status !== 'APPROVED'

  async function handleConfirm() {
    const newStatus = confirmAction === 'cancel' ? 'CANCELLED' : nextStep.status
    setIsSaving(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success(confirmAction === 'cancel' ? 'تم إلغاء الطلب' : 'تم تحديث حالة الطلب')
      setConfirmAction(null)
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err, { 404: 'الطلب غير موجود' }))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-text">حالة الطلب</h2>

      {/* RTL: the first step sits on the right */}
      <ol className={`grid grid-cols-5 gap-2 ${isCancelled ? 'opacity-50' : ''}`}>
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          let circleClass = 'border border-border bg-surface text-text-muted'
          if (isDone) circleClass = 'bg-primary text-white'
          if (isCurrent) circleClass = 'bg-primary text-white ring-4 ring-primary/20'

          return (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${circleClass}`}
              >
                {isDone ? <Check size={18} /> : index + 1}
              </span>
              <span className={`text-xs ${isCurrent ? 'font-semibold text-text' : 'text-text-secondary'}`}>
                {ORDER_STATUS[step].label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-5">
        {order.status === 'DELIVERED' && <p className="text-sm text-success">تم توصيل هذا الطلب.</p>}
        {order.status === 'CANCELLED' && (
          <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">تم إلغاء الطلب من الإدارة.</p>
        )}
        {order.status === 'CLIENTCANCELLED' && (
          <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">قام العميل بإلغاء هذا الطلب.</p>
        )}
        {nextStep && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConfirmAction('next')} disabled={isSaving}>
              {nextStep.buttonLabel}
            </Button>
            <Button variant="danger" onClick={() => setConfirmAction('cancel')} disabled={isSaving}>
              إلغاء الطلب
            </Button>
          </div>
        )}
      </div>

      {confirmAction === 'next' && (
        <ConfirmDialog
          title={`تغيير حالة الطلب إلى «${nextLabel}»`}
          message={
            <>
              سيتم إرسال إشعار للعميل بالحالة الجديدة، ولا يمكن الرجوع للحالة السابقة.
              {/* a span, not a <p>: ConfirmDialog already wraps the message in a <p> */}
              {showReceiptWarning && (
                <span className="mt-2 block font-medium text-warning">
                  تنبيه: إيصال التحويل البنكي لم يتم قبوله بعد.
                </span>
              )}
            </>
          }
          confirmLabel="تأكيد"
          variant="primary"
          isLoading={isSaving}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'cancel' && (
        <ConfirmDialog
          title="إلغاء الطلب"
          message="سيتم إلغاء الطلب وإرسال إشعار للعميل. لا يمكن التراجع، ولن يتم استرجاع الكوبون المستخدم."
          confirmLabel="إلغاء الطلب نهائياً"
          isLoading={isSaving}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  )
}

export default OrderStatusCard
