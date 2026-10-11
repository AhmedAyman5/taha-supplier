import api from '../../services/api'

// Plain array (not paginated), newest first, without sub-category links.
// Deleted brands are never returned — there is no way to list or restore them
export async function getBrands() {
  const res = await api.get('/brand/admin')
  return res.data.data
}

// The only "get one" route — it includes brandSubCategories, which the edit form needs
export async function getBrand(id) {
  const res = await api.get(`/brand/${id}`)
  return res.data.data
}

// For the sub-category picker — this page's own call to the sub-categories endpoint.
// Each row has category: { id, name, is_hidden }
export async function getSubCategoryOptions() {
  const res = await api.get('/sub-category/admin')
  return res.data.data
}

// Links are NOT sent here: sending an array over multipart is unreliable, so we link
// afterwards with linkSubCategories (clean JSON) — the docs call that the reliable way
export async function createBrand(values) {
  const formData = new FormData()
  formData.append('name', values.name.trim())
  formData.append('logo', values.logoFile)
  const res = await api.post('/brand', formData)
  return res.data.data
}

// Never send subcategory_ids here — PATCH accepts it but silently ignores it
export async function updateBrand(id, values) {
  const formData = new FormData()
  formData.append('name', values.name.trim())
  if (values.logoFile) formData.append('logo', values.logoFile)
  const res = await api.patch(`/brand/${id}`, formData)
  return res.data.data
}

// Soft delete (deleted_at), but there is no restore endpoint — permanent from the dashboard's view
export async function deleteBrand(id) {
  const res = await api.delete(`/brand/${id}`)
  return res.data.data
}

// Additive (existing links are kept). ids must be a non-empty array of unique ids
export async function linkSubCategories(brandId, ids) {
  const res = await api.post(`/brand/${brandId}/subcategories`, { subcategory_ids: ids })
  return res.data.data
}

// Takes the SUB-CATEGORY id, not the link row id
export async function unlinkSubCategory(brandId, subCategoryId) {
  const res = await api.delete(`/brand/${brandId}/subcategories/${subCategoryId}`)
  return res.data.data
}
