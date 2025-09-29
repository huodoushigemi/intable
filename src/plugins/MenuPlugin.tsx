import { batch, createEffect, createMemo, createSignal, mapArray } from 'solid-js'
import { createMutable, unwrap, type Store } from 'solid-js/store'
import { captureStoreUpdates } from '@solid-primitives/deep'
import { combineProps } from '@solid-primitives/props'
import { useHistory, useMemoAsync, useTinykeys } from '@/hooks'
import { type Plugin } from '../xxx'
import { Menu } from '@/components/Menu'
import { Floating } from '@/components/Popover'
import { autoPlacement, computePosition, detectOverflow, flip, shift } from '@floating-ui/dom'
import { log } from '@/utils'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
  interface Plugin {
    menu?: (store: TableStore) => any[]
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

      const _menus = mapArray(() => store.plugins || [], (o) => createMemo(() => o.menu?.(store)))
      const menus = createMemo(() => _menus().flatMap(e => e() || []))

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
          <Menu ref={setMenuEl} style={style()} items={menus()} />
          {o.children}
        </Table>
      )
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      get style() { return o.data[o.col.id] != store.unsaveData[o.y][o.col.id] ? `background: #80808030` : `` }
    })
  },
  menu: (store) => [
    {
      label: 'Undo',
      cb: () => store.history.undo(),
    },
    {
      label: 'Redo',
      cb: () => store.history.redo(),
    },
    {
      label: 'Save',
      cb: () => store.unsaveData = structuredClone(unwrap(store.raw))
    }
  ]
}
