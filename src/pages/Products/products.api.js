import api from '../../services/api'

// Built field by field: the backend rejects any undeclared field (discount_percentage, rating and
// review_count are server-owned and must never be sent)
function buildProductFormData(values) {
  const formData = new FormData()
  formData.append('subcategory_id', values.subcategory_id)
  formData.append('brand_id', values.brand_id)
  formData.append('name', values.name.trim())
  formData.append('description', values.description.trim())
  formData.append('price', values.price)
  formData.append('unit', values.unit.trim())
  formData.append('is_available', values.is_available)
  formData.append('is_best_seller', values.is_best_seller)
  formData.append('is_new', values.is_new)
  formData.append('display_order', values.display_order)
  // An absent discount_price means "keep the current discount". An EMPTY one would remove it,
  // so it is appended only when it has a value — removing is removeProductDiscount's job
  if (values.discount_price) formData.append('discount_price', values.discount_price)
  if (values.imageFile) formData.append('image', values.imageFile)
  return formData
}

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

// All columns + the gallery images WITH their ids (needed to delete one)
export async function getProduct(id) {
  const res = await api.get(`/product/admin/${id}`)
  return res.data.data
}

// The main image is required here; the gallery goes as repeated "images" fields (max 10)
export async function createProduct(values) {
  const formData = buildProductFormData(values)
  values.galleryFiles.forEach((file) => formData.append('images', file))
  const res = await api.post('/product', formData)
  return res.data.data
}

// PATCH accepts only the main `image` file — sending `images` here is a 400 (use addProductImages)
export async function updateProduct(id, values) {
  const res = await api.patch(`/product/${id}`, buildProductFormData(values))
  return res.data.data
}

// The ONLY place allowed to send an empty discount_price — call it only when the admin
// explicitly checked «إزالة الخصم».
export async function removeProductDiscount(id) {
  const formData = new FormData()
  formData.append('discount_price', '')
  const res = await api.patch(`/product/${id}`, formData)
  return res.data.data
}

// Appends to the gallery (max 10 files per call). The response is the CLIENT shape with no image
// ids, so refetch getProduct(id) afterwards
export async function addProductImages(id, files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  const res = await api.post(`/product/${id}/images`, formData)
  return res.data.data
}

export async function deleteProductImage(id, imageId) {
  const res = await api.delete(`/product/${id}/images/${imageId}`) // hard delete: the row AND the file
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
