import PageHeader from '../../components/PageHeader'

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="الرئيسية" />
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-text-secondary">هذه الصفحة قيد التنفيذ</p>
      </div>
    </div>
  )
}

export default Dashboard
