import { Bell } from 'lucide-react'

// A rough look of the push on the phone, so the admin sees how long the text is before sending
function NotificationPreview({ title, body }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-text">معاينة الإشعار</h2>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-light text-primary">
            <Bell size={14} />
          </span>
          <span className="text-xs text-text-muted">طه للتوريدات</span>
        </div>

        <p className={`text-sm font-semibold break-words ${title ? 'text-text' : 'text-text-muted'}`}>
          {title || 'عنوان الإشعار'}
        </p>
        <p className={`line-clamp-3 text-sm break-words ${body ? 'text-text-secondary' : 'text-text-muted'}`}>
          {body || 'نص الإشعار'}
        </p>
      </div>
    </div>
  )
}

export default NotificationPreview
