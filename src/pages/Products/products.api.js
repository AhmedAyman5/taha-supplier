import api from '../../services/api'

// Paginated: { items, page, per_page, next_page, last_page, total }.
// Only filters with a value are sent — the backend rejects unknown or empty query params with 400
export async function getProducts(page, filters) {
  const params = { page, per_page: 20 }
  if (filters.search) params.search = filters.search // matches the product name OR the brand name
  if (filters.category_id) params.category_id = filters.category_id
  if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id
  if (filters.brand_id) params.brand_id = filters.brand_id
  if (filters.is_available) params.is_available = filters.is_available // "true" / "false"
  const res = await api.get('/product/admin', { params })
  return res.data.data
}

// The options below are this page's own calls to the other modules' endpoints

export async function getCategoryOptions() {
  const res = await api.get('/category/admin')
  return res.data.data
}

// Each row has is_hidden + category: { id, name, is_hidden }
export async function getSubCategoryOptions() {
  const res = await api.get('/sub-category/admin')
  return res.data.data
}

// Soft-deleted brands are NOT in this list (their products still keep the brand)
export async function getBrandOptions() {
  const res = await api.get('/brand/admin')
  return res.data.data
}

export async function deactivateProduct(id) {
  const res = await api.delete(`/product/${id}`) // soft delete: sets is_available = false
  return res.data.data
}

// There is no "restore" endpoint — activating again is a PATCH with is_available = true
export async function activateProduct(id) {
  const formData = new FormData()
  formData.append('is_available', true)
  const res = await api.patch(`/product/${id}`, formData)
  return res.data.data
}
