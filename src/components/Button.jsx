const VARIANT_CLASSES = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-text hover:bg-background',
  danger: 'bg-error text-white hover:bg-error/90',
}

// type defaults to "button" so a button inside a <form> never submits it by accident
function Button({ variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
    />
  )
}

export default Button
