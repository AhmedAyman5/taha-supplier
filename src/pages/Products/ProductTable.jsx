import { useNavigate } from 'react-router'
import { ImageIcon, Pencil, Power, PowerOff } from 'lucide-react'
import Badge from '../../components/Badge'
import { formatPrice } from '../../utils/format'
import { getImageUrl } from '../../utils/images'

const iconButtonClass =
  'rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background hover:text-primary disabled:opacity-50'

// areOptionsLoaded: the "hidden section" and "deleted brand" warnings need the option lists,
// so they are shown only when those lists loaded successfully
function ProductTable({ products, subCategories, brands, areOptionsLoaded, busyId, onDeactivate, onActivate }) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full whitespace-nowrap">
        <thead className="bg-background text-xs font-medium text-text-secondary">
          <tr>
            <th className="px-4 py-3 text-start font-medium">الصورة</th>
            <th className="px-4 py-3 text-start font-medium">المنتج</th>
            <th className="px-4 py-3 text-start font-medium">القسم الفرعي</th>
            <th className="px-4 py-3 text-start font-medium">العلامة التجارية</th>
            <th className="px-4 py-3 text-start font-medium">السعر</th>
            <th className="px-4 py-3 text-start font-medium">العلامات</th>
            <th className="px-4 py-3 text-start font-medium">الحالة</th>
            <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const imageUrl = getImageUrl(product.image)
            const isBusy = busyId === product.id

            // A product under a hidden sub-category (or a hidden parent category) doesn't show in the app
            const subCategory = subCategories.find((item) => item.id === product.subcategory_id)
            const isSectionHidden =
              areOptionsLoaded && subCategory && (subCategory.is_hidden || subCategory.category.is_hidden)

            // GET /brand/admin excludes soft-deleted brands, but their products keep the brand
            const isBrandDeleted = areOptionsLoaded && !brands.some((brand) => brand.id === product.brand_id)

            const hasTags = product.is_new || product.is_best_seller || isSectionHidden

            return (
              <tr
                key={product.id}
                className="border-b border-border-light text-sm last:border-b-0 hover:bg-background"
              >
                <td className="px-4 py-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-text-muted">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{product.name}</p>
                  <p className="text-xs text-text-muted">{product.unit}</p>
                </td>
                <td className="px-4 py-3 text-text-secondary">{product.subCategory?.name}</td>
                <td className="px-4 py-3 text-text-secondary">
                  <div className="flex items-center gap-2">
                    {product.brand?.name}
                    {isBrandDeleted && <Badge variant="warning">العلامة التجارية محذوفة</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {/* Admin money comes back as Decimal strings ("520.00"); formatPrice parses them */}
                  {product.discount_price ? (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-text">{formatPrice(product.discount_price)}</p>
                        <p className="text-xs text-text-muted line-through">{formatPrice(product.price)}</p>
                      </div>
                      <Badge variant="error">-{Math.round(Number(product.discount_percentage))}%</Badge>
                    </div>
                  ) : (
                    <span className="text-text">{formatPrice(product.price)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {hasTags ? (
                    <div className="flex items-center gap-1.5">
                      {product.is_new && <Badge variant="info">جديد</Badge>}
                      {product.is_best_seller && <Badge variant="warning">الأكثر مبيعاً</Badge>}
                      {isSectionHidden && <Badge variant="warning">القسم مخفي</Badge>}
                    </div>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.is_available ? (
                    <Badge variant="success">متاح</Badge>
                  ) : (
                    <Badge variant="neutral">غير متاح</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/products/${product.id}/edit`)}
                      disabled={isBusy}
                      aria-label="تعديل"
                      title="تعديل"
                      className={iconButtonClass}
                    >
                      <Pencil size={18} />
                    </button>
                    {product.is_available ? (
                      <button
                        type="button"
                        onClick={() => onDeactivate(product)}
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
                        onClick={() => onActivate(product)}
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
  )
}

export default ProductTable
