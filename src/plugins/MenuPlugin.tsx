import { batch, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createEventListener } from '@solid-primitives/event-listener'
import { range, remove } from 'es-toolkit'
import { useMemoAsync, useTinykeys } from '@/hooks'
import { Menu } from '@/components/Menu'
import { autoPlacement, computePosition } from '@floating-ui/dom'
import { type Plugin, type TableStore } from '../xxx'
import { log } from '@/utils'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
  interface Plugin {
    menus?: (store: TableStore) => any[]
  }
  interface Commands {
    rowEquals: (a, b) => boolean
    rowIndexOf: (data: any[], row) => number
    rowChange: (row, i?) => void
    // 
    addRows: (i: number, rows: any[], before?: boolean) => void
    deleteRows: (i: number[]) => void
  }
}

export const MenuPlugin: Plugin = {
  store: (store) => ({
    
  }),
  rewriteProps: {
    Table: ({ Table }, { store }) => o => {
      const [menuEl, setMenuEl] = createSignal<HTMLElement>()

      const _menus = mapArray(() => store.plugins || [], plugin => createMemo(() => plugin.menus?.(store)))
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
          top: 0,
          left: 0,
          'z-index': 10
        }))
      })

      o = combineProps({ tabindex: -1, onContextMenu }, o)
      return (
        <Table {...o}>
          {pos() && <Menu ref={setMenuEl} style={style() || 'position: absolute'} items={menus()} onAction={() => setPos()} />}
          {o.children}
        </Table>
      )
    },
  },
  menus: (store) => [
    { label: '新增行 ↑', disabled: () => true, cb: () => store.commands.addRows(store.selected.end[1], [store.props!.newRow(store.selected.end[1])]) },
    { label: '新增行 ↓', cb: () => store.commands.addRows(store.selected.end[1], [store.props!.newRow(store.selected.end[1])], false) },
    { label: '删除行', cb: () => store.commands.deleteRows(range( ...(e => [e[0], e[1] + 1])([store.selected.start[1], store.selected.end[1]].sort((a, b) => a - b)) as [number, number] )) },
  ],
  commands: (store) => ({
    rowEquals(a, b) {
      // return a[store.props!.rowKey] == b[store.props!.rowKey]
      return a == b
    },
    rowIndexOf(data, row) {
      return data.findIndex(e => store.commands.rowEquals(e, row))
    },
    rowChange(row, i) {
      const data = [...store.rawProps.data || []]
      i = i != null
        ? data.findIndex(ee => ee == store.props!.data[i])
        : store.commands.rowIndexOf(data, row)
      if (i > -1) {
        data[i] = row
        store.props!.onDataChange?.(data)
      }
    },
    addRows(i, rows, before = true) {
      addRows(store, i, rows, before)
    },
    deleteRows(ii) {
      const { rowKey, data } = store.props!
      const val = [...store.rawProps.data || []]
      // const ids = new Set(data.filter((e, i) => ii.includes(i)).map(e => e[rowKey]))
      // remove(val, e => ids.has(e[rowKey]))
      const ids = new Set(ii.map(i => data[i]))
      log([...ids])
      remove(val, e => ids.has(e))
      store.props?.onDataChange?.(val)
    }
  })
}

function addRows(store: TableStore, i: number, rows: any[], before: boolean) {
  const { data } = store.props!
  const prev = i => {
    before = false
    while (--i >= 0 && data[i]?.[store.internal]) {}
    return i >= 0 ? data[i] : null
  }
  const next = i => {
    before = true
    while (++i < data.length && data[i]?.[store.internal]) {}
    return i < data.length ? data[i] : null
  }
  const anchor = !data[i]?.[store.internal] ? data[i] : before ? prev(i) || next(i) : next(i) || prev(i)
  if (anchor) {
    batch(() => {
      i = store.commands.rowIndexOf(data, anchor)
      if (!store.selected) return
      store.selected.start = [0, i + (before ? 0 : 1)]
      store.selected.end = [Infinity, i + rows.length - 1 + (before ? 0 : 1)]
    })
  }
  ;(() => {
    const data = [...store.rawProps.data || []]
    const i = anchor ? store.commands.rowIndexOf(data, anchor) + (before ? 0 : 1) : data.length
    data.splice(i, 0, ...rows)
    store.props?.onDataChange?.(data)
  })()
}