import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Package, Receipt, RefreshCw, ShoppingCart, Users } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { ORDER_STATUS } from '../../constants/orders'
import { getUser } from '../../services/authStorage'
import { formatDateTime, formatPrice } from '../../utils/format'
import { getHomeStats, getLatestOrders } from './dashboard.api'
import StatCard from './StatCard'

// The admin's LOCAL day as "YYYY-MM-DD" ('en-CA' formats dates exactly that way)
function getToday() {
  return new Date().toLocaleDateString('en-CA')
}

function Dashboard() {
  const user = getUser() // null with the dev login bypass

  const [stats, setStats] = useState(null)
  const [latestOrders, setLatestOrders] = useState([])
  const [latestOrdersError, setLatestOrdersError] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // first load only — shows the full loading card
  const [isRefreshing, setIsRefreshing] = useState(false) // later loads — the page stays visible
  const [reloadKey, setReloadKey] = useState(0) // bump to reload everything

  useEffect(() => {
    let ignore = false
    async function load() {
      // getHomeStats never fails (each number carries its own error), so only the orders can reject
      const [statsResult, ordersResult] = await Promise.allSettled([getHomeStats(getToday()), getLatestOrders()])
      if (ignore) return
      setStats(statsResult.value)
      if (ordersResult.status === 'fulfilled') {
        setLatestOrders(ordersResult.value)
        setLatestOrdersError(false)
      } else {
        setLatestOrdersError(true)
      }
      setIsLoading(false)
      setIsRefreshing(false)
    }
    load()
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function handleRefresh() {
    setIsRefreshing(true)
    setReloadKey(reloadKey + 1)
  }

  function renderLatestOrders() {
    if (latestOrdersError) {
      return (
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-sm text-error">تعذر تحميل آخر الطلبات</p>
          <Button variant="secondary" onClick={handleRefresh} disabled={isRefreshing}>
            إعادة المحاولة
          </Button>
        </div>
      )
    }
    if (latestOrders.length === 0) {
      return <p className="p-5 text-center text-sm text-text-secondary">لا توجد طلبات بعد</p>
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-background text-xs font-medium text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
              <th className="px-4 py-3 text-start font-medium">العميل</th>
              <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {latestOrders.map((order) => (
              <tr key={order.id} className="border-b border-border-light text-sm last:border-b-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link to={`/orders/${order.id}`} className="font-medium text-primary hover:underline">
                    #{order.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text">{order.user?.name}</td>
                {/* Order money is already a whole number (not a Decimal string) */}
                <td className="px-4 py-3 text-text">{formatPrice(order.total_amount)}</td>
                <td className="px-4 py-3">
                  <Badge variant={ORDER_STATUS[order.status].variant}>{ORDER_STATUS[order.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderContent() {
    if (isLoading) return <LoadingState />

    const today = getToday()
    const { newOrders, receiptsToReview, todayOrders, customers, bannedCustomers } = stats
    const { availableProducts, unavailableProducts } = stats

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="طلبات جديدة تحتاج تأكيد"
            value={newOrders.value}
            icon={ShoppingCart}
            to="/orders?tab=new"
            needsAction={newOrders.value > 0}
            hasError={newOrders.error}
          />
          <StatCard
            title="إيصالات تحويل تحتاج مراجعة"
            value={receiptsToReview.value}
            icon={Receipt}
            to="/orders?tab=receipts"
            needsAction={receiptsToReview.value > 0}
            hasError={receiptsToReview.error}
          />
          <StatCard
            title="طلبات اليوم"
            value={todayOrders.value}
            icon={CalendarDays}
            to={`/orders?from_date=${today}&to_date=${today}`}
            hasError={todayOrders.error}
          />
          <StatCard
            title="العملاء"
            value={customers.value}
            subtitle={bannedCustomers.error ? '' : `منهم ${bannedCustomers.value} محظور`}
            icon={Users}
            to="/customers"
            hasError={customers.error}
          />
          <StatCard
            title="المنتجات المتاحة"
            value={availableProducts.value}
            subtitle={unavailableProducts.error ? '' : `و${unavailableProducts.value} غير متاح`}
            icon={Package}
            to="/products"
            hasError={availableProducts.error}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border p-5">
            <h2 className="text-base font-semibold text-text">آخر الطلبات</h2>
            <Link to="/orders" className="text-sm font-medium text-primary hover:underline">
              عرض كل الطلبات
            </Link>
          </div>
          {renderLatestOrders()}
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الرئيسية" description="نظرة سريعة على ما يحتاج انتباهك اليوم">
        <Button variant="secondary" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          تحديث
        </Button>
      </PageHeader>

      <p className="text-base font-semibold text-text">{user ? `أهلاً، ${user.name}` : 'أهلاً بك'}</p>

      {renderContent()}
    </div>
  )
}

export default Dashboard
