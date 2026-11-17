import { groupBy, zipObject } from 'es-toolkit'
import { findLast } from 'es-toolkit/compat'
import { type Plugin } from '..'
import { batch, createMemo, useContext } from 'solid-js'
import type { TableStore } from '..'
import { computeAgg } from './AggregatePlugin'
import { renderComponent } from '../components/utils'
import { noproxy } from '../hooks'
import { log } from '../utils'

/** Symbol marking a generated row-group header row. */
export const GROUP = Symbol('row-group')

/** 递归收集分组下所有叶子数据行（跳过嵌套分组头）。 */
export const groupLeaves = (rows: any[] = []): any[] => {
  const groupLeaves2 = (rows: any[], ret: any[] = []) => {
    for (const row of rows) {
      if (row?.[GROUP]) groupLeaves2(row[GROUP].children, ret)
      else ret.push(row)
    }
    return ret
  }
  return [...new Set(groupLeaves2(rows))]
}

/**
 * 返回分组的全部叶子行，**不受展开状态影响**。
 * 顶层分组头始终存在于 `props.data` 中，且其 `children` 保存了完整子树，
 * 因此无论折叠与否都能拿到全量数据，用于合计行等场景。
 */
export const rowGroupLeafRows = (data: any[] = []): any[] => {
  return data[0]?.[GROUP] ? groupLeaves(data) : data
}

declare module '../index' {
  interface TableProps {
    rowGroup?: {
      fields?: string[]
    }
  }
  interface TableStore {
    rowGroup: {
      /** Plain-object map used as Set<string>; property access is tracked by createMutable */
      expandKeys: Record<string, true | undefined>
      isExpand: (data) => boolean
      expand: (data, r?) => void
      toggleExpand: (data) => void
    }
  }
}

/** Serialize a group path to a plain string key for O(1) Set-style lookup */
const pathKey = (data): string => (Array.isArray(data) ? data : data[GROUP].path).join('\0')

export const RowGroupPlugin: Plugin = {
  name: 'row-group',
  priority: -Infinity,
  store: (store) => ({
    rowGroup: {
      // Plain object acts as a reactive Map<string, true> inside createMutable.
      // Property reads are tracked by SolidJS; O(1) vs previous O(n) isEqual scan.
      expandKeys: {} as Record<string, true | undefined>,
      isExpand: data => !!store.rowGroup.expandKeys[pathKey(data)],
      expand: (data, r) => batch(() =>
        r
          ? data[GROUP].path2.forEach(e => { store.rowGroup.expandKeys[pathKey(e)] = true })
          : (store.rowGroup.expandKeys[pathKey(data)] = true)
      ),
      toggleExpand: data => {
        const k = pathKey(data)
        store.rowGroup.expandKeys[k] ? delete store.rowGroup.expandKeys[k] : (store.rowGroup.expandKeys[k] = true)
      }
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
        ? log(expandData(data, store))
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
    Td: ({ Td }, { store }) => store.props?.rowGroup?.fields ? o => {
      // todo bug
      if (!o.data?.[GROUP]) return Td(o)

      const { props } = store
      const show = createMemo(() => store.rowGroup.isExpand(o.data))
      const isFirst = () => props.columns?.findIndex(e => !e[store.internal]) == o.x

      // 分组行：除分组列外，带 aggregate 的列显示该组的聚合值
      const agg = createMemo(() => {
        if (isFirst() || !o.col.aggregate) return undefined
        const raw = computeAgg(o.col, groupLeaves([o.data]))
        const fmt = props.aggregate?.formatter
        return raw != null && fmt ? fmt(raw, o.col.aggregate, o.col) : raw
      })

      return (
        <Td {...o}>
          {isFirst() ? (
            <div class='flex items-center' style={`padding-left: ${(o.data[GROUP].path.length - 1) * 16}px`} onDblClick={() => store.rowGroup.toggleExpand(o.data)}>
              <ILucideChevronRight class='icon-clickable mr-2 flex-shrink-0' style={`transform: rotate(${show() ? 90 : 0}deg); opacity: .6`} onClick={() => store.rowGroup.toggleExpand(o.data)} />
              {o.data[GROUP].value}
            </div>
          ) : o.col.aggregate ? (
            <span class='font-mono text-sm tabular-nums c-[--in-c-primary]'>{renderComponent(agg(), undefined, store)}</span>
          ) : o.children}
        </Td>
      )
    } : Td,
  },
}

const expandData = (data, store: TableStore, path2 = [] as any[]) => {
  const fields = store.props!.rowGroup!.fields!
  const col = store.props!.columns.find(e => !e[store.internal])
  if (!col) return data
  if (fields.length == path2.length) return data
  const obj = groupBy(data, e => e[fields[path2.length]])
  return Object.keys(obj).flatMap(k => {
    const  path = [...path2.map(e => e[GROUP].value), k]
    const group = (store.__rowgroup_map ??= noproxy({}))[pathKey(path)] ??= { [col.id]: k, [store.internal]: 1 } as any
    const ps = [...path2, group]
    group[GROUP] = { path, value: k, path2: ps }
    group[GROUP].children = expandData(obj[k], store, ps)
    const arr = store.rowGroup.isExpand(group) ? group[GROUP].children : []
    return [group, ...arr]
  })
}