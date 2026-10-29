import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  title: string
  children: ReactNode
  actions: ReactNode
  onClose?: () => void
}

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({ open, title, children, actions, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
      onClick={(e) => {
        // Click on the backdrop closes the dialog.
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="dialog__body">
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        <div className="dialog__content">{children}</div>
        <div className="dialog__actions">{actions}</div>
      </div>
    </dialog>
  )
}
