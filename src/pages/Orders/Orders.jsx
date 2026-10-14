import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants/orders'
import { getErrorMessage } from '../../utils/errors'
import { getOrders, getReviewCount } from './orders.api'
import OrderTable from './OrderTable'

const TABS = [
  { value: 'all', label: 'كل الطلبات' },
  { value: 'new', label: 'طلبات جديدة' },
  { value: 'receipts', label: 'إيصالات تحتاج مراجعة' },
]

// The URL params «مسح الفلاتر» clears (the tab is not one of them)
const FILTER_KEYS = ['status', 'payment_method', 'payment_status', 'from_date', 'to_date', 'user_id']

function getTab(params) {
  const tab = params.get('tab')
  return tab === 'new' || tab === 'receipts' ? tab : 'all'
}

// The filters live in the URL (links like /orders?tab=new or /orders?user_id=5, and the back button).
// This turns the URL into what the backend gets — the tab decides some of the filters
function getRequestFilters(params) {
  const page = Number(params.get('page'))
  const filters = {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    status: params.get('status') || '',
    payment_method: params.get('payment_method') || '',
    payment_status: params.get('payment_status') || '',
    from_date: params.get('from_date') || '',
    to_date: params.get('to_date') || '',
    user_id: params.get('user_id') || '',
  }

  const tab = getTab(params)
  if (tab === 'new') filters.status = 'PENDING'
  if (tab === 'receipts') {
    // No status here: a status filter would make the backend ignore exclude_cancelled
    filters.status = ''
    filters.payment_method = 'CARD'
    filters.payment_status = 'PENDING'
    filters.exclude_cancelled = '1'
  }
  return filters
}

