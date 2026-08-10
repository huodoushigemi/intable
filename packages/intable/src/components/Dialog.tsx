import { delay } from "es-toolkit"
import { Portal } from "solid-js/web"

export const Dialog = (props: {
  title?: string
  children?: any
  class?: string
  style?: string
  onCancel?: () => void
  onClose?: () => void
  onOk?: () => void
}) => {
  const cancel = () => props.onCancel?.()
  return (
    <Portal mount={document.body}>
      <dialog class={`in-dialog fixed inset-0 ma backdrop:bg-gray/50 ${props.class}`} style={props.style} ref={e => delay(0).then(() => e?.showModal?.())} onClick={e => e.target == e.currentTarget && cancel()} onCancel={cancel} onClose={props.onClose}>
        <div class='p-3 border-b border-gray/20'>{props.title}</div>
        {props.children}
        <div class='flex justify-end gap-2 p-3 border-t border-gray/20'>
          <button type='button' class='px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm' onClick={cancel}>
            Cancel
          </button>
          <button type='button' class='px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm' onClick={props.onOk}>
            Confirm
          </button>
        </div>
      </dialog>
    </Portal>
  )
}