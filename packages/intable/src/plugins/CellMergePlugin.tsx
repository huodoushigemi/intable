import { createMemo, Show } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { type Plugin, type TableColumn, type TableStore } from '../index'

declare module '../index' {
  interface TableProps {
    /**
     * Per-cell merge config. Return `{ rowspan?, colspan? }` for an anchor cell.
     * Covered cells are hidden automatically.
     *
     * @example
     * merge={(row, col, y, x) => {
     *   if (col.id === 'name' && row.name === data[y - 1]?.name) return null
     *   if (col.id === 'name') {
     *     let rowspan = 1
     *     while (data[y + rowspan]?.name === row.name) rowspan++
     *     return rowspan > 1 ? { rowspan } : null
     *   }
     * }}
     */
    merge?: (row: any, col: TableColumn, y: number, x: number) => { rowspan?: number; colspan?: number } | null | void
  }
  interface TableColumn {
    /**
     * Shorthand: auto-merge consecutive rows in this column that share the same cell value.
     * Equivalent to writing a `merge` function that compares adjacent row values.
     */
    mergeRow?: boolean
  }
  interface TableStore {
    /** Pre-computed merge result: anchor spans and covered cell keys. */
    _mergeMap?: ReturnType<typeof createMemo<MergeMap>>
  }
}

type CellKey = `${number},${number}`
interface MergeMap {
  spans: Map<CellKey, { rowspan: number; colspan: number }>
  covered: Set<CellKey>
}

/** Build a { spans, covered } map in O(rows × cols) from the merge function. */
function buildMergeMap(
  data: any[],
  columns: TableColumn[],
  merge: TableStore['props']['merge'],
): MergeMap {
  const spans = new Map<CellKey, { rowspan: number; colspan: number }>()
  const covered = new Set<CellKey>()

  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < columns.length; x++) {
      const key: CellKey = `${y},${x}`
      if (covered.has(key)) continue

      const col = columns[x]
      const row = data[y]

      // Resolve span: explicit `merge` prop wins, then column.mergeRow shorthand
      let rs = 1, cs = 1
      if (merge) {
        const r = merge(row, col, y, x)
        if (r) { rs = r.rowspan ?? 1; cs = r.colspan ?? 1 }
      } else if (col.mergeRow) {
        // Count forward while consecutive rows have the equal value
        while (y + rs < data.length && data[y + rs]?.[col.id] === row[col.id]) rs++
      }

      if (rs > 1 || cs > 1) {
        spans.set(key, { rowspan: rs, colspan: cs })
        for (let dy = 0; dy < rs; dy++) {
          for (let dx = 0; dx < cs; dx++) {
            if (dy === 0 && dx === 0) continue
            covered.add(`${y + dy},${x + dx}`)
          }
        }
      }
    }
  }

  return { spans, covered }
}

export const CellMergePlugin: Plugin = {
  name: 'cell-merge',
  rewriteProps: {
    /**
     * Build the merge map once per data/columns change inside the Table wrapper
     * so it's available to every Td without redundant recomputation.
     */
    Table: ({ Table }, { store }) => o => {
      store._mergeMap ??= createMemo<MergeMap>(() => {
        const { merge, data, columns } = store.props!
        if ((!merge && !columns?.some(c => c.mergeRow)) || !data?.length || !columns?.length) {
          return { spans: new Map(), covered: new Set() }
        }
        return buildMergeMap(data, columns, merge)
      })
      return <Table {...o} />
    },

    Td: ({ Td }, { store }) => o => {
      const key = (): CellKey => `${o.y},${o.x}`
      const isCovered = () => store._mergeMap?.().covered.has(key()) ?? false
      const span = () => store._mergeMap?.().spans.get(key())

      return (
        // Covered cells must not render any DOM node — HTML collapses the layout automatically
        <Show when={!isCovered()}>
          <Td {...o} rowspan={span()?.rowspan} colspan={span()?.colspan} />
        </Show>
      )
    },

    newRow: ({ newRow }, { store }) => function (i) {
      const row = newRow(i)
      const { data, columns, merge } = store.props!
      if (!data?.length || !columns?.length) return row

      columns.forEach((col, x) => {
        // mergeRow shorthand: copy the value from the row at the insertion point
        // so the new row automatically joins the same merge group.
        if (col.mergeRow) {
          const ref = data[i] ?? data[i - 1]
          if (ref != null) row[col.id] ??= ref[col.id]
          return
        }

        // Explicit merge function: if (i, x) is covered by a span, walk up to
        // find the anchor row and inherit its cell value.
        if (merge && store._mergeMap) {
          const key: CellKey = `${i},${x}`
          if (!store._mergeMap().covered.has(key) || !store._mergeMap().spans.has(key)) return
          for (let ay = i; ay >= 0; ay--) {
            const anchorKey: CellKey = `${ay},${x}`
            const span = store._mergeMap().spans.get(anchorKey)
            if (span && span.rowspan > 1) {
              row[col.id] ??= data[ay]?.[col.id]
              break
            }
          }
        }
      })

      return row
    }
  },
}