function Orders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()

  const [orders, setOrders] = useState([])
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true) // first load only — shows the full loading card
  const [isFetching, setIsFetching] = useState(false) // later loads — the table stays, a small hint shows
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to retry
  const [reviewCount, setReviewCount] = useState(null) // null = not loaded, the tab shows no number

  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberError, setOrderNumberError] = useState('')

  useEffect(() => {
    let ignore = false // drop late responses when the filters or page change quickly
    async function load() {
      const filters = getRequestFilters(new URLSearchParams(queryString))
      try {
        const data = await getOrders(filters)
        if (ignore) return
        // e.g. receipts reviewed from page 2, then back here: page 2 may not exist anymore
        if (data.items.length === 0 && filters.page > data.last_page) {
          const params = new URLSearchParams(queryString)
          params.set('page', data.last_page)
          setSearchParams(params, { replace: true })
          return
        }
        setOrders(data.items)
        setLastPage(data.last_page)
        setTotal(data.total)
        setError('')
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err))
      } finally {
        if (!ignore) {
          setIsLoading(false)
          setIsFetching(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [queryString, reloadKey, setSearchParams])

  useEffect(() => {
    let ignore = false
    async function loadReviewCount() {
      try {
        const count = await getReviewCount()
        if (!ignore) setReviewCount(count)
      } catch {
        // the tab still works without the number
      }
    }
    loadReviewCount()
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  // Every filter change goes through here: it rewrites the URL and goes back to page 1
  function updateParams(changes) {
    const params = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('page')
    if (params.toString() === queryString) return // same URL → no new request, so no loading hint
    setSearchParams(params)
    setIsFetching(true)
  }

  // Dates and the customer stay; the tab's own filters replace the selects
  function handleTabChange(newTab) {
    updateParams({ tab: newTab === 'all' ? '' : newTab, status: '', payment_method: '', payment_status: '' })
  }

  function handleClearFilters() {
    updateParams({ status: '', payment_method: '', payment_status: '', from_date: '', to_date: '', user_id: '' })
  }

  function handlePageChange(newPage) {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage)
    setSearchParams(params)
    setIsFetching(true)
  }

  // The backend has no order search, so this is the quick way to open one order
  function handleGoToOrder(event) {
    event.preventDefault()
    const value = orderNumber.trim()
    if (!/^\d+$/.test(value) || Number(value) === 0) {
      setOrderNumberError('اكتب رقم طلب صحيح')
      return
    }
    navigate(`/orders/${Number(value)}`)
  }

  const tab = getTab(searchParams)
  const filters = getRequestFilters(searchParams) // the locked selects show what the tab sends
  const page = filters.page
  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.get(key))

  // The date picker blocks an inverted range through min / max, but a typed date can still get there
  const dateError =
    filters.from_date && filters.to_date && filters.to_date < filters.from_date
      ? 'تاريخ النهاية يجب أن يكون في نفس يوم البداية أو بعده'
      : ''

  // The list has no customer name of its own — take it from the rows (all of them are this customer's)
  const customerName = orders[0]?.user?.name || `#${filters.user_id}`

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (orders.length === 0) {
      let message = 'لا توجد طلبات بعد'
      if (tab === 'receipts') message = 'لا توجد إيصالات تحتاج مراجعة حالياً'
      else if (hasActiveFilters || tab === 'new') message = 'لا توجد طلبات مطابقة'
      return <EmptyState message={message} />
    }

    return (
      <div className="space-y-4">
        <OrderTable orders={orders} />
        <Pagination page={page} lastPage={lastPage} total={total} onPageChange={handlePageChange} />
      </div>
    )
  }

  // No add button: customers place orders from the mobile app
  return (
    <div className="space-y-6">
      <PageHeader title="الطلبات" description="متابعة الطلبات ومراجعة إيصالات التحويل البنكي">
        <form onSubmit={handleGoToOrder} className="grid gap-1.5">
          <div className="flex gap-2">
            <div className="w-40">
              <TextInput
                type="number"
                dir="ltr"
                min="1"
                value={orderNumber}
                onChange={(event) => {
                  setOrderNumber(event.target.value)
                  setOrderNumberError('')
                }}
                placeholder="اذهب لطلب رقم"
                aria-label="اذهب لطلب رقم"
                hasError={Boolean(orderNumberError)}
              />
            </div>
            <Button type="submit" variant="secondary">
              فتح
            </Button>
          </div>
          {orderNumberError && <p className="text-xs text-error">{orderNumberError}</p>}
        </form>
      </PageHeader>

      <div className="space-y-3">
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((item) => {
            const isActive = item.value === tab
            const label =
              item.value === 'receipts' && reviewCount !== null ? `${item.label} (${reviewCount})` : item.label
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleTabChange(item.value)}
                className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="حالة الطلب">
            <Select
              value={filters.status}
              onChange={(event) => updateParams({ status: event.target.value })}
              disabled={tab !== 'all'}
            >
              <option value="">الكل</option>
              {Object.entries(ORDER_STATUS).map(([value, status]) => (
                <option key={value} value={value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="طريقة الدفع">
            <Select
              value={filters.payment_method}
              onChange={(event) => updateParams({ payment_method: event.target.value })}
              disabled={tab === 'receipts'}
            >
              <option value="">الكل</option>
              {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="حالة الدفع">
            <Select
              value={filters.payment_status}
              onChange={(event) => updateParams({ payment_status: event.target.value })}
              disabled={tab === 'receipts'}
            >
              <option value="">الكل</option>
              {Object.entries(PAYMENT_STATUS).map(([value, status]) => (
                <option key={value} value={value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="من تاريخ">
            <TextInput
              type="date"
              value={filters.from_date}
              max={filters.to_date || undefined}
              onChange={(event) => updateParams({ from_date: event.target.value })}
            />
          </FormField>
          <FormField label="إلى تاريخ" error={dateError}>
            <TextInput
              type="date"
              value={filters.to_date}
              min={filters.from_date || undefined}
              onChange={(event) => updateParams({ to_date: event.target.value })}
              hasError={Boolean(dateError)}
            />
          </FormField>
        </div>

        {(filters.user_id || hasActiveFilters || isFetching) && (
          <div className="flex flex-wrap items-center gap-3">
            {filters.user_id && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-sm text-primary">
                طلبات العميل: {customerName}
                <button
                  type="button"
                  onClick={() => updateParams({ user_id: '' })}
                  className="text-xs font-medium hover:underline"
                >
                  إزالة
                </button>
              </div>
            )}
            {hasActiveFilters && (
              <Button variant="secondary" onClick={handleClearFilters}>
                مسح الفلاتر
              </Button>
            )}
            {isFetching && <p className="text-xs text-text-muted">جاري تحميل البيانات...</p>}
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  )
}

export default Orders
