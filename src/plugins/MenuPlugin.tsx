import { batch, createMemo, createSignal } from 'solid-js'
import { createMutable, unwrap } from 'solid-js/store'
import { captureStoreUpdates } from '@solid-primitives/deep'
import { combineProps } from '@solid-primitives/props'
import { useHistory, useMemoAsync, useTinykeys } from '@/hooks'
import { type Plugin } from '../xxx'
import { Menu } from '@/components/Menu'
import { Floating } from '@/components/Popover'
import { offset } from 'floating-ui-solid'
import { autoPlacement, computePosition, detectOverflow, flip, shift } from '@floating-ui/dom'
import { log } from '@/utils'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
}

export const MenuPlugin: Plugin = {
  store: (store) => ({
    
  }),
  processProps: {
    Table: ({ Table }, { store }) => o => {
      // let el: HTMLBodyElement
      const [el, setEl] = createSignal<HTMLElement>()
      const [menuEl, setMenuEl] = createSignal<HTMLElement>()

      // useTinykeys(() => el, {
      //   'Control+Z': () => store.history.undo(),
      //   'Control+Y': () => store.history.redo(),
      //   'Control+S': () => store.unsaveData = structuredClone(unwrap(store.rawProps.data)),
      // })
      const pos = createMutable({ x: 0, y: 0 })
      function onContextMenu(e: PointerEvent) {
        e.preventDefault()
        pos.x = e.x
        pos.y = e.y
      }

      const style = useMemoAsync(() => {
        const mel = menuEl()
        if (!mel) return
        const p = DOMRect.fromRect(pos)
        return computePosition({ getBoundingClientRect: () => p }, mel, {
          strategy: 'absolute',
          placement: 'top-start',
          middleware: [autoPlacement({ boundary: document.body, alignment: 'start' })]
        })
        .then(({ x, y }) => ({
          position: 'absolute',
          transform: `translate(${x}px, ${y}px)`,
          background: 'red',
          'z-index': 9
        }))
      })

      o = combineProps({ ref: setEl, tabindex: -1, onContextMenu }, o)
      return (
        <Table {...o}>
          <Menu ref={setMenuEl} style={style()} items={[
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
            { label: 'xxx' },
          ]} />
          {o.children}
        </Table>
      )
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      get style() { return o.data[o.col.id] != store.unsaveData[o.y][o.col.id] ? `background: #80808030` : `` }
    })
  },
}
