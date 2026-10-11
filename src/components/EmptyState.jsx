// children: an optional action, e.g. the page's add button
function EmptyState({ message, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
      {children}
    </div>
  )
}

export default EmptyState
