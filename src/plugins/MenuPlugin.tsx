import { batch, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
import { createMutable, unwrap, type Store } from 'solid-js/store'
import { captureStoreUpdates } from '@solid-primitives/deep'
import { combineProps } from '@solid-primitives/props'
import { createEventListener } from '@solid-primitives/event-listener'
import { range } from 'es-toolkit'
import { useMemoAsync, useTinykeys } from '@/hooks'
import { Menu } from '@/components/Menu'
import { autoPlacement, computePosition } from '@floating-ui/dom'
import { log } from '@/utils'
import { type Plugin } from '../xxx'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
  interface Plugin {
    menus?: (store: TableStore) => any[]
  }
  interface Commands {
    addRows: (i: number, rows: any[]) => void
    deleteRows: (i: number[]) => void
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

      const _menus = mapArray(() => store.plugins || [], (o) => createMemo(() => o.menus?.(store)))
      const menus = createMemo(() => _menus().flatMap(e => e() || []))

      const [pos, setPos] = createSignal<{ x: number; y: number }>()
      function onContextMenu(e: PointerEvent) {
        e.preventDefault()
        setPos({ x: e.x, y: e.y })
      }

      createEventListener(document, 'pointerdown', e => {
        menuEl()?.contains(e.target as Element) || setPos()
      })

      const style = useMemoAsync(() => {
        const mel = menuEl()
        if (!mel) return
        return computePosition({ getBoundingClientRect: () => DOMRect.fromRect(pos()) }, mel, {
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
          {pos() && <Menu ref={setMenuEl} style={style() || 'position: absolute'} items={menus()} onAction={() => setPos()} />}
          {o.children}
        </Table>
      )
    },
  },
  menus: (store) => [
    { label: '新增行 ↑', disabled: () => true, cb: () => store.commands.addRows(store.selected.end[1], [{}]) },
    { label: '新增行 ↓', cb: () => store.commands.addRows(store.selected.end[1] + 1, [{}]) },
    { label: '删除行', cb: () => store.commands.deleteRows(range( ...(e => [e[0], e[1] + 1])([store.selected.start[1], store.selected.end[1]].sort((a, b) => a - b)) as [number, number] )) },
  ],
  commands: (store) => ({
    addRows(i, rows) {
      const data = [...store.props?.data || []]
      data.splice(i, 0, ...rows)
      store.props?.onDataChange?.(data)
      batch(() => {
        if (!store.selected) return
        store.selected.start = [0, i]
        store.selected.end = [Infinity, i + rows.length - 1]
      })
    },
    deleteRows(ii) {
      let data = [...store.rawProps?.data || []]
      data = data.filter((e, i) => !ii.includes(i))
      store.props?.onDataChange?.(data)
    }
  })
}
