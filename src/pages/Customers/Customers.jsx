import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import FormField from '../../components/FormField'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import Select from '../../components/Select'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getCustomers } from './customers.api'

const EMPTY_FILTERS = { search: '', status: '' }

function Customers() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true) // first load only — shows the full loading card
  const [isFetching, setIsFetching] = useState(false) // later loads — the table stays, a small hint shows
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0) // bump to retry

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('') // what is typed; applied to filters.search on submit

  useEffect(() => {
    let ignore = false // drop late responses when the page or filters change quickly
    async function load() {
      try {
        const data = await getCustomers(page, filters)
        if (!ignore) {
          setCustomers(data.items)
          setLastPage(data.last_page)
          setTotal(data.total)
          setError('')
        }
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
  }, [page, filters, reloadKey])

  function handleRetry() {
    setError('')
    setIsLoading(true)
    setReloadKey(reloadKey + 1)
  }

  // Any filter change goes back to page 1
  function changeFilter(name, value) {
    setFilters({ ...filters, [name]: value })
    setPage(1)
    setIsFetching(true)
  }

  // Search runs on Enter / the «بحث» button, not on every keystroke
  function handleSearchSubmit(event) {
    event.preventDefault()
    changeFilter('search', searchInput.trim())
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
    setSearchInput('')
    setPage(1)
    setIsFetching(true)
  }

  function handlePageChange(newPage) {
    setPage(newPage)
    setIsFetching(true)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  function renderContent() {
    if (isLoading) return <LoadingState />
    if (error) return <ErrorState message={error} onRetry={handleRetry} />
    if (customers.length === 0) {
      return <EmptyState message={hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا يوجد عملاء بعد'} />
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-background text-xs font-medium text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-start font-medium">العميل</th>
                <th className="px-4 py-3 text-start font-medium">الهاتف</th>
                <th className="px-4 py-3 text-start font-medium">البريد الإلكتروني</th>
                <th className="px-4 py-3 text-start font-medium">الطلبات</th>
                <th className="px-4 py-3 text-start font-medium">الملغاة</th>
                <th className="px-4 py-3 text-start font-medium">تاريخ التسجيل</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{customer.name}</p>
                    {customer.shop_name && <p className="text-xs text-text-muted">{customer.shop_name}</p>}
                  </td>
                  {/* dir="ltr": otherwise "+2010…" shows as "…2010+" in RTL */}
                  <td className="px-4 py-3 text-text-secondary">
                    <span dir="ltr">{customer.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {customer.email ? <span dir="ltr">{customer.email}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-text">{customer.orders_count}</td>
                  <td className={`px-4 py-3 ${customer.cancelled_orders_count > 0 ? 'text-error' : 'text-text'}`}>
                    {customer.cancelled_orders_count}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(customer.created_at)}</td>
                  <td className="px-4 py-3">
                    {customer.status === 'BANNED' ? (
                      <Badge variant="error">محظور</Badge>
                    ) : (
                      <Badge variant="success">نشط</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
                      عرض التفاصيل
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} lastPage={lastPage} total={total} onPageChange={handlePageChange} />
      </div>
    )
  }

  // No add button: customers register through the mobile app
  return (
    <div className="space-y-6">
      <PageHeader title="العملاء" description="البحث في عملاء التطبيق وإدارة حظرهم" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 sm:w-[28rem]">
          <TextInput
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث بالاسم أو اسم المحل أو الهاتف أو البريد الإلكتروني"
            aria-label="بحث بالاسم أو اسم المحل أو الهاتف أو البريد الإلكتروني"
          />
          <Button type="submit" variant="secondary">
            <Search size={18} />
            بحث
          </Button>
        </form>
        <div className="sm:w-48">
          <FormField label="الحالة">
            <Select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}>
              <option value="">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="BANNED">محظور</option>
            </Select>
          </FormField>
        </div>
        {hasActiveFilters && (
          <Button variant="secondary" onClick={handleClearFilters}>
            مسح الفلاتر
          </Button>
        )}
        {isFetching && <p className="text-xs text-text-muted sm:self-center">جاري تحميل البيانات...</p>}
      </div>

      {renderContent()}
    </div>
  )
}

export default Customers
