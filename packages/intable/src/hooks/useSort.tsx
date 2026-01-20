import { createMutable, reconcile } from 'solid-js/store'
import { mergeProps, Portal } from 'solid-js/web'

import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { access, type MaybeAccessor } from '@solid-primitives/utils'
import { findAsync, log } from '../utils'

type Awaitable<T> = T | Promise<T>;

interface UseSortOption {
  enable?: boolean
  guideLine: any
  draggable: (el: HTMLElement) => Awaitable<boolean>
  dragover: (el: HTMLElement) => boolean
  children: (el: HTMLElement) => HTMLElement[]
  dragend: () => void
}

export const useSort = (el: MaybeAccessor<HTMLElement | undefined>, opt: UseSortOption) => {
  opt = mergeProps({ enable: true } as UseSortOption, opt)
  let count = 0

  createEventListenerMap(() => opt.enable ? access(el) : void 0, {
    async pointerdown(e) {
      const _c = count
      const drag = await findAsync(e.composedPath(), e => e instanceof HTMLElement && opt.draggable(e))
      if (_c != count) return
      if (!drag) return
      e.stopPropagation()
      state.drag = drag
      state.drag?.setAttribute('draggable', 'true')
    },
    pointerup() {
      count++
      dragend()
    },
    pointermove() {
      count++
    },
    dragstart(e) {
      e.dataTransfer!.setDragImage(document.createElement('img'), 0, 0)
    },
    dragover(e) {
      if (!state.drag) return
      const aa = e.composedPath().filter(e => e instanceof HTMLElement)
      const over = state.over = aa.find(e => opt.dragover(e)) ?? state.over
      if (!over) return
      e.preventDefault()
      e.stopPropagation()
      // 
      const children = opt.children(over) as HTMLElement[]
      if (children) {
        let i = 0, d = Infinity, s = ''
        children.forEach((el, ii) => {
          const display = getComputedStyle(el).display
          const __ = ['table-cell', 'inline'].some(e => display.includes(e))
          const rect = el.getBoundingClientRect()
          if (__) {
            let dd = Math.sqrt((e.clientX - rect.x) ** 2 + (e.clientY - rect.y + rect.height / 2) ** 2)
            if (dd < d) (i = ii, d = dd, s = 'l')
            dd = Math.sqrt((e.clientX - rect.right) ** 2 + (e.clientY - rect.y + rect.height / 2) ** 2)
            if (dd < d) (i = ii, d = dd, s = 'r')
          } else {
            let dd = Math.sqrt((e.clientY - rect.y) ** 2 + (e.clientX - rect.x + rect.width / 2) ** 2)
            if (dd < d) (i = ii, d = dd, s = 't')
            dd = Math.sqrt((e.clientY - rect.bottom) ** 2 + (e.clientX - rect.x + rect.width / 2) ** 2)
            if (dd < d) (i = ii, d = dd, s = 'b')
          }
        })
  
        const rect1 = children[i].getBoundingClientRect()
        const x = s == 'l' || s == 'r', y = s == 't' || s == 'b'
        const size = 3
        state.style = {
          width: `${y ? rect1.width : size}px`,
          height: `${y ? size : rect1.height}px`,
          translate: `${y ? rect1.x : (s == 'l' ? rect1.x : rect1.right) - size / 2}px ${x ? rect1.y : (s == 't' ? rect1.y : rect1.bottom) - size / 2}px`
        }
        state.rel = children[i]
        state.type = s == 'l' || s == 't' ? 'before' : 'after'
      } else {
        const rect1 = over.getBoundingClientRect()
        state.style = {
          width: rect1.width,
          height: rect1.height,
          translate: `${rect1.x}px ${rect1.y}px`
        }
        state.rel = over
        state.type = 'inner'
      }
    },
    dragend() {
      dragend()
    },
  })

  function dragend() {
    state.drag?.removeAttribute('draggable')
    if (state.drag && state.rel) opt.dragend?.()
    reconcile({})(state)
  }

  const state = createMutable({
    style: void 0 as any,
    drag: void 0 as any,
    over: void 0 as any,
    rel: void 0 as any,
    type: ''
  })

  ;(<>{state.style && 
    <Portal mount={access(el)}>
      <div {...opt.guideLine} style={state.style} />
    </Portal>
  }</>)

  return state
}