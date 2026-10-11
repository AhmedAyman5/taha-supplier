import api from '../../services/api'

// Built field by field: the backend rejects any undeclared field, and an image must
// never be sent as a text field — only as an uploaded file
function buildCategoryFormData(values) {
  const formData = new FormData()
  formData.append('name', values.name.trim())
  formData.append('display_order', values.display_order)
  formData.append('is_hidden', values.is_hidden)
  if (values.imageFile) formData.append('image', values.imageFile)
  return formData
}

// Plain array (not paginated), hidden categories included, sorted by display_order
export async function getCategories() {
  const res = await api.get('/category/admin')
  return res.data.data
}

export async function createCategory(values) {
  const res = await api.post('/category', buildCategoryFormData(values))
  return res.data.data
}

export async function updateCategory(id, values) {
  const res = await api.patch(`/category/${id}`, buildCategoryFormData(values))
  return res.data.data
}

export async function hideCategory(id) {
  const res = await api.delete(`/category/${id}`) // soft delete: sets is_hidden = true
  return res.data.data
}

// There is no "restore" endpoint — showing again is a PATCH with is_hidden = false
export async function showCategory(id) {
  const formData = new FormData()
  formData.append('is_hidden', false)
  const res = await api.patch(`/category/${id}`, formData)
  return res.data.data
}
