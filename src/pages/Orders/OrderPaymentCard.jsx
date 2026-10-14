import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, RotateCw } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants/orders'
import { getErrorMessage } from '../../utils/errors'
import { getPaymentProof, reviewPayment } from './orders.api'

function OrderPaymentCard({ order, onChanged }) {
  const isCard = order.payment_method === 'CARD'
  // Cancelling changes only `status`, so a cancelled CARD order keeps payment PENDING — no badge, no review
  const isCancelled = order.status === 'CANCELLED' || order.status === 'CLIENTCANCELLED'

  // The receipt: no URL and no error = still loading
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptError, setReceiptError] = useState('')
  const [isReceiptMissing, setIsReceiptMissing] = useState(false)
  const [receiptReloadKey, setReceiptReloadKey] = useState(0) // bump to retry the receipt only

  // null · 'APPROVED' · 'REJECTED' — which confirm dialog is open
  const [reviewAction, setReviewAction] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isCard) return
    let ignore = false
    let objectUrl = ''
    async function loadReceipt() {
      try {
        const blob = await getPaymentProof(order.id)
        if (!ignore) {
          objectUrl = URL.createObjectURL(blob)
          setReceiptUrl(objectUrl)
        }
      } catch (err) {
        if (ignore) return
        // A CARD order always has a receipt — the 404 is only a defensive fallback
        if (err?.response?.status === 404) {
          setIsReceiptMissing(true)
          setReceiptError('لا يوجد إيصال لهذا الطلب')
        } else {
          setReceiptError('تعذر تحميل الإيصال')
        }
      }
    }
    loadReceipt()
    return () => {
      ignore = true
      // The object URL keeps the image in memory until it is revoked
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [order.id, isCard, receiptReloadKey])

  function handleReceiptRetry() {
    setReceiptUrl('')
    setReceiptError('')
    setIsReceiptMissing(false)
    setReceiptReloadKey(receiptReloadKey + 1)
  }

  async function handleConfirmReview() {
    setIsSaving(true)
    try {
      await reviewPayment(order.id, reviewAction)
      if (reviewAction === 'APPROVED') {
        // Approving does not confirm the order — remind the admin of the next step
        toast.success(order.status === 'PENDING' ? 'تم قبول الإيصال — يمكنك الآن تأكيد الطلب' : 'تم قبول الإيصال')
      } else {
        toast.success('تم رفض الإيصال')
      }
      setReviewAction(null)
      onChanged()
    } catch (err) {
      toast.error(
        getErrorMessage(err, {
          404: 'الطلب غير موجود',
          409: 'المراجعة متاحة فقط لطلبات التحويل البنكي التي بها إيصال',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  function renderReceipt() {
    if (receiptError) {
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-text-secondary">{receiptError}</p>
          {!isReceiptMissing && (
            <Button variant="secondary" onClick={handleReceiptRetry}>
              <RotateCw size={18} />
              إعادة المحاولة
            </Button>
          )}
        </div>
      )
    }
    if (!receiptUrl) {
      return (
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <LoaderCircle size={18} className="animate-spin text-primary" />
          جاري تحميل الإيصال...
        </p>
      )
    }
    return (
      <button
        type="button"
        onClick={() => window.open(receiptUrl, '_blank')}
        aria-label="عرض الإيصال بالحجم الكامل"
        className="block w-full"
      >
        <img
          src={receiptUrl}
          alt="إيصال التحويل البنكي"
          className="max-h-80 w-full rounded-md border border-border bg-background object-contain"
        />
      </button>
    )
  }

  const paymentStatus = PAYMENT_STATUS[order.payment_status]
  const canApprove = !isCancelled && order.payment_status !== 'APPROVED'
  const canReject = !isCancelled && order.payment_status !== 'REJECTED'

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-text">الدفع</h2>

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-secondary">طريقة الدفع:</span>
          <span className="font-medium text-text">{PAYMENT_METHOD[order.payment_method]}</span>
          {isCard && !isCancelled && <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>}
        </div>

        {/* CASH stays payment PENDING forever, so it gets no status and no receipt */}
        {!isCard && <p className="text-sm text-text-secondary">الدفع نقداً عند الاستلام.</p>}

        {isCard && (
          <>
            <div className="grid gap-1.5">
              <p className="text-sm font-medium text-text">إيصال التحويل</p>
              {renderReceipt()}
              <p className="text-xs text-text-muted">يظهر آخر إيصال رفعه العميل فقط</p>
            </div>

            {(canApprove || canReject) && (
              <div className="flex flex-wrap gap-2">
                {canApprove && (
                  <Button onClick={() => setReviewAction('APPROVED')} disabled={isSaving}>
                    قبول الإيصال
                  </Button>
                )}
                {canReject && (
                  <Button variant="danger" onClick={() => setReviewAction('REJECTED')} disabled={isSaving}>
                    رفض الإيصال
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {reviewAction === 'APPROVED' && (
        <ConfirmDialog
          title="قبول الإيصال"
          message="سيتم إشعار العميل بقبول الدفع. قبول الإيصال لا يؤكد الطلب تلقائياً."
          confirmLabel="قبول الإيصال"
          variant="primary"
          isLoading={isSaving}
          onConfirm={handleConfirmReview}
          onCancel={() => setReviewAction(null)}
        />
      )}

      {reviewAction === 'REJECTED' && (
        <ConfirmDialog
          title="رفض الإيصال"
          message="سيتم إشعار العميل برفض الإيصال، ويمكنه رفع إيصال جديد للمراجعة."
          confirmLabel="رفض الإيصال"
          isLoading={isSaving}
          onConfirm={handleConfirmReview}
          onCancel={() => setReviewAction(null)}
        />
      )}
    </section>
  )
}

export default OrderPaymentCard
