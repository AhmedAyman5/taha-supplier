function TextInput({ hasError, type = 'text', ...props }) {
  const stateClasses = hasError
    ? 'border-error focus:border-error focus:ring-error/20'
    : 'border-border focus:border-primary focus:ring-primary/20'

  return (
    <input
      type={type}
      {...props}
      className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 ${stateClasses}`}
    />
  )
}

export default TextInput
