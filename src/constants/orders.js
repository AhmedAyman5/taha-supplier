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

export const PAYMENT_METHOD = {
  CASH: 'عند الاستلام',
  CARD: 'تحويل بنكي',
}

// Only meaningful for CARD orders. A CARD order always has a receipt (mandatory at checkout),
// so CARD + PENDING always means "receipt waiting for review"
export const PAYMENT_STATUS = {
  PENDING: { label: 'إيصال قيد المراجعة', variant: 'warning' },
  APPROVED: { label: 'الدفع مقبول', variant: 'success' },
  REJECTED: { label: 'الإيصال مرفوض', variant: 'error' },
}
