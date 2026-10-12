import api from '../../services/api'

// Built field by field: the backend rejects any undeclared field. This endpoint is JSON, so numbers
// go as real numbers and is_active as a real boolean — the string "true" is rejected here
function buildShippingZoneBody(values) {
  return {
    name: values.name.trim(),
    shipping_cost: Number(values.shipping_cost),
    display_order: Number(values.display_order),
    is_active: values.is_active,
  }
}

// Plain array (not paginated), inactive zones included, sorted by display_order.
// shipping_cost comes back as a Decimal string ("30")
export async function getShippingZones() {
  const res = await api.get('/shipping-zone/admin')
  return res.data.data
}

export async function createShippingZone(values) {
  const res = await api.post('/shipping-zone', buildShippingZoneBody(values))
  return res.data.data
}

export async function updateShippingZone(id, values) {
  const res = await api.patch(`/shipping-zone/${id}`, buildShippingZoneBody(values))
  return res.data.data
}

// There is no DELETE endpoint — a zone is retired (and brought back) by toggling is_active
export async function setShippingZoneActive(id, isActive) {
  const res = await api.patch(`/shipping-zone/${id}`, { is_active: isActive })
  return res.data.data
}
