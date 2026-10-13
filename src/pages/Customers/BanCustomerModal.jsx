import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import Textarea from '../../components/Textarea'
import { getErrorMessage } from '../../utils/errors'
import { banCustomer } from './customers.api'

// Our own limit to keep reasons short — the backend accepts any length
const MAX_REASON_LENGTH = 200

// onBanned(customer): the PATCH returns the full updated customer, so the parent needs no refetch
function BanCustomerModal({ customerId, onClose, onBanned }) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    // The backend trims too, so "   " counts as empty
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setReasonError('سبب الحظر مطلوب')
      return
    }
    if (trimmedReason.length > MAX_REASON_LENGTH) {
      setReasonError('السبب يجب ألا يزيد عن 200 حرف')
      return
    }
    setReasonError('')

    setIsSaving(true)
    try {
      const data = await banCustomer(customerId, trimmedReason)
      toast.success('تم حظر العميل')
      onBanned(data)
    } catch (err) {
      setError(getErrorMessage(err, { 404: 'العميل غير موجود' }))
      setIsSaving(false)
    }
  }

  // Don't let Escape / overlay close the form while the request is still running
  function handleClose() {
    if (!isSaving) onClose()
  }

  return (
    <Modal
      title="حظر العميل"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="ban-customer-form": the footer sits outside the <form>, this links the button to it */}
          <Button type="submit" form="ban-customer-form" variant="danger" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حظر'}
          </Button>
        </>
      }
    >
      <form id="ban-customer-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        {/* The ban revokes refresh tokens, but the current access token keeps working up to 15 minutes */}
        <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
          سيتم منع العميل من تسجيل الدخول. قد يظل قادراً على استخدام التطبيق لمدة تصل إلى 15 دقيقة، وطلباته الحالية
          لن تتأثر.
        </p>

        <div className="grid gap-1.5">
          <FormField label="سبب الحظر" error={reasonError}>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              hasError={Boolean(reasonError)}
              rows={3}
            />
          </FormField>
          <p className={`text-xs ${reason.length > MAX_REASON_LENGTH ? 'text-error' : 'text-text-muted'}`}>
            {/* dir="ltr": otherwise RTL shows "12 / 200" as "200 / 12" */}
            <span dir="ltr">
              {reason.length} / {MAX_REASON_LENGTH}
            </span>
          </p>
        </div>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default BanCustomerModal
