import api from '../../services/api'

// Paginated: { items, page, per_page, next_page, last_page, total }. Only CLIENT users are returned.
// Only filters with a value are sent — the backend rejects unknown or empty query params with 400
export async function getCustomers(page, filters) {
  const params = { page, per_page: 20 }
  if (filters.search) params.search = filters.search // matches name, shop_name, phone OR email
  if (filters.status) params.status = filters.status // "ACTIVE" / "BANNED"
  const res = await api.get('/customers/admin', { params })
  return res.data.data
}

// The list fields + latitude / longitude (numbers or null) + the last 10 orders
export async function getCustomer(id) {
  const res = await api.get(`/customers/admin/${id}`)
  return res.data.data
}

// The backend rejects an empty or whitespace-only reason when banning
export async function banCustomer(id, reason) {
  const res = await api.patch(`/customers/admin/${id}/status`, { status: 'BANNED', block_reason: reason.trim() })
  return res.data.data
}

// No block_reason here: unbanning always clears it to null in the backend
export async function unbanCustomer(id) {
  const res = await api.patch(`/customers/admin/${id}/status`, { status: 'ACTIVE' })
  return res.data.data
}
