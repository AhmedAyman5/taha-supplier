import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { login } from '../../services/auth'
import { isLoggedIn } from '../../services/authStorage'
import { getErrorMessage } from '../../utils/errors'

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

function Login() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (isLoggedIn()) return <Navigate to="/" replace />

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    // Same rules as the backend LoginDto: a valid email and a password of 8+ characters
    const email = values.email.trim()
    const errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'أدخل بريداً إلكترونياً صحيحاً'
    if (values.password.length < 8) errors.password = 'كلمة المرور يجب ألا تقل عن 8 أحرف'
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length > 0) return

    setIsSending(true)
    try {
      await login(email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        getErrorMessage(err, {
          401: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          403: 'هذا الحساب محظور',
        }),
      )
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-xl font-bold text-primary">طه للتوريدات</h1>
          <p className="text-sm text-text-secondary">تسجيل الدخول إلى لوحة التحكم</p>
        </div>

        {/* noValidate: our Arabic checks replace the browser's English validation popups */}
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              value={values.email}
              onChange={handleChange}
              className={inputClass}
            />
            {fieldErrors.email && <p className="text-xs text-error">{fieldErrors.email}</p>}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              className={inputClass}
            />
            {fieldErrors.password && <p className="text-xs text-error">{fieldErrors.password}</p>}
          </div>

          {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-hover disabled:opacity-50"
          >
            {isSending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
