import api from '../../services/api'

// Built field by field: the backend rejects any other field. body is optional, but an empty "" is
// rejected (400), so the key is left out instead
export async function sendBroadcast({ title, body }) {
  const payload = { title: title.trim() }
  if (body.trim()) payload.body = body.trim()
  const res = await api.post('/notification/broadcast', payload)
  return res.data.data // a delivery report { requested, sent, failed } — a 201 does NOT mean delivered
}
