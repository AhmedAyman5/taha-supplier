import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { createCoupon, updateCoupon } from './coupons.api'

// ISO (UTC) → the LOCAL day as YYYY-MM-DD for <input type="date">. Slicing the ISO string would give
// the UTC day, which can be one day off (e.g. local midnight is still "yesterday" in UTC)
function toDateInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// coupon = null → create; a list row → edit (the row already has every editable field)
function CouponForm({ coupon, coupons, onClose, onSaved }) {
  const isEdit = Boolean(coupon)

  // Kept to compare against on save, so an edit sends only the fields that changed
  const [initialValues] = useState({
    code: isEdit ? coupon.code : '',
    discount_value: isEdit ? String(Number(coupon.discount_value)) : '', // Decimal string "10" → "10"
    min_order_amount: isEdit && coupon.min_order_amount !== null ? String(Number(coupon.min_order_amount)) : '',
    start_date: isEdit ? toDateInput(coupon.start_date) : '',
    end_date: isEdit ? toDateInput(coupon.end_date) : '',
    usage_limit: isEdit && coupon.usage_limit !== null ? String(coupon.usage_limit) : '',
    status: isEdit ? coupon.status : 'ACTIVE', // the backend default is ACTIVE
  })
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues({ ...values, [name]: value })
  }

  // The app matches codes case-sensitively, so codes are always uppercase
  function handleCodeChange(event) {
    setValues({ ...values, code: event.target.value.toUpperCase() })
  }

  function handleStatusChange(event) {
    setValues({ ...values, status: event.target.checked ? 'ACTIVE' : 'PAUSED' })
  }

  function validate() {
    const errors = {}
    const code = values.code.trim().toUpperCase()
    const discountValue = Number(values.discount_value)
    const minOrderAmount = Number(values.min_order_amount)
    const usageLimit = Number(values.usage_limit)

    // The backend also returns 409 now — checking here gives the error before saving
    const isDuplicate = coupons.some((item) => item.id !== coupon?.id && item.code.toUpperCase() === code)

    if (!code) errors.code = 'كود الكوبون مطلوب'
    else if (!/^[A-Z0-9-]{3,30}$/.test(code)) {
      errors.code = 'الكود يجب أن يكون من 3 إلى 30 حرفاً إنجليزياً أو رقماً (ويُسمح بالشرطة)'
    } else if (isDuplicate) errors.code = 'يوجد كوبون بنفس الكود بالفعل'

    if (values.discount_value === '' || !Number.isFinite(discountValue) || discountValue < 1 || discountValue > 100) {
      errors.discount_value = 'نسبة الخصم مطلوبة ويجب أن تكون من 1 إلى 100'
    }

    // The backend accepts a negative minimum
    if (values.min_order_amount !== '' && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
      errors.min_order_amount = 'الحد الأدنى يجب أن يكون 0 أو أكثر'
    }

    // The backend doesn't check the date order — a coupon ending before it starts is never usable.
    // YYYY-MM-DD strings compare correctly as text
    if (values.start_date && values.end_date && values.end_date < values.start_date) {
      errors.end_date = 'تاريخ الانتهاء يجب أن يكون في نفس يوم البداية أو بعده'
    }

    // The backend accepts 0, which would make the coupon unusable immediately
    if (values.usage_limit !== '') {
      if (!Number.isInteger(usageLimit) || usageLimit < 1) {
        errors.usage_limit = 'الحد الأقصى يجب أن يكون رقماً صحيحاً 1 أو أكثر'
      } else if (isEdit && usageLimit < coupon.usage_count) {
        errors.usage_limit = `الحد الأقصى لا يمكن أن يكون أقل من عدد مرات الاستخدام الحالية (${coupon.usage_count})`
      }
    }

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    // Edit: send only the changed fields. An emptied optional field stays '' and the api file
    // turns it into null, which clears it in the backend
    const changedValues = {}
    if (isEdit) {
      for (const key of Object.keys(initialValues)) {
        const value = key === 'code' ? values.code.trim() : values[key]
        if (value !== initialValues[key]) changedValues[key] = values[key]
      }
      if (Object.keys(changedValues).length === 0) {
        onClose()
        return
      }
    }

    setIsSaving(true)
    try {
      if (isEdit) await updateCoupon(coupon.id, changedValues)
      else await createCoupon(values)
      toast.success('تم الحفظ بنجاح')
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, { 409: 'يوجد كوبون بنفس الكود بالفعل' }))
      setIsSaving(false)
    }
  }

  // Don't let Escape / overlay close the form while the request is still running
  function handleClose() {
    if (!isSaving) onClose()
  }

  return (
    <Modal
      title={isEdit ? 'تعديل الكوبون' : 'إضافة كوبون'}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="coupon-form": the footer sits outside the <form>, this links the button to it */}
          <Button type="submit" form="coupon-form" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </>
      }
    >
      {/* noValidate: our Arabic checks replace the browser's English validation popups */}
      <form id="coupon-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        {isEdit && (
          <p className="rounded-md bg-background px-3 py-2 text-sm text-text-secondary">
            تم استخدامه {coupon.usage_count} مرة
          </p>
        )}

        <div className="grid gap-1.5">
          <FormField label="كود الكوبون" error={fieldErrors.code} hint="يكتبه العميل في التطبيق كما هو تماماً">
            <TextInput
              name="code"
              dir="ltr"
              value={values.code}
              onChange={handleCodeChange}
              hasError={Boolean(fieldErrors.code)}
              placeholder="WELCOME10"
            />
          </FormField>
          {isEdit && (
            <p className="text-xs text-text-muted">إذا غيّرت الكود، سيحتاج العملاء لاستخدام الكود الجديد</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid content-start gap-1.5">
            <FormField label="نسبة الخصم %" error={fieldErrors.discount_value}>
              <TextInput
                name="discount_value"
                type="number"
                min="1"
                max="100"
                step="any"
                value={values.discount_value}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.discount_value)}
              />
            </FormField>
            {/* Backend gotcha: carts re-read the coupon live, but placed orders snapshot their discount */}
            {isEdit && (
              <p className="text-xs text-text-muted">
                تغيير النسبة يُطبَّق فوراً على سلات المشتريات الحالية، والطلبات السابقة تحتفظ بخصمها
              </p>
            )}
          </div>

          <FormField
            label="الحد الأدنى للطلب"
            error={fieldErrors.min_order_amount}
            hint="يُحسب على قيمة المنتجات قبل الخصم وبدون رسوم التوصيل — اتركه فارغاً إذا لم يكن هناك حد أدنى"
          >
            <TextInput
              name="min_order_amount"
              type="number"
              min="0"
              step="any"
              value={values.min_order_amount}
              onChange={handleChange}
              hasError={Boolean(fieldErrors.min_order_amount)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="تاريخ البداية">
            <TextInput name="start_date" type="date" value={values.start_date} onChange={handleChange} />
          </FormField>

          <FormField
            label="تاريخ الانتهاء"
            error={fieldErrors.end_date}
            hint="يظل الكوبون صالحاً حتى نهاية يوم الانتهاء"
          >
            <TextInput
              name="end_date"
              type="date"
              value={values.end_date}
              onChange={handleChange}
              hasError={Boolean(fieldErrors.end_date)}
            />
          </FormField>
        </div>

        <FormField
          label="الحد الأقصى لمرات الاستخدام"
          error={fieldErrors.usage_limit}
          hint="كل عميل يمكنه استخدام الكوبون مرة واحدة فقط، وهذا العدد هو الإجمالي لجميع العملاء — اتركه فارغاً لعدد غير محدود"
        >
          <TextInput
            name="usage_limit"
            type="number"
            min="1"
            step="1"
            value={values.usage_limit}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.usage_limit)}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={values.status === 'ACTIVE'}
            onChange={handleStatusChange}
            className="h-4 w-4 accent-primary"
          />
          الكوبون مفعّل
        </label>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default CouponForm
