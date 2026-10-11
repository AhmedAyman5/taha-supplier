// Checkboxes grouped by parent category. options: rows from GET /sub-category/admin
// (each has category: { id, name, is_hidden }); selectedIds: the checked sub-category ids
function SubCategoryPicker({ options, selectedIds, onChange }) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        لا توجد أقسام فرعية بعد — أضفها من صفحة الأقسام الفرعية
      </p>
    )
  }

  // Group in the order the rows arrive: [{ category, items: [...] }, ...]
  const groups = []
  options.forEach((option) => {
    let group = groups.find((item) => item.category.id === option.category.id)
    if (!group) {
      group = { category: option.category, items: [] }
      groups.push(group)
    }
    group.items.push(option)
  })

  function handleToggle(id) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((selectedId) => selectedId !== id))
    else onChange([...selectedIds, id])
  }

  return (
    <div className="grid gap-1.5">
      <div className="grid max-h-64 gap-4 overflow-y-auto rounded-md border border-border p-3">
        {groups.map((group) => (
          <div key={group.category.id} className="grid gap-2">
            <p className="text-xs font-medium text-text-secondary">{group.category.name}</p>
            {group.items.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  className="h-4 w-4 accent-primary"
                />
                {option.name}
                {/* Hidden ones can still be linked; they just don't show in the app */}
                {(option.is_hidden || option.category.is_hidden) && (
                  <span className="text-text-muted">(مخفي)</span>
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">تم اختيار {selectedIds.length}</p>
    </div>
  )
}

export default SubCategoryPicker
