import api from '../../services/api'

// Paginated: { items, page, per_page, next_page, last_page, total }, newest first.
// Only filters with a value are sent — the backend rejects unknown or empty query params with 400
export async function getOrders(filters) {
  const params = { page: filters.page || 1, per_page: filters.per_page || 20 }
  if (filters.status) params.status = filters.status
  if (filters.payment_method) params.payment_method = filters.payment_method
  if (filters.payment_status) params.payment_status = filters.payment_status
  // Removes CANCELLED + CLIENTCANCELLED on the server; ignored when a status is also sent
  if (filters.exclude_cancelled) params.exclude_cancelled = filters.exclude_cancelled
  if (filters.user_id) params.user_id = filters.user_id
  // The filters hold local "YYYY-MM-DD" days. A date-only value would stop at 00:00 UTC and miss the
  // day, so send the start / end of the admin's LOCAL day as full ISO timestamps (both inclusive)
  if (filters.from_date) params.from = new Date(`${filters.from_date}T00:00:00`).toISOString()
  if (filters.to_date) params.to = new Date(`${filters.to_date}T23:59:59.999`).toISOString()
  const res = await api.get('/order/admin', { params })
  return res.data.data
}

// Receipts waiting for review — per_page 1 because only the total is needed
export async function getReviewCount() {
  const data = await getOrders({
    payment_method: 'CARD',
    payment_status: 'PENDING',
    exclude_cancelled: '1',
    per_page: 1,
  })
  return data.total
}

// The full order, including `coupon` and `user.status` (the list and the PATCH responses lack both)
export async function getOrder(id) {
  const res = await api.get(`/order/admin/${id}`)
  return res.data.data
}

// `status` is the ONLY field this endpoint accepts. The backend allows any status change,
// so the page decides which ones are offered
export async function updateOrderStatus(id, status) {
  const res = await api.patch(`/order/${id}`, { status })
  return res.data.data
}

// 'APPROVED' or 'REJECTED' only — 'PENDING' is restored only by the customer's re-upload
export async function reviewPayment(id, paymentStatus) {
  const res = await api.patch(`/order/${id}/payment-status`, { payment_status: paymentStatus })
  return res.data.data
}

// Raw image bytes, NOT wrapped in { message, data }. A plain <img src> can't send the token,
// so the receipt is downloaded as a Blob through the api client
export async function getPaymentProof(id) {
  const res = await api.get(`/order/${id}/payment-proof`, { responseType: 'blob' })
  return res.data
}
