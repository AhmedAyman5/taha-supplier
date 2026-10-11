// children: the <option> elements
function Select({ hasError, children, ...props }) {
  const stateClasses = hasError
    ? 'border-error focus:border-error focus:ring-error/20'
    : 'border-border focus:border-primary focus:ring-primary/20'

  return (
    <select
      {...props}
      className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 ${stateClasses}`}
    >
      {children}
    </select>
  )
}

export default Select
