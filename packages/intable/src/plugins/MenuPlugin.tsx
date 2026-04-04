import { batch, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createEventListener } from '@solid-primitives/event-listener'
import { delay, range, remove } from 'es-toolkit'
import { autoPlacement, computePosition } from '@floating-ui/dom'
import { type Plugin, type TableStore } from '..'
import { useMemoAsync, useTinykeys } from '../hooks'
import { Menu } from '../components/Menu'
import { tree } from '../utils'

declare module '../index' {
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
    moveRows: (ii: number[], to: number) => void
  }
}

export const MenuPlugin: Plugin = {
  name: 'menu',
  priority: Infinity,
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
        if (store.table.contains(e.target)) setPos({ x: e.x, y: e.y })
      }

      createEventListener(document, 'pointerdown', e => {
        menuEl()?.contains(e.target as Element) || setPos()
      })

      const style = useMemoAsync(() => {
        const mel = menuEl()
        if (!mel) return
        return computePosition({ getBoundingClientRect: () => DOMRect.fromRect(pos()) }, mel, {
          strategy: 'fixed',
          placement: 'top-start',
          middleware: [autoPlacement({ boundary: document.body, alignment: 'start' })]
        })
          .then(({ x, y }) => ({
            position: 'fixed',
            transform: `translate(${x}px, ${y}px)`,
            top: 0,
            left: 0,
            'z-index': 10
          }))
      })

      o = combineProps({ tabindex: -1, onContextMenu }, o)
      return (
        <Table {...o}>
          {pos() && <Menu ref={setMenuEl} style={style() || 'position: fixed'} items={menus()} onAction={() => setPos()} />}
          {o.children}
        </Table>
      )
    },
  },
  menus: (store) => [
    { label: '新增行 ↑', cb: () => store.commands.addRows(store.selected.end[1], [store.props.newRow(store.selected.end[1])]) },
    { label: '新增行 ↓', cb: () => store.commands.addRows(store.selected.end[1], [store.props.newRow(store.selected.end[1])], false) },
    { label: '删除行', cb: () => store.commands.deleteRows(range(...(e => [e[0], e[1] + 1])([store.selected.start[1], store.selected.end[1]].sort((a, b) => a - b)) as [number, number])) },
  ],
  commands: (store) => ({
    rowEquals(a, b) {
      const key = store.props.rowKey
      return a == b || (key != null && a?.[key] == b?.[key])
    },
    rowIndexOf(data, row) {
      return data.findIndex(e => store.commands.rowEquals(e, row))
    },
    rowChange(row, i) {
      const data = [...store.rawProps.data || []]
      i = i != null
        ? data.findIndex(ee => store.commands.rowEquals(ee, store.props.data[i]))
        : store.commands.rowIndexOf(data, row)
      if (i > -1) {
        data[i] = row
        store.props.onDataChange?.(data)
      }
    },
    addRows(i, rows, before = true) {
      addRows(store, i, rows, before)
    },
    deleteRows(ii) {
      const { rowKey, data } = store.props
      const val = [...store.rawProps.data || []]
      // const ids = new Set(data.filter((e, i) => ii.includes(i)).map(e => e[rowKey]))
      // remove(val, e => ids.has(e[rowKey]))
      const ids = new Set(ii.map(i => data[i]))
      remove(val, e => ids.has(e))
      store.props?.onDataChange?.(val)
    },
    moveRows(ii, to) {
      const { data: flatData } = store.props

      // Collect the actual row objects, skipping internal/system rows
      const rows = ii.map(i => flatData[i]).filter(r => r && !r?.[store.internal])
      if (!rows.length) return

      // Destination row — undefined means "append to end"
      const destRow = to >= 0 && to < flatData.length ? flatData[to] : null

      const { rowKey } = store.props
      const childrenField = store.props.tree?.children || Symbol()
      const movedKeys = new Set(rows.map((r: any) => r[rowKey]))

      // 1. Remove moved nodes from wherever they live in the nested tree, preserving their original objects (no clone) so children are kept.
      const removed: any[] = []
      function removeNodes(nodes: any[]): any[] {
        return nodes.reduce((acc: any[], node: any) => {
          if (movedKeys.has(node[rowKey])) {
            removed.push(node)
            return acc
          }
          if (Array.isArray(node[childrenField]) && node[childrenField].length) {
            const newChildren = removeNodes(node[childrenField])
            node = newChildren.length !== node[childrenField].length
              ? { ...node, [childrenField]: newChildren }
              : node
          }
          acc.push(node)
          return acc
        }, [])
      }
      const rawData = removeNodes([...(store.rawProps.data || [])])

      // 2. Insert removed nodes just before the destination node in the tree.
      const list = tree.findParent(rawData, e => e[rowKey] === destRow?.[rowKey])?.children ?? rawData
      const index = destRow ? list.findIndex(e => e[rowKey] === destRow[rowKey]) : -1
      if (index > -1) list.splice(index, 0, removed)
      else list.push(...removed)

      // 3. Update selection to the new flat position (best-effort: use to - ii.length)
      if (store.selected) {
        const newIdx = Math.max(0, to - rows.length)
        store.selected.start = [0, newIdx]
        store.selected.end = [Infinity, newIdx + removed.length - 1]
      }

      store.props?.onDataChange?.(rawData)
    }
  })
}

function addRows(store: TableStore, i: number, rows: any[], before: boolean) {
  const { data } = store.props
  const prev = i => {
    before = false
    while (--i >= 0 && data[i]?.[store.internal]) { }
    return i >= 0 ? data[i] : null
  }
  const next = i => {
    before = true
    while (++i < data.length && data[i]?.[store.internal]) { }
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
  ; (() => {
    const data = [...store.rawProps.data || []]
    const i = anchor ? store.commands.rowIndexOf(data, anchor) + (before ? 0 : 1) : data.length
    data.splice(i, 0, ...rows)
    store.props?.onDataChange?.(data)
  })()

  delay(0).then(() => {
    store.scrollCellIfNeeded(store.selected.start[0], store.selected.start[1])
  })
}