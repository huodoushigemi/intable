import { batch, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
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

      const [pos, setPos] = createSignal<{ x: number; y: number }>()
      function onContextMenu(e: PointerEvent) {
        e.preventDefault()
        setPos({ x: e.x, y: e.y })
      }

      createEffect(() => {
        if (pos()) {
          const sss = createMemo(() => JSON.stringify(store.selected))
          createEffect(on(sss, () => setPos(), { defer: true }))
        }
      })

      const style = useMemoAsync(() => {
        const mel = menuEl()
        if (!mel) return
        const p = DOMRect.fromRect(pos())
        return computePosition({ getBoundingClientRect: () => p }, mel, {
          strategy: 'absolute',
          placement: 'top-start',
          middleware: [autoPlacement({ boundary: document.body, alignment: 'start' })]
        })
        .then(({ x, y }) => ({
          position: 'absolute',
          transform: `translate(${x}px, ${y}px)`,
          'z-index': 10
        }))
      })

      o = combineProps({ ref: setEl, tabindex: -1, onContextMenu }, o)
      return (
        <Table {...o}>
          {pos() && <Menu ref={setMenuEl} style={style() || 'position: absolute'} items={menus()} />}
          {o.children}
        </Table>
      )
    },
  },
  menu: (store) => [
    {
      label: '新增行 ↑',
      cb: () => {
        const data = [...store.props?.data || []]
        data.splice(store.selected.end[1], 0, {})
        store.props?.onDataChange?.(data)
      },
    },
    {
      label: '新增行 ↓',
      cb: () => {
        const data = [...store.props?.data || []]
        data.splice(store.selected.end[1] + 1, 0, {})
        store.props?.onDataChange?.(data)
      },
    },
    {
      label: '删除行',
      cb: () => {
        const data = [...store.rawProps?.data || []]
        data.splice(store.selected.end[1], 1)
        store.props?.onDataChange?.(data)
      }
    }
  ]
}
