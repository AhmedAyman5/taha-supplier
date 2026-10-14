import { PAYMENT_METHOD } from '../../constants/orders'
import { formatDateTime, formatPrice } from '../../utils/format'

// Hidden on screen; window.print() prints only this (the rest of the page is print:hidden).
// Plain black on white so it stays readable on any printer
function OrderPrintSheet({ order }) {
  return (
    <div className="hidden space-y-6 text-sm text-black print:block">
      <div className="flex items-start justify-between gap-4 border-b border-black pb-4">
        <div>
          <p className="text-xl font-bold">طه للتوريدات</p>
          <p>طلب #{order.id}</p>
        </div>
        <p>{formatDateTime(order.created_at)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div>
          <dt className="font-semibold">العميل</dt>
          <dd>{order.user?.name}</dd>
        </div>
        <div>
          <dt className="font-semibold">اسم المحل</dt>
          <dd>{order.user?.shop_name || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold">الهاتف</dt>
          <dd>
            <span dir="ltr">{order.user?.phone}</span>
          </dd>
        </div>
        <div>
          <dt className="font-semibold">المنطقة</dt>
          <dd>{order.shippingZone?.name || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-semibold">عنوان التوصيل</dt>
          <dd>{order.delivery_address}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-semibold">ملاحظات العميل</dt>
          <dd>{order.delivery_notes || 'لا توجد ملاحظات'}</dd>
        </div>
      </dl>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="py-2 text-start font-semibold">المنتج</th>
            <th className="py-2 text-start font-semibold">الوحدة</th>
            <th className="py-2 text-start font-semibold">الكمية</th>
            <th className="py-2 text-start font-semibold">سعر الوحدة</th>
            <th className="py-2 text-start font-semibold">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-black/20">
              <td className="py-2">{item.product_name}</td>
              <td className="py-2">{item.product_unit}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">{formatPrice(item.unit_price)}</td>
              <td className="py-2">{formatPrice(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ms-auto grid w-64 gap-1">
        <div className="flex justify-between gap-4">
          <dt>المجموع</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between gap-4">
            <dt>الخصم{order.coupon && ` (كوبون ${order.coupon.code})`}</dt>
            <dd>- {formatPrice(order.discount_amount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt>التوصيل</dt>
          <dd>{order.shipping_fee === 0 ? 'مجاني' : formatPrice(order.shipping_fee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-black pt-1 font-bold">
          <dt>الإجمالي</dt>
          <dd>{formatPrice(order.total_amount)}</dd>
        </div>
      </dl>

      <p>
        <span className="font-semibold">طريقة الدفع: </span>
        {PAYMENT_METHOD[order.payment_method]}
      </p>
    </div>
  )
}

export default OrderPrintSheet
