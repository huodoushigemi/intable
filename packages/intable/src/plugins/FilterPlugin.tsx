import { mergeProps, Show } from 'solid-js'
import type { Plugin, TableColumn } from '..'
import { Filter } from '../components/Filter'
import type { FilterRule } from '../components/Filter'
import type { AndOrNode, RuleNode } from '../components/AndOr'
import { normalizeType } from '../components/AndOrFields'
import { toArr } from '../utils'
import { useControlled } from '../hooks/useControlled'

declare module '../index' {
  interface TableProps {
    filter?: {
      // value: AndOrNode[]
      onChange?: (value: AndOrNode[]) => void

      /** @default true */
      autoMatch?: boolean
    }
  }
  interface TableColumn {
    filterable?: boolean
  }
  interface TableStore {
    filters: Record<string, AndOrNode>
  }
}

function isBlank(v: any) {
  return v == null || String(v).trim() === ''
}

function toNum(v: any) {
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function toDateTs(v: any) {
  if (isBlank(v)) return null
  const t = new Date(String(v)).getTime()
  return Number.isNaN(t) ? null : t
}

function toBool(v: any) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const s = String(v ?? '').trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true
  if (['0', 'false', 'no', 'n', 'off', ''].includes(s)) return false
  return !!v
}

function toList(v: any) {
  if (Array.isArray(v)) return v
  if (v == null || String(v).trim() === '') return []
  return String(v).split(',').map(s => s.trim()).filter(Boolean)
}

function toPair(v: any): [any, any] {
  if (Array.isArray(v)) return [v[0], v[1]]
  if (v == null || String(v).trim() === '') return [undefined, undefined]
  const arr = String(v).split(',').map(s => s.trim())
  return [arr[0], arr[1]]
}

function isRuleNode(node: AndOrNode): node is RuleNode {
  return 'field' in node
}

function hasActiveRule(node: RuleNode) {
  return !!node.op
}

function hasActiveTree(node?: AndOrNode) {
  if (!node) return false
  if (isRuleNode(node)) return hasActiveRule(node)
  return (node.children ?? []).some(hasActiveTree)
}

function matchFilter(raw: any, ruleNode: RuleNode, type: string) {
  const rule = ruleNode.op as FilterRule
  if (rule === 'blank') return isBlank(raw)
  if (rule === 'noblank') return !isBlank(raw)
  if (rule === 'true') return toBool(raw)
  if (rule === 'false') return !toBool(raw)

  const fv = ruleNode.value

  if (type === 'number') {
    const a = toNum(raw)
    const b = toNum(fv)
    const list = toList(fv).map(toNum).filter(v => v != null)
    const [minRaw, maxRaw] = toPair(fv)
    const min = toNum(minRaw)
    const max = toNum(maxRaw)
    if (a == null) return false
    if (rule === 'eq') return a === b
    if (rule === 'ne') return a !== b
    if (rule === 'in') return list.includes(a)
    if (rule === 'not_in') return !list.includes(a)
    if (rule === 'between') return min != null && max != null && a >= Math.min(min, max) && a <= Math.max(min, max)
    if (rule === 'not_between') return min != null && max != null && (a < Math.min(min, max) || a > Math.max(min, max))
    if (b == null) return false
    if (rule === 'lt') return a < b
    if (rule === 'gt') return a > b
    if (rule === 'lte') return a <= b
    if (rule === 'gte') return a >= b
  }

  // todo
  if (type === 'date') {
    const a = toDateTs(raw)
    const b = toDateTs(fv)
    const list = toList(fv).map(toDateTs).filter(v => v != null)
    const [startRaw, endRaw] = toPair(fv)
    const start = toDateTs(startRaw)
    const end = toDateTs(endRaw)
    if (a == null) return false
    if (rule === 'eq') return a === b
    if (rule === 'ne') return a !== b
    if (rule === 'in') return list.includes(a)
    if (rule === 'not_in') return !list.includes(a)
    if (rule === 'between') return start != null && end != null && a >= Math.min(start, end) && a <= Math.max(start, end)
    if (rule === 'not_between') return start != null && end != null && (a < Math.min(start, end) || a > Math.max(start, end))
    if (b == null) return false
    if (rule === 'lt') return a < b
    if (rule === 'gt') return a > b
    if (rule === 'lte') return a <= b
    if (rule === 'gte') return a >= b
  }

  const text = String(raw ?? '').toLowerCase()
  const needle = String(fv ?? '').toLowerCase()
  const list = toList(fv).map(v => String(v).toLowerCase())
  const [startRaw, endRaw] = toPair(fv)
  const start = String(startRaw ?? '').toLowerCase()
  const end = String(endRaw ?? '').toLowerCase()
  if (rule === 'eq') return text === needle
  if (rule === 'ne') return text !== needle
  if (rule === 'in') return list.includes(text)
  if (rule === 'not_in') return !list.includes(text)
  if (rule === 'between') return start !== '' && end !== '' && text >= (start < end ? start : end) && text <= (start < end ? end : start)
  if (rule === 'not_between') return start !== '' && end !== '' && (text < (start < end ? start : end) || text > (start < end ? end : start))
  if (rule === 'startwith') return text.startsWith(needle)
  if (rule === 'endwith') return text.endsWith(needle)
  return text.includes(needle)
}

