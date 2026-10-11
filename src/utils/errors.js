// Backend error messages are English, so they are never shown — we map the status code to Arabic
const STATUS_MESSAGES = {
  400: 'البيانات المدخلة غير صحيحة',
  403: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
  404: 'العنصر غير موجود أو تم حذفه',
  409: 'هذا العنصر موجود بالفعل',
}

// overrides: page-specific messages by status, e.g. { 409: 'يوجد قسم بنفس الاسم' }
export function getErrorMessage(error, overrides = {}) {
  const status = error?.response?.status

  if (overrides[status]) return overrides[status]
  if (!error?.response) return 'تعذر الاتصال بالخادم، تحقق من الاتصال وحاول مرة أخرى'
  return STATUS_MESSAGES[status] || 'حدث خطأ، حاول مرة أخرى'
}
