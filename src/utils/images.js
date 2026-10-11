// The backend stores relative paths ("/uploads/..."), but seeded products / banners may hold full URLs
export function getImageUrl(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${import.meta.env.VITE_API_BASE_URL}${path}`
}
