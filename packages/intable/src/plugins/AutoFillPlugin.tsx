import { createMemo, createSignal, type Component } from 'solid-js'
import { createScrollPosition } from '@solid-primitives/scroll'
import { type Plugin, type TableStore } from '..'
import { usePointerDrag } from '../hooks'
import { useFloating } from '../components/Popover'
import { offset } from 'floating-ui-solid'

declare module '..' {
  interface TableProps {
    /** Set to `true` or `{ enable: true }` to show the fill handle. Disabled by default. */
    autoFill?: true | { enable?: boolean }
  }
}

// Fill `count` values extending src forward (dir=1) or backward (dir=-1).
// Detects numeric / ISO-date progressions; single number uses step=1.
// fills[0] = furthest from selection, fills[count-1] = adjacent to selection.
function inferFill(src: any[], count: number, dir: 1 | -1 = 1): any[] {
  if (!src.length) return Array(count).fill(null)

  const nums = src.map(v => (typeof v === 'number' ? v : Number(v)))
  if (nums.every(isFinite)) {
    const step = src.length > 1 ? nums.at(-1)! - nums.at(-2)! : 1
    const anchor = dir === 1 ? nums.at(-1)! : nums[0]
    return Array.from({ length: count }, (_, i) =>
      +(dir === 1 ? anchor + step * (i + 1) : anchor - step * (count - i)).toFixed(10)
    )
  }

  if (src.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) {
    const ts = src.map(v => new Date(v).getTime())
    if (ts.every(isFinite)) {
      const step = ts.length > 1 ? ts.at(-1)! - ts.at(-2)! : 86_400_000
      const anchor = dir === 1 ? ts.at(-1)! : ts[0]
      return Array.from({ length: count }, (_, i) =>
        new Date(dir === 1 ? anchor + step * (i + 1) : anchor - step * (count - i)).toISOString().slice(0, 10)
      )
    }
  }

  return Array.from({ length: count }, (_, i) => src[i % src.length])
}

// ─── Layer ────────────────────────────────────────────────────────────────────

// Shared fill engine used by both drag and double-click.
// Returns the mutated row map and the new selection bounds.
function applyFill(
  xs: [number, number], ys: [number, number],
  axis: 'v' | 'h', delta: number,
  store: TableStore,
) {
  const { internal } = store
  const { data, columns: cols } = store.props
  const dir = delta > 0 ? 1 : -1, abs = Math.abs(delta)
  const rowsMap = new Map<number, any>()
  const getRow = (i: number) => {
    if (!rowsMap.has(i)) rowsMap.set(i, { ...data[i] })
    return rowsMap.get(i)!
  }
  let newStart: number[], newEnd: number[]

  if (axis === 'v') {
    const srcRows = data.slice(ys[0], ys[1] + 1)
    for (let c = xs[0]; c <= xs[1] && c < cols.length; c++) {
      const col = cols[c]
      if (!col || col[internal]) continue
      const fills = inferFill(srcRows.map((d: any) => d[col.id]), abs, dir)
      for (let i = 0; i < abs; i++) {
        const row = dir === 1 ? ys[1] + 1 + i : ys[0] - abs + i
        if (row >= 0 && row < data.length) getRow(row)[col.id] = fills[i]
      }
    }
    newStart = [xs[0], dir === 1 ? ys[0] : Math.max(ys[0] - abs, 0)]
    newEnd   = [xs[1], dir === 1 ? Math.min(ys[1] + abs, data.length - 1) : ys[1]]
  } else {
    for (let row = ys[0]; row <= ys[1] && row < data.length; row++) {
      const srcVals = cols.slice(xs[0], xs[1] + 1)
        .filter((c: any) => c && !c[internal]).map((c: any) => data[row][c.id])
      const fills = inferFill(srcVals, abs, dir)
      for (let i = 0; i < abs; i++) {
        const c = dir === 1 ? xs[1] + 1 + i : xs[0] - abs + i
        if (c < 0 || c >= cols.length) continue
        const col = cols[c]
        if (col && !col[internal]) getRow(row)[col.id] = fills[i]
      }
    }
    newStart = [dir === 1 ? xs[0] : Math.max(xs[0] - abs, 0), ys[0]]
    newEnd   = [dir === 1 ? Math.min(xs[1] + abs, cols.length - 1) : xs[1], ys[1]]
  }
  return { rowsMap, newStart, newEnd }
}

const FillHandleLayer: Component<TableStore> = (store) => {
  const scrollPos = createScrollPosition(() => store.scroll_el)

  const selRect = createMemo(() => {
    const { start, end } = store.selected ?? {}
    if (!start?.length || !end?.length) return null
    const xs = [start[0], end[0]].sort((a, b) => a - b) as [number, number]
    const ys = [start[1], end[1]].sort((a, b) => a - b) as [number, number]
    return Number.isFinite(xs[1]) && Number.isFinite(ys[1]) ? { xs, ys } : null
  })

  // Pixel coordinate helpers — recomputed when sizes or scroll change
  const px = createMemo(() => {
    const ths = store.thSizes ?? [], trs = store.trSizes ?? []
    const hH = ths[0]?.height ?? 30, sx = scrollPos.x, sy = scrollPos.y
    const colX = (c: number) => ths.slice(0, c).reduce((a, e) => a + (e?.width ?? 0), 0) - sx
    const colR = (c: number) => colX(c) + (ths[c]?.width ?? 0)
    const rowY = (r: number) => hH + trs.slice(0, r).reduce((a, e) => a + (e?.height ?? 28), 0) - sy
    const rowB = (r: number) => rowY(r) + (trs[r]?.height ?? 28)
    return { colX, colR, rowY, rowB }
  })

  const enabled = createMemo(() => {
    if (!selRect()) return
    const { xs, ys } = selRect()!
    if (store.props.columns[xs[1]][store.internal] || store.props.data[ys[1]][store.internal]) return
    const o = store.props.autoFill
    return o === true || (o as any)?.enable === true
  })

  const [fillDrag, setFillDrag] = createSignal<{ axis: 'v' | 'h'; delta: number } | null>(null)

  const previewStyle = createMemo(() => {
    const drag = fillDrag(), r = selRect()
    if (!drag || !r || !drag.delta) return 'display:none;position:absolute'
    const { xs, ys } = r
    const { colX, colR, rowY, rowB } = px()
    const d = drag.delta > 0 ? 1 : -1, abs = Math.abs(drag.delta)
    const nR = store.props.data.length, nC = store.props.columns.length
    let l: number, t: number, ri: number, b: number
    if (drag.axis === 'v') {
      l = colX(xs[0]); ri = colR(xs[1])
      ;[t, b] = d > 0 ? [rowB(ys[1]), rowB(Math.min(ys[1] + abs, nR - 1))]
                      : [rowY(Math.max(ys[0] - abs, 0)), rowY(ys[0])]
    } else {
      t = rowY(ys[0]); b = rowB(ys[1])
      ;[l, ri] = d > 0 ? [colR(xs[1]), colR(Math.min(xs[1] + abs, nC - 1))]
                       : [colX(Math.max(xs[0] - abs, 0)), colX(xs[0])]
    }
    const w = ri - l, h = b - t
    if (w <= 0 || h <= 0) return 'display:none;position:absolute'
    return `position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;` +
      `border:1.5px dashed var(--c-primary);background:rgba(99,102,241,0.08);pointer-events:none;z-index:3`
  })

  const [handleEl, setHandleEl] = createSignal<HTMLElement>()

  // Apply fills and sync selection in one place
  const commit = (xs: [number, number], ys: [number, number], axis: 'v' | 'h', delta: number) => {
    const { rowsMap, newStart, newEnd } = applyFill(xs, ys, axis, delta, store)
    if (rowsMap.size) {
      store.commands.rowsChange([...rowsMap.values()])
      store.selected.start = newStart
      store.selected.end = newEnd
    }
  }

  useFloating({
    reference: () => enabled() ? (store.ths[selRect()?.xs[1]], store.trs[selRect()?.ys[1]!]?.querySelector(`[x="${selRect()?.xs[1]}"]`)) : null,
    floating: handleEl,
    placement: 'bottom-end',
    middleware: [offset({ crossAxis: 5, mainAxis: -5 })],
  })

  const handleDblClick = (e: MouseEvent) => {
    e.stopPropagation()
    const r = selRect()
    if (!r) return
    const { xs, ys } = r
    const { data, columns: cols } = store.props
    // Detect fill extent from nearest adjacent column (Excel behavior)
    const adjIdx = xs[0] > 0 ? xs[0] - 1 : xs[1] < cols.length - 1 ? xs[1] + 1 : -1
    let fillTo = data.length - 1
    if (adjIdx >= 0) {
      const adjCol = cols[adjIdx]
      if (adjCol && !adjCol[store.internal]) {
        for (let row = ys[1] + 1; row < data.length; row++) {
          const v = data[row][adjCol.id]
          if (v != null && v !== '') fillTo = row; else break
        }
      }
    }
    commit(xs, ys, 'v', fillTo - ys[1])
  }

  usePointerDrag(handleEl, {
    start(e, move, end) {
      e.stopPropagation(); e.preventDefault()
      const r = selRect()
      if (!r) return
      const { xs, ys } = r
      let delta = 0, axis: 'v' | 'h' = 'v'

      move((_, { ox, oy }) => {
        if (Math.abs(oy) >= Math.abs(ox)) {
          axis = 'v'; delta = _.composedPath().find(e => e.tagName == 'TD')?.getAttribute('y') - ys[1]
        } else {
          axis = 'h'; delta = _.composedPath().find(e => e.tagName == 'TD')?.getAttribute('x') - xs[1]
        }
        setFillDrag(delta ? { axis, delta } : null)
      })

      end(() => {
        setFillDrag(null)
        commit(xs, ys, axis, delta)
      })
    },
  })

  return (
    <>
      <div style={previewStyle()} />
      <div ref={setHandleEl} title='Drag to fill' class='pointer-events-auto w-2.5 h-2.5 bg-[--c-primary] b-(2px solid) b-[--table-bg] cursor-crosshair' onDblClick={handleDblClick} />
    </>
  )
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * AutoFillPlugin — shows a fill handle at the bottom-right corner of the
 * cell selection (Excel-style).  Drag it downward or rightward to fill cells:
 *
 * - **Numeric series**: `[1, 2, 3]` → continues 4, 5, 6, …
 * - **Date series**: `['2024-01-01', '2024-01-02']` → continues incrementally
 * - **Fallback**: cycles through the source values
 *
 * Requires `CellSelectionPlugin` (built-in) and writable data via `onDataChange`.
 */
export const AutoFillPlugin: Plugin = {
  name: 'auto-fill',
  layers: [FillHandleLayer as any],
}
