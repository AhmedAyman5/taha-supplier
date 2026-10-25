import api from '../../services/api'

// There is no stats endpoint: every paginated list returns `total` (rows matching the filter),
// so one number = one request with per_page 1
async function getTotal(path, params) {
  const res = await api.get(path, { params: { ...params, per_page: 1 } })
  return res.data.data.total
}

// today = the admin's local day as "YYYY-MM-DD".
// Returns { key: { value } or { error: true } } — one failed number never breaks the others
export async function getHomeStats(today) {
  const requests = {
    newOrders: getTotal('/order/admin', { status: 'PENDING' }),
    // No status here: a status filter would make the backend ignore exclude_cancelled
    receiptsToReview: getTotal('/order/admin', {
      payment_method: 'CARD',
      payment_status: 'PENDING',
      exclude_cancelled: '1',
    }),
    // A date-only value would stop at 00:00 UTC and miss the day, so send the start / end of the
    // admin's LOCAL day as full ISO timestamps (both inclusive)
    todayOrders: getTotal('/order/admin', {
      from: new Date(`${today}T00:00:00`).toISOString(),
      to: new Date(`${today}T23:59:59.999`).toISOString(),
    }),
    customers: getTotal('/customers/admin', {}),
    bannedCustomers: getTotal('/customers/admin', { status: 'BANNED' }),
    availableProducts: getTotal('/product/admin', { is_available: 'true' }),
    unavailableProducts: getTotal('/product/admin', { is_available: 'false' }),
  }

  const keys = Object.keys(requests)
  const results = await Promise.allSettled(Object.values(requests))
  const stats = {}
  keys.forEach((key, index) => {
    const result = results[index]
    stats[key] = result.status === 'fulfilled' ? { value: result.value } : { error: true }
  })
  return stats
}

// Newest first (the list's default order)
export async function getLatestOrders() {
  const res = await api.get('/order/admin', { params: { per_page: 5 } })
  return res.data.data.items
}
