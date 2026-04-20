import { mergeProps, Show } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { type Plugin } from '..'
import { useControlled } from '../hooks/useControlled'
import { toReactive } from '../hooks'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc'

export interface SortKey {
  field: string
  order: SortOrder
}

// ─── Module augmentation ─────────────────────────────────────────────────────

declare module '../index' {
  interface TableProps {
    sort?: {
      value?: SortKey[]
      defaultValue?: SortKey[]
      initialValue?: SortKey[]
      /**
       * Allow sorting by multiple columns simultaneously.
       * @default false
       */
      multiple?: boolean
      /**
       * Set to false to disable client-side sorting (e.g. server-side sorting).
       * `onChange` is still called so you can refresh data yourself.
       * @default true
       */
      autoSort?: boolean
      /** Called whenever sort keys change. */
      onChange?: (sorts: SortKey[]) => void
    }
  }
  interface TableColumn {
    /** Enable sort toggle on this column header. */
    sortable?: boolean
    /** Custom comparator for this column. Return negative / 0 / positive. */
    sortComparator?: (a: any, b: any) => number
  }
  interface TableStore {
    /** Current sort state. Read to render indicators; mutate to programmatically set sort. */
    sort: ReturnType<typeof useControlled<Exclude<TableProps['sort'], undefined>>>
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  // Numeric
  const na = Number(a), nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  // Date strings (ISO / locale)
  if (typeof a === 'string' && typeof b === 'string') {
    const da = Date.parse(a), db = Date.parse(b)
    if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) return da - db
  }
  // Boolean
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  // Fallback: locale string
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function applySort(data: any[], sortKeys: SortKey[], colMap: Record<string, any>): any[] {
  if (!sortKeys.length) return data
  return [...data].sort((a, b) => {
    for (const { field, order } of sortKeys) {
      const col = colMap[field]
      const cmp = col?.sortComparator
        ? col.sortComparator(a[field], b[field])
        : compareValues(a[field], b[field])
      if (cmp !== 0) return order === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconUnsorted = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 opacity-50 shrink-0 flex-none ml-1">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
  </svg>
)

const IconAsc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 shrink-0 flex-none ml-1" style="color:var(--c-primary,#6366f1)">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

const IconDesc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 shrink-0 flex-none ml-1" style="color:var(--c-primary,#6366f1)">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const SortPlugin: Plugin = {
  name: 'sort',

  // Run after FilterPlugin (priority 0) so we sort the already-filtered rows.
  priority: -1,

  store: (store) => ({
    
  }),

  onInit: (store) => {
    store.sort = useControlled(mergeProps(() => store.props.sort)) as any
  },

  rewriteProps: {
    // Apply defaults so consumers can always read sort.multiple / sort.autoSort.
    sort: ({ sort }, { store }) => mergeProps({
      multiple: false,
      autoSort: true,
      initialValue: [],
    }, sort),

    data: ({ data }, { store }) => {
      if (!store.sort?.value?.length) return data
      if (!store.sort.autoSort) return data
      // Build a field→column map for custom comparators
      const colMap = Object.fromEntries(store.props.columns.map(c => [c.id, c]))
      return applySort(data, store.sort.value, colMap)
    },

    Th: ({ Th }, { store }) => o => {
      const { sort } = store
      const isSortable = () => !!o.col.sortable && !o.col[store.internal]
      const sortKey = () => isSortable() ? sort.value.find(k => k.field === o.col.id) : undefined

      const handleClick = () => {
        if (!isSortable()) return
        const field = o.col.id
        const current = sortKey()
        const next = !current ? 'asc' : current.order === 'asc' ? 'desc' : null

        const multiple = sort.multiple
        let ret = [...sort.value]

        if (multiple) {
          if (next === null) {
            ret = sort.value.filter(k => k.field !== field)
          } else if (current) {
            const idx = sort.value.findIndex(k => k.field === field)
            ret[idx] = sort.value[idx] = { field, order: next }
          } else {
            ret = [...sort.value, { field, order: 'asc' }]
          }
        } else {
          ret = next ? [{ field, order: next }] : []
        }

        store.sort.onChange([...ret])
      }

      const thProps = combineProps(o, { get class() { return isSortable() ? 'cursor-pointer select-none' : '' }, onClick: handleClick })

      return (
        <Th {...thProps}>
          <div class="flex items-center w-full">
            {o.children}
            <Show when={isSortable()}>
              <Show when={sortKey()} fallback={<IconUnsorted />}>
                {sk => sk().order == 'asc' ? <IconAsc /> : <IconDesc />}
              </Show>
            </Show>
          </div>
        </Th>
      )
    },
  },
}