function evaluateFilterTree(raw: any, node: AndOrNode, type: string): boolean {
  if (isRuleNode(node)) {
    if (!hasActiveRule(node)) return true
    return matchFilter(raw, node, type)
  }

  const children = node.children ?? []
  const activeChildren = children.filter(hasActiveTree)
  if (!activeChildren.length) return true
  if (node.op === 'or') return activeChildren.some(child => evaluateFilterTree(raw, child, type))
  return activeChildren.every(child => evaluateFilterTree(raw, child, type))
}

function passesFilters(
  row: any,
  filters: Record<string, AndOrNode>,
  columns: TableColumn[],
  internal: symbol,
): boolean {
  return columns.every(col => {
    if (col[internal] || !(col.filterable)) return true
    const tree = filters[col.id]
    if (!tree || !hasActiveTree(tree)) return true
    return evaluateFilterTree(row[col.id], tree, normalizeType(col))
  })
}

export const FilterPlugin: Plugin = {
  name: 'filter',
  store: () => ({
    filters: {},
  }),
  rewriteProps: {
    filter: ({ filter }) => mergeProps({
      autoMatch: true,
      ...filter
    }, useControlled(filter)),
    newRow: ({ newRow }, { store }) => function (...args) {
      // 根据 filters 生成一个默认值满足过滤条件的行，如果 filters 有多层嵌套则暂不处理
      const row = newRow(...args)
      const { filters, props } = store
      const { columns } = props!
      
      columns.forEach(col => {
        if (col[store.internal] || !col.filterable) return
        const tree = filters[col.id]
        // 这里只处理了简单的单层规则节点，复杂树结构暂不处理
        if (tree && isRuleNode(tree)) {
          row[col.id] = ({
            ne: `not ${tree.value}`,
            between: toArr(tree.value)[0],
            not_between: NaN,
            in: toArr(tree.value)[0],
            not_in: '',
            lt: tree.value - 1,
            gt: tree.value + 1,
            blank: '',
            noblank: 'default',
            true: true,
            false: false,
          })[tree.op] ?? tree.value
        }
      })
      return row
    },
    data: ({ data }, { store }) => {
      if (!data) return data
      const { filters } = store
      const { columns, filter } = store.props
      if (!filter!.autoMatch) return data
      if (!Object.values(filters).some(hasActiveTree)) return data
      return data.filter(row => passesFilters(row, filters, columns, store.internal))
    },
    Th: ({ Th }, { store }) => o => {
      const isFilterable = () => !!o.col.filterable && !o.col[store.internal]
      return (
        <Th {...o}>
          {o.children}
          <Show when={isFilterable()}>
            <Filter
              col={o.col}
              tree={store.filters[o.col.id]}
              setTree={tree => {
                if (!tree) delete store.filters[o.col.id]
                else store.filters[o.col.id] = tree
                store.props.filter?.onChange?.(Object.values(store.filters))
              }}
            />
          </Show>
        </Th>
      )
    },
  },
}