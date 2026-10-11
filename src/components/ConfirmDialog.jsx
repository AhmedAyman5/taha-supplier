import { LoaderCircle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  variant = 'danger',
  isLoading,
  onConfirm,
  onCancel,
}) {
  // Closing mid-request would hide the result of an action that is still running
  function handleClose() {
    if (!isLoading) onCancel()
  }

  return (
    <Modal
      title={title}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
            {isLoading && <LoaderCircle size={18} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  )
}

export default ConfirmDialog
