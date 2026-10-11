import api from '../../services/api'

// Built field by field: the backend rejects any undeclared field, and an image must
// never be sent as a text field — only as an uploaded file
function buildSubCategoryFormData(values) {
  const formData = new FormData()
  formData.append('name', values.name.trim())
  formData.append('category_id', values.category_id)
  formData.append('display_order', values.display_order)
  formData.append('is_hidden', values.is_hidden)
  if (values.imageFile) formData.append('image', values.imageFile)
  return formData
}

// Plain array (not paginated), hidden rows included; each row has category: { id, name, is_hidden }
export async function getSubCategories() {
  const res = await api.get('/sub-category/admin')
  return res.data.data
}

// For the category dropdown and filter — this page's own call to the categories endpoint
export async function getCategoryOptions() {
  const res = await api.get('/category/admin')
  return res.data.data
}

export async function createSubCategory(values) {
  const res = await api.post('/sub-category', buildSubCategoryFormData(values))
  return res.data.data
}

export async function updateSubCategory(id, values) {
  const res = await api.patch(`/sub-category/${id}`, buildSubCategoryFormData(values))
  return res.data.data
}

export async function hideSubCategory(id) {
  const res = await api.delete(`/sub-category/${id}`) // soft delete: sets is_hidden = true
  return res.data.data
}

// There is no "restore" endpoint — showing again is a PATCH with is_hidden = false
export async function showSubCategory(id) {
  const formData = new FormData()
  formData.append('is_hidden', false)
  const res = await api.patch(`/sub-category/${id}`, formData)
  return res.data.data
}
