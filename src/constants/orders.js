// Order status (admin.order.txt §3) → Arabic label + Badge variant
export const ORDER_STATUS = {
  PENDING: { label: 'جديد', variant: 'warning' },
  CONFIRMED: { label: 'مؤكد', variant: 'info' },
  PROCESSING: { label: 'قيد التجهيز', variant: 'info' },
  SHIPPED: { label: 'خرج للتوصيل', variant: 'info' },
  DELIVERED: { label: 'تم التوصيل', variant: 'success' },
  CANCELLED: { label: 'ملغي من الإدارة', variant: 'error' },
  CLIENTCANCELLED: { label: 'ملغي من العميل', variant: 'error' },
}
