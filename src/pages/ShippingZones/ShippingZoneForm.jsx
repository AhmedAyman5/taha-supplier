import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { createShippingZone, updateShippingZone } from './shippingZones.api'

// zone = null → create; a list row → edit (the row already has every editable field)
function ShippingZoneForm({ zone, zones, onClose, onSaved }) {
  const isEdit = Boolean(zone)

  // New zones go to the end of the list by default
  const nextDisplayOrder = zones.length > 0 ? Math.max(...zones.map((item) => item.display_order)) + 1 : 0

  const [values, setValues] = useState({
    name: isEdit ? zone.name : '',
    shipping_cost: isEdit ? String(Number(zone.shipping_cost)) : '', // Decimal string "30.00" → "30"
    display_order: String(isEdit ? zone.display_order : nextDisplayOrder),
    is_active: isEdit ? zone.is_active : true, // the backend default is active
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setValues({ ...values, [name]: type === 'checkbox' ? checked : value })
  }

  function validate() {
    const errors = {}
    const name = values.name.trim()
    const shippingCost = Number(values.shipping_cost)
    const displayOrder = Number(values.display_order)

    // The backend returns 409 for a duplicate name — checking here gives the error before saving
    const isDuplicate = zones.some(
      (item) => item.id !== zone?.id && item.name.trim().toLowerCase() === name.toLowerCase(),
    )

    // The backend accepts even a one-character name, so the minimum length is checked only here
    if (!name) errors.name = 'اسم المنطقة مطلوب'
    else if (name.length < 2) errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
    else if (isDuplicate) errors.name = 'توجد منطقة بنفس الاسم بالفعل'

    if (values.shipping_cost.trim() === '' || !Number.isFinite(shippingCost) || shippingCost < 0) {
      errors.shipping_cost = 'سعر التوصيل مطلوب ويجب أن يكون 0 أو أكثر'
    }

    if (values.display_order.trim() === '' || !Number.isInteger(displayOrder) || displayOrder < 0) {
      errors.display_order = 'ترتيب العرض يجب أن يكون رقماً صحيحاً 0 أو أكبر'
    }

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    const data = {
      name: values.name,
      shipping_cost: values.shipping_cost,
      display_order: values.display_order,
      is_active: values.is_active,
    }

    setIsSaving(true)
    try {
      if (isEdit) await updateShippingZone(zone.id, data)
      else await createShippingZone(data)
      toast.success('تم الحفظ بنجاح')
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, { 409: 'توجد منطقة بنفس الاسم بالفعل' }))
      setIsSaving(false)
    }
  }

  // Don't let Escape / overlay close the form while the request is still running
  function handleClose() {
    if (!isSaving) onClose()
  }

  return (
    <Modal
      title={isEdit ? 'تعديل المنطقة' : 'إضافة منطقة'}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            إلغاء
          </Button>
          {/* form="shipping-zone-form": the footer sits outside the <form>, this links the button to it */}
          <Button type="submit" form="shipping-zone-form" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </>
      }
    >
      {/* noValidate: our Arabic checks replace the browser's English validation popups */}
      <form id="shipping-zone-form" onSubmit={handleSubmit} noValidate className="grid gap-4">
        <FormField label="اسم المنطقة" error={fieldErrors.name}>
          <TextInput
            name="name"
            value={values.name}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.name)}
            placeholder="مثال: القاهرة"
          />
        </FormField>

        <div className="grid gap-1.5">
          <FormField label="سعر التوصيل" error={fieldErrors.shipping_cost} hint="اكتب 0 للتوصيل المجاني">
            <TextInput
              name="shipping_cost"
              type="number"
              min="0"
              step="any"
              value={values.shipping_cost}
              onChange={handleChange}
              hasError={Boolean(fieldErrors.shipping_cost)}
            />
          </FormField>
          {/* Backend gotcha: every order snapshots its shipping fee, so a new price only affects new orders */}
          {isEdit && (
            <p className="text-xs text-text-muted">
              تغيير السعر يُطبَّق على الطلبات الجديدة فقط، والطلبات السابقة تحتفظ بسعرها
            </p>
          )}
        </div>

        <FormField
          label="ترتيب العرض"
          error={fieldErrors.display_order}
          hint="المناطق ذات الرقم الأصغر تظهر أولاً في القائمة"
        >
          <TextInput
            name="display_order"
            type="number"
            min="0"
            step="1"
            value={values.display_order}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.display_order)}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="is_active"
            checked={values.is_active}
            onChange={handleChange}
            className="h-4 w-4 accent-primary"
          />
          المنطقة مفعّلة
        </label>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default ShippingZoneForm
