// The <label> wraps the input, so clicking the label focuses it without needing ids
function FormField({ label, error, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-text">{label}</span>
        {children}
      </label>
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  )
}

export default FormField
