import { useState } from 'react'
import toast from 'react-hot-toast'
import { Send, TriangleAlert } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormField from '../../components/FormField'
import PageHeader from '../../components/PageHeader'
import Textarea from '../../components/Textarea'
import TextInput from '../../components/TextInput'
import { getErrorMessage } from '../../utils/errors'
import { sendBroadcast } from './notifications.api'
import NotificationPreview from './NotificationPreview'

// The backend has no max length — these limits keep the push readable on a phone screen
const TITLE_MAX = 65
const BODY_MAX = 240

const EMPTY_VALUES = { title: '', body: '' }

// A 201 can still mean nobody got the push, so the report is read in this order
function getReportStatus(report) {
  if (report.requested === 0) {
    return {
      className: 'bg-warning/10 text-warning',
      message: 'لا توجد أجهزة مسجلة حالياً، لم يصل الإشعار لأي أحد.',
    }
  }
  if (report.sent === 0) {
    return {
      className: 'bg-error/10 text-error',
      message:
        'لم يصل الإشعار لأي جهاز — غالباً خدمة الإشعارات (Firebase) غير مفعّلة على السيرفر. تواصل مع مطور الباك اند.',
    }
  }
  // Failed tokens are never removed by the backend, so some failures are normal (uninstalled apps)
  if (report.failed > 0) {
    return {
      className: 'bg-info/10 text-info',
      message: 'وصل الإشعار، وبعض الأجهزة لم تستلمه — غالباً لأن التطبيق حُذف منها، وهذا طبيعي.',
    }
  }
  return { className: 'bg-success/10 text-success', message: 'وصل الإشعار بنجاح.' }
}

function Notifications() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [report, setReport] = useState(null) // the last delivery report — lives only while the page is open

  const title = values.title.trim()
  const body = values.body.trim()

  function handleChange(event) {
    const { name, value } = event.target
    setValues({ ...values, [name]: value })
  }

  function validate() {
    const errors = {}
    if (!title) errors.title = 'عنوان الإشعار مطلوب'
    else if (title.length > TITLE_MAX) errors.title = `العنوان يجب ألا يزيد عن ${TITLE_MAX} حرفاً`
    if (body.length > BODY_MAX) errors.body = `النص يجب ألا يزيد عن ${BODY_MAX} حرفاً`
    return errors
  }

  // Submitting only opens the confirm dialog — nothing is sent until the admin confirms
  function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length === 0) setIsConfirmOpen(true)
  }

  async function handleSend() {
    setIsSending(true)
    try {
      const data = await sendBroadcast(values)
      setReport(data)
      setValues(EMPTY_VALUES) // cleared so the same broadcast can't be sent twice by accident
      if (data.sent > 0) toast.success('تم إرسال الإشعار')
      else toast.error('لم يصل الإشعار لأي جهاز')
    } catch (err) {
      toast.error(getErrorMessage(err)) // nothing was sent, so the form stays filled
    } finally {
      setIsSending(false)
      setIsConfirmOpen(false)
    }
  }

  const reportStatus = report && getReportStatus(report)

  return (
    <div className="space-y-6">
      <PageHeader title="الإشعارات" description="إرسال إشعار لجميع مستخدمي التطبيق" />

      <div className="flex gap-2 rounded-lg bg-warning/10 p-4 text-sm text-warning">
        <TriangleAlert size={18} className="shrink-0" />
        <p>
          يُرسل الإشعار لكل الأجهزة المسجلة في التطبيق (ومنها أجهزة العملاء المحظورين)، ولا يمكن إلغاؤه أو تعديله بعد
          الإرسال، ولا يتم حفظه في أي سجل.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* noValidate: our Arabic checks replace the browser's English validation popups */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-4 rounded-lg border border-border bg-surface p-5"
        >
          <div className="grid gap-1.5">
            <FormField label="العنوان" error={fieldErrors.title}>
              <TextInput
                name="title"
                value={values.title}
                onChange={handleChange}
                hasError={Boolean(fieldErrors.title)}
              />
            </FormField>
            <p className="text-xs text-text-muted">
              {title.length}/{TITLE_MAX}
            </p>
          </div>

          <div className="grid gap-1.5">
            <FormField label="نص الإشعار" error={fieldErrors.body}>
              <Textarea name="body" value={values.body} onChange={handleChange} hasError={Boolean(fieldErrors.body)} />
            </FormField>
            <p className="text-xs text-text-muted">
              {body.length}/{BODY_MAX}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSending}>
              <Send size={18} />
              {isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </Button>
          </div>
        </form>

        <NotificationPreview title={title} body={body} />
      </div>

      {report && (
        <div className="space-y-2">
          <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-base font-semibold text-text">نتيجة آخر إرسال</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-text-secondary">الأجهزة المستهدفة</p>
                <p className="text-2xl font-bold text-text">{report.requested}</p>
                <p className="text-xs text-text-muted">العميل الواحد قد يملك أكثر من جهاز</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-text-secondary">تم الإرسال</p>
                <p className="text-2xl font-bold text-text">{report.sent}</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-text-secondary">فشل</p>
                <p className="text-2xl font-bold text-text">{report.failed}</p>
              </div>
            </div>

            <p className={`rounded-md px-3 py-2 text-sm ${reportStatus.className}`}>{reportStatus.message}</p>
          </div>
          <p className="text-xs text-text-muted">هذا التقرير لا يُحفظ، وسيختفي عند مغادرة الصفحة.</p>
        </div>
      )}

      {isConfirmOpen && (
        <ConfirmDialog
          title="تأكيد الإرسال"
          message={`سيتم إرسال الإشعار «${title}» لكل مستخدمي التطبيق الآن، ولا يمكن التراجع بعد الإرسال.`}
          confirmLabel={isSending ? 'جاري الإرسال...' : 'إرسال الآن'}
          variant="primary"
          isLoading={isSending}
          onConfirm={handleSend}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default Notifications
