import { groupBy, isEqual, remove, zipObject } from 'es-toolkit'
import { findLast } from 'es-toolkit/compat'
import { Ctx, type Plugin } from '../xxx'
import { batch, createMemo, useContext } from 'solid-js'
import type { TableStore } from '../xxx'
import { log } from '@/utils'

declare module '../xxx' {
  interface TableProps {
    rowGroup?: {
      fields?: string[]
    }
  }
  interface TableStore {
    rowGroup: {
      expands: string[][]
      isExpand: (data) => boolean
      expand: (data, r?) => void
      toggleExpand: (data) => void
    }
  }
}

export const RowGroupPlugin: Plugin = {
  priority: -Infinity,
  store: (store) => ({
    rowGroup: {
      expands: [],
      isExpand: data => store.rowGroup.expands.some(e => isEqual(e, data[GROUP].path)),
      expand: (data, r) => batch(() => r ? data[GROUP].path2.forEach(e => store.rowGroup.isExpand(e) || store.rowGroup.expands.push(e[GROUP].path)) : (store.rowGroup.isExpand(data) || store.rowGroup.expands.push(data[GROUP].path))),
      toggleExpand: data => store.rowGroup.isExpand(data) ? remove(store.rowGroup.expands, e => isEqual(e, data[GROUP].path)) : store.rowGroup.expand(data)
    }
  }),
  commands: (store, { addRows }) => ({
    addRows(i, rows, before) {
      const { data, rowGroup, rowKey } = store.props!
      if (rowGroup?.fields?.length) {
        const group = findLast(data, e => e[GROUP], i)
        if (group) {
          if (data[i][GROUP]) {
            const leaf = (function r(group) { return group[GROUP]?.children[0]?.[GROUP] ? r(group[GROUP].children[0]) : group })(group)
            store.rowGroup.expand(leaf, true)
            const anchor = leaf[GROUP].children[0]
            i = store.props!.data.indexOf(anchor)
            before = true
          }
        }
        addRows?.(i, rows, before)
      } else {
        addRows?.(...arguments)
      }
    },
  }),
  rewriteProps: {
    data: ({ data }, { store }) => (
      store.props?.rowGroup?.fields?.length
        ? expandData(data, store)
        : data
    ),
    newRow: ({ newRow }, { store }) => function (i) {
      const row = newRow(...arguments)
      const { data, rowGroup } = store.props!
      if (rowGroup?.fields?.length) {
        const group = findLast(data, e => e[GROUP], i)
        if (group) {
          const leaf = (function r(group) { return group[GROUP]?.children[0]?.[GROUP] ? r(group[GROUP].children[0]) : group })(group)
          const extra = zipObject(rowGroup!.fields!, leaf[GROUP].path)
          Object.assign(row, extra)
        }
      }
      return row
    },
    Td: ({ Td }, { store }) => o => {
      if (!o.data?.[GROUP]) return <Td {...o} />
      
      const { props } = useContext(Ctx)
      const show = createMemo(() => store.rowGroup.isExpand(o.data))
      
      return (
        <Td {...o}>
          {props.columns?.findIndex(e => !e[store.internal]) == o.x ? (
            <div class='flex items-center' style={`padding-left: ${(o.data[GROUP].path.length - 1) * 16}px`} onDblClick={() => store.rowGroup.toggleExpand(o.data)}>
              <ILucideChevronRight class='icon-clickable mr-2' style={`transform: rotate(${show() ? 90 : 0}deg); opacity: .6`} onClick={() => store.rowGroup.toggleExpand(o.data)} />
              {o.data[GROUP].value}
            </div>
          ) : o.children}
        </Td>
      )
    },
  },
}

const GROUP = Symbol('row-group')

const expandData = (data, store: TableStore, path2 = [] as any[]) => {
  const fields = store.props!.rowGroup!.fields!
  const col = store.props!.columns.find(e => !e[store.internal])
  if (!col) return data
  if (fields.length == path2.length) return data
  const path = path2[path2.length - 1]?.[GROUP].path || []
  const obj = groupBy(data, e => e[fields[path.length]])
  return Object.keys(obj).flatMap(k => {
    const group = { [col.id]: k, [store.internal]: 1 } as any
    const ps = [...path2, group]
    group[GROUP] = { path: [...path, k], value: k, path2: ps }
    group[GROUP].children = expandData(obj[k], store, ps)
    const arr = store.rowGroup.isExpand(group) ? group[GROUP].children : []
    return [group, ...arr]
  })
}