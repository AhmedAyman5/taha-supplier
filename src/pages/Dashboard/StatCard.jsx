import { Link } from 'react-router'
import Badge from '../../components/Badge'

// The whole card is a link to the page where the admin acts on this number
function StatCard({ title, value, subtitle, icon: Icon, to, needsAction, hasError }) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-secondary">{title}</p>
        <span className="rounded-md bg-primary-light p-2 text-primary">
          <Icon size={20} />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {hasError ? (
          <p className="text-sm text-error">تعذر التحميل</p>
        ) : (
          <p className="text-2xl font-bold text-text">{value}</p>
        )}
        {needsAction && <Badge variant="warning">يحتاج إجراء</Badge>}
      </div>

      {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
    </Link>
  )
}

export default StatCard
