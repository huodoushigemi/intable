import { Show } from 'solid-js'
import type { Plugin, TableColumn } from '..'
import { Filter } from '../components/Filter'
import type { FilterRule } from '../components/Filter'
import type { AndOrNode, RuleNode } from '../components/AndOr'
import { normalizeType } from '../components/AndOrFields'

declare module '../index' {
  interface TableProps {
    filterable?: boolean
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
    if (a == null || b == null) return false
    if (rule === 'eq') return a === b
    if (rule === 'lt') return a < b
    if (rule === 'gt') return a > b
    if (rule === 'lte') return a <= b
    if (rule === 'gte') return a >= b
  }

  // todo
  if (type === 'date') {
    const a = toDateTs(raw)
    const b = toDateTs(fv)
    if (a == null || b == null) return false
    if (rule === 'eq') return a === b
    if (rule === 'lt') return a < b
    if (rule === 'gt') return a > b
    if (rule === 'lte') return a <= b
    if (rule === 'gte') return a >= b
  }

  const text = String(raw ?? '').toLowerCase()
  const needle = String(fv ?? '').toLowerCase()
  if (rule === 'eq') return text === needle
  if (rule === 'neq') return text !== needle
  if (rule === 'startwith') return text.startsWith(needle)
  if (rule === 'endwith') return text.endsWith(needle)
  return text.includes(needle)
}

function getFilterTree(filters: Record<string, AndOrNode>, col: TableColumn): AndOrNode | undefined {
  return filters[col.id]
}

function setFilterTree(filters: Record<string, AndOrNode>, col: TableColumn, tree?: AndOrNode) {
  if (!tree) {
    delete filters[col.id]
    return
  }
  filters[col.id] = tree
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
  globalFilterable: boolean | undefined,
  internal: symbol,
): boolean {
  return columns.every(col => {
    if (col[internal] || !(col.filterable ?? globalFilterable)) return true
    const tree = getFilterTree(filters, col)
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
    data: ({ data }, { store }) => {
      if (!data) return data
      const { filters } = store
      const { columns = [], filterable } = store.props
      if (!Object.values(filters).some(hasActiveTree)) return data
      return data.filter(row => passesFilters(row, filters, columns, filterable, store.internal))
    },
    onDataChange: ({ onDataChange }, { store }) => (newFiltered) => {
      const raw = store.rawProps.data ?? []
      const { columns = [], filterable } = store.props
      if (!Object.values(store.filters).some(hasActiveTree)) {
        onDataChange?.(newFiltered)
        return
      }
      // Map filtered-view edits back to the original unfiltered array
      const original = [...raw]
      let filtIdx = 0
      raw.forEach((row, origIdx) => {
        if (passesFilters(row, store.filters, columns, filterable, store.internal)) {
          original[origIdx] = newFiltered[filtIdx++]
        }
      })
      onDataChange?.(original)
    },
    Th: ({ Th }, { store }) => o => {
      const isFilterable = () => !!(o.col.filterable ?? store.props.filterable) && !o.col[store.internal]
      return (
        <Th {...o}>
          {o.children}
          <Show when={isFilterable()}>
            <Filter
              col={o.col}
              tree={getFilterTree(store.filters, o.col)}
              setTree={tree => setFilterTree(store.filters, o.col, tree)}
            />
          </Show>
        </Th>
      )
    },
  },
}