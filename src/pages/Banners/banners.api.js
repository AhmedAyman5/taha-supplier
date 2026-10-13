import api from '../../services/api'

// The FILTER form values of one image — every key always exists so the inputs stay controlled.
// buildConfig below sends only the filled ones
export const EMPTY_FILTER = {
  category_id: '',
  subcategory_id: '',
  brand_id: '',
  search: '',
  available: false,
  offers: false,
  min_rating: '',
  sort: '',
}

const TARGET_ID_ACTIONS = ['CATEGORY', 'PRODUCT', 'BRAND']

// One entry of image_configs. The backend resets a target that isn't sent together with
// click_action_type, so the full target always goes — and never a target field the action doesn't use
function buildConfig(action, sortOrder, imageId) {
  const config = {}
  if (imageId) config.image_id = imageId
  config.sort_order = sortOrder
  config.click_action_type = action.click_action_type

  if (TARGET_ID_ACTIONS.includes(action.click_action_type)) {
    config.click_target_id = Number(action.click_target_id)
  }

  // FILTER: only the keys with a value (any other key is rejected; page / per_page are never sent)
  if (action.click_action_type === 'FILTER') {
    const filter = action.click_target_data
    const data = {}
    if (filter.category_id) data.category_id = Number(filter.category_id)
    if (filter.subcategory_id) data.subcategory_id = Number(filter.subcategory_id)
    if (filter.brand_id) data.brand_id = Number(filter.brand_id)
    if (filter.search.trim()) data.search = filter.search.trim()
    if (filter.available) data.available = 1
    if (filter.offers) data.offers = 1
    if (filter.min_rating) data.min_rating = Number(filter.min_rating)
    if (filter.sort) data.sort = filter.sort
    config.click_target_data = data
  }

  return config
}

// There is no /banner/admin — GET /banner already returns active AND inactive banners,
// sorted by sort_order then newest (images sorted by sort_order)
export async function getBanners() {
  const res = await api.get('/banner')
  return res.data.data
}

export async function getBanner(id) {
  const res = await api.get(`/banner/${id}`)
  return res.data.data
}

// images = [{ file, action }] in display order. image_configs is a JSON STRING with exactly one config
// per file, in the same order as the files (no image_id); sort_order = the position
export async function createBanner({ title, is_active, sort_order, images }) {
  const formData = new FormData()
  if (title) formData.append('title', title)
  formData.append('is_active', is_active)
  formData.append('sort_order', sort_order)
  images.forEach((image) => formData.append('images', image.file))
  formData.append('image_configs', JSON.stringify(images.map((image, index) => buildConfig(image.action, index))))
  const res = await api.post('/banner', formData)
  return res.data.data
}

// ONE PATCH — the backend saves fields and images together, all-or-nothing:
// - newImages ([{ file, action }]) → "mode 2": ALL current images are replaced; configs without image_id
// - existingConfigs ([{ image_id, action }] in display order) → "mode 3": reconfigure the current images
// - neither → "mode 1": fields only, the images are kept
// Files and image_id configs are never mixed: with files, image_configs must describe the NEW files
export async function updateBanner(id, { title, is_active, sort_order, newImages, existingConfigs }) {
  const formData = new FormData()
  formData.append('title', title) // '' clears the title
  formData.append('is_active', is_active)
  formData.append('sort_order', sort_order)

  if (newImages) {
    newImages.forEach((image) => formData.append('images', image.file))
    formData.append(
      'image_configs',
      JSON.stringify(newImages.map((image, index) => buildConfig(image.action, index))),
    )
  } else if (existingConfigs) {
    formData.append(
      'image_configs',
      JSON.stringify(existingConfigs.map((image, index) => buildConfig(image.action, index, image.image_id))),
    )
  }

  const res = await api.patch(`/banner/${id}`, formData)
  return res.data.data
}

// Fields-only PATCH ("mode 1"): the existing images are kept. Never add files or image_configs
// here — files would REPLACE all images and image_configs would reconfigure them
export async function setBannerActive(id, isActive) {
  const formData = new FormData()
  formData.append('is_active', isActive) // becomes "true" / "false"
  const res = await api.patch(`/banner/${id}`, formData)
  return res.data.data
}

export async function deleteBanner(id) {
  const res = await api.delete(`/banner/${id}`) // HARD delete: the banner, its images and their files
  return res.data.data
}

// The options below are this page's own calls to the other modules' endpoints

export async function getCategoryOptions() {
  const res = await api.get('/category/admin')
  return res.data.data
}

// Each row has category_id and is_hidden
export async function getSubCategoryOptions() {
  const res = await api.get('/sub-category/admin')
  return res.data.data
}

// Soft-deleted brands are NOT in this list
export async function getBrandOptions() {
  const res = await api.get('/brand/admin')
  return res.data.data
}

// Paginated: { items, ... } — the first 10 matches are enough for a picker.
// An empty search param is rejected, so it is sent only when filled
export async function searchProducts(search) {
  const params = { per_page: 10 }
  if (search) params.search = search
  const res = await api.get('/product/admin', { params })
  return res.data.data
}

export async function getProduct(id) {
  const res = await api.get(`/product/admin/${id}`)
  return res.data.data
}
