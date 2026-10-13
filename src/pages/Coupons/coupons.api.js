import api from '../../services/api'

// Form values (strings) → API types. Converts ONLY the keys it receives, so PATCH sends just the
// changed fields. Only the four optional fields may become null (null clears them on PATCH) —
// code, discount_value and status are required columns and null there causes a 500
function toCouponBody(values) {
  const body = {}
  if ('code' in values) body.code = values.code.trim().toUpperCase() // the app matches codes case-sensitively
  if ('discount_value' in values) body.discount_value = Number(values.discount_value)
  if ('min_order_amount' in values) {
    body.min_order_amount = values.min_order_amount === '' ? null : Number(values.min_order_amount)
  }
  if ('usage_limit' in values) {
    body.usage_limit = values.usage_limit === '' ? null : Number(values.usage_limit)
  }
  // Dates are LOCAL days: valid from the start of the start day until the end of the end day
  if ('start_date' in values) {
    body.start_date = values.start_date ? new Date(`${values.start_date}T00:00:00`).toISOString() : null
  }
  if ('end_date' in values) {
    body.end_date = values.end_date ? new Date(`${values.end_date}T23:59:59`).toISOString() : null
  }
  if ('status' in values) body.status = values.status // 'ACTIVE' | 'PAUSED'
  return body
}

// Plain array (not paginated), newest first. discount_value and min_order_amount are Decimal strings;
// min_order_amount, usage_limit, start_date and end_date may be null
export async function getCoupons() {
  const res = await api.get('/coupon')
  return res.data.data
}

// On create an empty optional field is simply left out
export async function createCoupon(values) {
  const body = toCouponBody(values)
  for (const key of Object.keys(body)) {
    if (body[key] === null) delete body[key]
  }
  const res = await api.post('/coupon', body)
  return res.data.data
}

// changedValues holds only the edited fields; an emptied optional field becomes null and clears it
export async function updateCoupon(id, changedValues) {
  const res = await api.patch(`/coupon/${id}`, toCouponBody(changedValues))
  return res.data.data
}

// Coupons are never deleted (the backend removed DELETE /coupon/:id) — they are paused and re-activated
export async function setCouponStatus(id, status) {
  const res = await api.patch(`/coupon/${id}`, { status })
  return res.data.data
}
