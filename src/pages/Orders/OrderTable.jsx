import { useNavigate } from 'react-router'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants/orders'
import { formatDateTime, formatPrice } from '../../utils/format'

function OrderTable({ orders }) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full whitespace-nowrap">
        <thead className="bg-background text-xs font-medium text-text-secondary">
          <tr>
            <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
            <th className="px-4 py-3 text-start font-medium">العميل</th>
            <th className="px-4 py-3 text-start font-medium">المنطقة</th>
            <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
            <th className="px-4 py-3 text-start font-medium">الدفع</th>
            <th className="px-4 py-3 text-start font-medium">الحالة</th>
            <th className="px-4 py-3 text-start font-medium">التاريخ</th>
            <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            // A cancelled CARD order keeps payment_status PENDING, so its payment badge would mislead.
            // CASH orders stay PENDING forever, so they never get one
            const isCancelled = order.status === 'CANCELLED' || order.status === 'CLIENTCANCELLED'
            const paymentStatus =
              order.payment_method === 'CARD' && !isCancelled ? PAYMENT_STATUS[order.payment_status] : null

            return (
              <tr key={order.id} className="border-b border-border-light text-sm last:border-b-0 hover:bg-background">
                <td className="px-4 py-3 font-medium text-text">#{order.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{order.user?.name}</p>
                  {order.user?.shop_name && <p className="text-xs text-text-muted">{order.user.shop_name}</p>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{order.shippingZone?.name}</td>
                {/* Order money is already a whole number (not a Decimal string) */}
                <td className="px-4 py-3 text-text">{formatPrice(order.total_amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">{PAYMENT_METHOD[order.payment_method]}</span>
                    {paymentStatus && <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ORDER_STATUS[order.status].variant}>{ORDER_STATUS[order.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(order.created_at)}</td>
                <td className="px-4 py-3">
                  <Button variant="secondary" onClick={() => navigate(`/orders/${order.id}`)}>
                    عرض
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrderTable
