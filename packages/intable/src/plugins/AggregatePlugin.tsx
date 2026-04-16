import { createMemo, For, Show } from 'solid-js'
import { type Plugin, type TableColumn } from '..'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AggregateType =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | ((values: any[], column: TableColumn, data: any[]) => any)

// ─── Module augmentation ─────────────────────────────────────────────────────

declare module '../index' {
  interface TableProps {
    aggregate?: {
      /**
       * Label shown in the first user column when that column itself
       * has no `aggregate` setting.  Defaults to `'Σ'`.
       */
      label?: string
      /**
       * Format a computed aggregate value before display.
       * Return a string/number or a JSX element.
       */
      formatter?: (value: any, type: AggregateType, col: TableColumn) => any
    }
  }
  interface TableColumn {
    /**
     * Aggregation for this column.
     * - `'sum'` / `'avg'` / `'min'` / `'max'` — numeric operations (NaN values skipped)
     * - `'count'` — counts non-null / non-empty values
     * - function — `(values, col, allData) => displayValue`
     */
    aggregate?: AggregateType
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeAgg(col: TableColumn, data: any[]): any {
  const { aggregate: agg } = col
  if (!agg) return undefined
  const vals = data.map(r => r[col.id]).filter(v => v != null && v !== '')
  if (typeof agg === 'function') return agg(vals, col, data)
  if (agg === 'count') return vals.length
  const nums = vals.map(Number).filter(isFinite)
  if (!nums.length) return ''
  if (agg === 'sum') return nums.reduce((s, n) => s + n, 0)
  if (agg === 'avg') return +(nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)
  if (agg === 'min') return Math.min(...nums)
  if (agg === 'max') return Math.max(...nums)
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const AggregatePlugin: Plugin = {
  name: 'aggregate',
  rewriteProps: {
    Tbody: ({ Tbody }, { store }) => (o) => {
      const cols = () => store.props.columns ?? []
      const hasAgg = createMemo(() => cols().some(c => !!c.aggregate))
      const firstUserIdx = createMemo(() => cols().findIndex(c => !c[store.internal]))
      const label = () => store.props.aggregate?.label ?? 'Σ'
      const fmt = () => store.props.aggregate?.formatter

      return (
        <>
          <Tbody {...o} />
          <Show when={hasAgg()}>
            <tfoot class='sticky bottom-0 z-2 shadow-inner'>
              <tr style='font-weight:600'>
                <For each={cols()}>
                  {(col, i) => {
                    const val = createMemo(() => {
                      const raw = computeAgg(col, store.props.data)
                      return raw != null && fmt() ? fmt()!(raw, col.aggregate!, col) : raw
                    })
                    return (
                      <td
                        style={`${col.width ? `width:${col.width}px;` : ''}padding:4px 8px;border-top:1px solid var(--table-b-c)`}
                        class={col.class as string | undefined}
                      >
                        <Show when={col.aggregate} fallback={
                          <Show when={i() === firstUserIdx()}>
                            <span class='text-xs font-semibold tracking-wide select-none'>{label()}</span>
                          </Show>
                        }>
                          <span class='font-mono text-sm tabular-nums c-[--c-primary]'>{val()}</span>
                        </Show>
                      </td>
                    )
                  }}
                </For>
              </tr>
            </tfoot>
          </Show>
        </>
      )
    },
  },
}
