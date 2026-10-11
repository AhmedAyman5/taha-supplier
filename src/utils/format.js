// 'en-US' for prices and 'ar-EG-u-nu-latn' for dates: Arabic words, but always Western digits (0-9)
const priceFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

// Accepts a number or a Decimal string ("520.00") — admin endpoints return both
export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${priceFormatter.format(Number(value))} ج.م`
}

export function formatDate(iso) {
  if (!iso) return '—'
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}
