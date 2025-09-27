import { createEffect, mergeProps } from 'solid-js'
import { createEventListener } from '@solid-primitives/event-listener'
import { createPointerList } from '@solid-primitives/pointer'
import { access, type MaybeAccessor } from '@solid-primitives/utils'
import { createMutationObserver } from '@solid-primitives/mutation-observer'

interface UseDirOptions {
  ref: MaybeAccessor<HTMLElement | undefined>,
  list?: MaybeAccessor<HTMLElement | undefined>,
  loop?: boolean
  options?: EventListenerOptions
  defaultFirst?: boolean
}

export function useDir(options: UseDirOptions) {
  options = mergeProps({ loop: true }, options)
  const list = () => access(options.list) ?? access(options.ref)
  const ref = () => access(options.ref) ?? access(options.list)

  createEffect(() => {
    if (ref().tabIndex > -1) return
    ref().tabIndex = 0
  })

  createEventListener(ref, 'keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return

    e.stopPropagation()
    e.preventDefault()

    let hover = list()?.querySelector('.hover')
    
    if (e.key == 'Enter') {
      hover?.click()
      return
    }

    let index = (
      e.key == 'ArrowDown' ? hover ? +hover?.getAttribute('data-index')! + 1 : 0 :
      e.key == 'ArrowUp' ? hover ? +hover?.getAttribute('data-index')! - 1 : -1 :
      0
    )

    const el = list()?.querySelector(`[data-index='${index}']`)
    if (!el) {
      if (options.loop) {
        hover?.classList.remove('hover')
        index >= 0
          ? list()?.querySelector(`[data-index='0']`)?.classList.add('hover')
          : [...list()?.querySelectorAll(`[data-index]`)].at(-1)?.classList.add('hover')
      }
    } else {
      // list()?.querySelector(`[data-index=0]`)!
      hover?.classList.remove('hover')
      el.classList.add('hover')
    }
  }, options.options)

  createEffect(() => {
    if (!options.defaultFirst) return
    const el = list()
    if (!el) return
    const hover = () => {
      if (el.querySelector('.hover')) return
      el.querySelector(`[data-index]`)?.classList.add('hover')
    }
    createMutationObserver(el, { childList: true }, hover)
    hover()
  })

  createEventListener(list, 'mouseover', () => {
    list()?.querySelector('.hover')?.classList.remove('hover')
  })
}

export function VDir(el: HTMLElement, options) {
  useDir({ ...options(), list: el })
}