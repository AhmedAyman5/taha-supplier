// The backend stores relative paths ("/uploads/..."), but seeded products / banners may hold full URLs
export function getImageUrl(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${import.meta.env.VITE_API_BASE_URL}${path}`
}

// The backend accepts only these types (shared upload rules in admin.general.txt)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Returns an Arabic error, or '' when the file is fine. Checked BEFORE uploading because the
// backend's own size message is wrong
export function validateImageFile(file, maxSizeMB = 10) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'نوع الصورة غير مدعوم، استخدم JPG أو PNG أو WEBP'
  if (file.size > maxSizeMB * 1024 * 1024) return `حجم الصورة أكبر من ${maxSizeMB} ميجابايت`
  return ''
}
