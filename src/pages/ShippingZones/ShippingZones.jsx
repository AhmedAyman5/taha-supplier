import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Power, PowerOff } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { formatDate, formatPrice } from '../../utils/format'
import { getShippingZones, setShippingZoneActive } from './shippingZones.api'
import ShippingZoneForm from './ShippingZoneForm'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

function ShippingZones() {
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / activate / deactivate

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null) // null = the form creates a new one
  const [deactivatingZone, setDeactivatingZone] = useState(null) // the row waiting for deactivate confirmation
  const [busyId, setBusyId] = useState(null) // the row whose request is running

  useEffect(() => {
    let ignore = false // drop late responses when the page reloads quickly
    async function load() {
      try {
        const data = await getShippingZones()
        if (!ignore) {
          setZones(data)
          setError('')
        }
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  function openCreateForm() {
    setEditingZone(null)
    setIsFormOpen(true)
  }

  function openEditForm(zone) {
    setEditingZone(zone)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    setReloadKey(reloadKey + 1)
  }

  async function handleDeactivate() {
    setBusyId(deactivatingZone.id)
    try {
      await setShippingZoneActive(deactivatingZone.id, false)
      toast.success('تم إيقاف المنطقة')
      setDeactivatingZone(null)
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Activating isn't destructive, so no confirm dialog
  async function handleActivate(zone) {
    setBusyId(zone.id)
    try {
      await setShippingZoneActive(zone.id, true)
      toast.success('تم تفعيل المنطقة')
      setReloadKey(reloadKey + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // The list is a plain array (not paginated), so search and filter happen here
  const query = search.trim().toLowerCase()
  const filteredZones = zones.filter((zone) => {
    if (statusFilter === 'active' && !zone.is_active) return false
    if (statusFilter === 'inactive' && zone.is_active) return false
    return zone.name.toLowerCase().includes(query)
  })

  const addButton = (
    <Button onClick={openCreateForm}>
      <Plus size={18} />
      إضافة منطقة
    </Button>
  )

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (zones.length === 0) return <EmptyState message="لا توجد مناطق توصيل بعد">{addButton}</EmptyState>

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-72">
            <TextInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث باسم المنطقة..."
              aria-label="بحث باسم المنطقة"
            />
          </div>
          <div className="sm:w-40">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="تصفية حسب الحالة"
            >
              <option value="all">الكل</option>
              <option value="active">مفعّلة</option>
              <option value="inactive">متوقفة</option>
            </Select>
          </div>
        </div>

        {filteredZones.length === 0 ? (
          <EmptyState message="لا توجد نتائج مطابقة" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-background text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الاسم</th>
                  <th className="px-4 py-3 text-start font-medium">سعر التوصيل</th>
                  <th className="px-4 py-3 text-start font-medium">ترتيب العرض</th>
                  <th className="px-4 py-3 text-start font-medium">آخر تعديل</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.map((zone) => {
                  const isBusy = busyId === zone.id
                  const shippingCost = Number(zone.shipping_cost) // Decimal string from the backend

                  return (
                    <tr
                      key={zone.id}
                      className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                    >
                      <td className="px-4 py-3 font-medium text-text">{zone.name}</td>
                      <td className="px-4 py-3 text-text">
                        {shippingCost === 0 ? (
                          <Badge variant="success">توصيل مجاني</Badge>
                        ) : (
                          formatPrice(shippingCost)
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{zone.display_order}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(zone.updated_at)}</td>
                      <td className="px-4 py-3">
                        {zone.is_active ? (
                          <Badge variant="success">مفعّلة</Badge>
                        ) : (
                          <Badge variant="neutral">متوقفة</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(zone)}
                            disabled={isBusy}
                            aria-label="تعديل"
                            title="تعديل"
                            className={iconButtonClass}
                          >
                            <Pencil size={18} />
                          </button>
                          {zone.is_active ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingZone(zone)}
                              disabled={isBusy}
                              aria-label="إيقاف"
                              title="إيقاف"
                              className={iconButtonClass}
                            >
                              <PowerOff size={18} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(zone)}
                              disabled={isBusy}
                              aria-label="تفعيل"
                              title="تفعيل"
                              className={iconButtonClass}
                            >
                              <Power size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مناطق التوصيل" description="إدارة مناطق التوصيل وسعر التوصيل لكل منطقة">
        {addButton}
      </PageHeader>

      {renderContent()}

      {isFormOpen && (
        <ShippingZoneForm
          zone={editingZone}
          zones={zones}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Backend gotchas: a customer mid-checkout on this zone gets a failed order; past orders keep their fee */}
      {deactivatingZone && (
        <ConfirmDialog
          title="إيقاف منطقة التوصيل"
          message="لن تظهر هذه المنطقة للعملاء عند إتمام الطلب، وأي عميل يُكمل طلبه عليها الآن سيفشل طلبه. الطلبات السابقة لن تتأثر، ويمكنك تفعيلها لاحقاً."
          confirmLabel="إيقاف"
          variant="danger"
          isLoading={busyId === deactivatingZone.id}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivatingZone(null)}
        />
      )}
    </div>
  )
}

export default ShippingZones
