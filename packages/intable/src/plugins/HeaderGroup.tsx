import { For, Show, useContext, createMemo, createSignal, createEffect } from 'solid-js'
import { Ctx, type Plugin$0, type TableColumn, type TableStore } from '..'

declare module '../index' {
  interface TableColumn {
    children?: TableColumn[]
  }
  interface TableStore {
    /** Returns column indices of group anchors whose span overlaps [xStart, xEnd]. */
    _headerGroupAnchors?: (xStart: number, xEnd: number) => number[]
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Count the number of leaf columns under a node (colspan). */
function leafCount(col: TableColumn): number {
  if (!col.children?.length) return 1
  return col.children.reduce((n, c) => n + leafCount(c), 0)
}

/** Calculate the maximum depth of the column tree. */
function maxDepth(columns: TableColumn[]): number {
  let d = 0
  for (const col of columns) {
    if (col.children?.length) {
      d = Math.max(d, maxDepth(col.children))
    }
  }
  return d + 1
}

/** Collect all leaf columns in tree order (these are what the body renders). */
function flatLeaves(columns: TableColumn[], out: TableColumn[] = [], store: TableStore): TableColumn[] {
  for (const col of columns) {
    col[store.ID] ??= Symbol()
    if (col.children?.length) {
      flatLeaves(col.children, out, store)
    } else {
      out.push(col)
    }
  }
  return out
}

// ── Flat grid for flex-compatible header rows ────────────────────────────

type CellKind = 'anchor' | 'colspan-hidden' | 'rowspan-hidden'

interface GridCell {
  kind: CellKind
  /** The column object that owns this cell (group col for anchors, leaf col for placeholders) */
  anchorCol: TableColumn
  colspan: number
  rowspan: number
}

/**
 * Build a 2-D grid `[row][colIdx]` where `colIdx` maps 1:1 with `allCols`
 * (i.e. `props.columns` which includes internal + leaf columns).
 *
 * Every row has exactly `allCols.length` entries so flex rows stay aligned.
 */
function buildFlatGrid(
  rawCols: TableColumn[],
  totalDepth: number,
  allCols: TableColumn[],
  rawToIdx: Map<TableColumn, number>,
  rawLeaves: TableColumn[],
  store: TableStore,
): (GridCell | null)[][] {

  const width = allCols.length
  const grid: (GridCell | null)[][] = Array.from({ length: totalDepth }, () =>
    new Array(width).fill(null),
  )

  let leafOffset = 0

  function walk(cols: TableColumn[], depth: number) {
    for (const col of cols) {
      const hasChildren = !!col.children?.length
      const lc = leafCount(col)
      const rs = hasChildren ? 1 : totalDepth - depth

      // Find starting index in allCols
      const anchorLeaf = hasChildren ? rawLeaves[leafOffset] : col
      const startIdx = rawToIdx.get(anchorLeaf[store.ID])
      if (startIdx == null) { if (!hasChildren) leafOffset++; continue }

      // Anchor cell
      grid[depth][startIdx] = { kind: 'anchor', anchorCol: col, colspan: lc, rowspan: rs }

      // Colspan-covered (same row, to the right)
      for (let dx = 1; dx < lc; dx++) {
        grid[depth][startIdx + dx] = { kind: 'colspan-hidden', anchorCol: col, colspan: lc, rowspan: rs }
      }

      // Rowspan-covered (subsequent rows)
      for (let dy = 1; dy < rs; dy++) {
        for (let dx = 0; dx < lc; dx++) {
          grid[depth + dy][startIdx + dx] = { kind: 'rowspan-hidden', anchorCol: allCols[startIdx + dx], colspan: 1, rowspan: 1 }
        }
      }

      if (hasChildren) {
        walk(col.children!, depth + 1)
      } else {
        leafOffset++
      }
    }
  }

  leafOffset = 0
  walk(rawCols, 0)

  // Fill positions for internal columns (index, expand, row-selection…)
  for (let i = 0; i < width; i++) {
    if (grid[0][i] != null) continue
    const col = allCols[i]
    if (col[store.internal]) {
      grid[0][i] = { kind: 'anchor', anchorCol: col, colspan: 1, rowspan: totalDepth }
      for (let dy = 1; dy < totalDepth; dy++) {
        grid[dy][i] = { kind: 'rowspan-hidden', anchorCol: col, colspan: 1, rowspan: 1 }
      }
    }
  }

  return grid
}

// ── Plugin ───────────────────────────────────────────────────────────────

export const HeaderGroupPlugin: Plugin$0 = {
  name: 'header-group',

  store: (store) => ({
    /**
     * Called inside VirtualScrollPlugin's X-virtualizer extras callback.
     * Returns the column indices of every group anchor whose span overlaps [xStart, xEnd]
     * so that group header cells are always rendered even when their anchor column has
     * scrolled out of the visible window.
     */
    _headerGroupAnchors(xStart: number, xEnd: number): number[] {
      const rawCols = store.rawProps.columns || []
      if (!rawCols.some(c => (c as TableColumn).children?.length)) return []
      if (maxDepth(rawCols) <= 1) return []

      const allCols = store.props.columns || []
      const rawLeaves = flatLeaves(rawCols, [], store)

      const rawToIdx = new Map<TableColumn, number>()
      for (let i = 0; i < allCols.length; i++) {
        rawToIdx.set(allCols[i][store.ID], i)
      }

      const anchors: number[] = []
      let leafOffset = 0

      function walk(cols: TableColumn[]) {
        for (const col of cols) {
          if (col.children?.length) {
            const lc = leafCount(col)
            const anchorLeaf = rawLeaves[leafOffset]
            if (anchorLeaf) {
              const si = rawToIdx.get(anchorLeaf[store.ID])
              if (si != null) {
                const ei = si + lc - 1
                if (si <= xEnd && ei >= xStart) anchors.push(si)
              }
            }
            walk(col.children!)
          } else {
            leafOffset++
          }
        }
      }

      walk(rawCols)
      return anchors
    },
  }),

  rewriteProps: {
    /**
     * Flatten nested column definitions into leaf-only columns for the body.
     * The header rendering is handled entirely by the Thead rewrite.
     */
    columns: ({ columns }, { store }) => flatLeaves(columns, [], store),

    /**
     * Replace the default single-row <Thead> with a multi-row header
     * using a flat grid: every row has exactly `props.columns.length` entries
     * so that flex-based virtual scroll renders correct alignment.
     *
     * Cell types:
     *  - anchor: visible cell with content, colspan/rowspan props
     *  - colspan-hidden: covered by an anchor to the left (display:none)
     *  - rowspan-hidden: covered by an anchor above (visibility:hidden in
     *    flex mode to preserve width, display:none in table mode)
     */
    Thead: ({ Thead }, { store }) => o => {
      const { props } = useContext(Ctx)

      const gridData = createMemo(() => {
        const rawCols = store.rawProps.columns || []
        const depth = maxDepth(rawCols)
        if (depth <= 1) return null

        const allCols = props.columns || []
        const rawLeaves = flatLeaves(rawCols, [], store)

        // Map raw column identity → index in allCols (props.columns)
        const rawToIdx = new Map<TableColumn, number>()
        for (let i = 0; i < allCols.length; i++) {
          rawToIdx.set(allCols[i][store.ID], i)
        }

        const grid = buildFlatGrid(rawCols, depth, allCols, rawToIdx, rawLeaves, store)
        return { grid, depth }
      })

      // Measure header row height for rowspan overflow in flex mode.
      // The last row (all leaf cells) gives the base height.
      const [headerRowH, setHeaderRowH] = createSignal(24)
      createEffect(() => {
        const thead = store.thead
        if (!thead) return
        const trs = thead.querySelectorAll(':scope > tr')
        const lastTr = trs[trs.length - 1] as HTMLElement | undefined
        if (lastTr) setHeaderRowH(lastTr.offsetHeight || 24)
      })

      const isVirtual = () => !!store.virtualizerX

      return (
        <Show when={gridData()} fallback={<Thead {...o} />}>
          {data => (
            <Thead {...o}>
              <For each={data().grid}>{(row, rowIdx) => (
                <props.Tr
                  style={isVirtual()
                    ? `height:${headerRowH()}px;overflow:visible;position:relative;z-index:${data().depth - rowIdx()}`
                    : ''}
                >
                  <props.EachCells each={props.columns}>
                    {(col, colIdx) => {
                      const cell = () => row[colIdx()]
                      if (!cell()) return null

                      const style = () => {
                        const c = cell()!
                        if (c.kind === 'anchor') {
                          // In flex mode, rowspan cells need explicit height to overflow into rows below
                          if (isVirtual() && c.rowspan > 1 && headerRowH()) {
                            return `height:${c.rowspan * headerRowH()}px;position:relative;`
                          }
                          return ''
                        }
                        if (c.kind === 'colspan-hidden') return 'display:none'
                        // rowspan-hidden: in flex mode keep width for alignment; in table mode hide completely
                        if (c.kind === 'rowspan-hidden') return isVirtual() ? 'visibility:hidden' : 'display:none'
                        return ''
                      }

                      const isAnchor = () => cell()!.kind === 'anchor'

                      return (
                        <props.Th
                          x={colIdx()}
                          col={isAnchor() ? cell()!.anchorCol : col()}
                          colspan={isAnchor() && cell()!.colspan > 1 ? cell()!.colspan : undefined}
                          rowspan={isAnchor() && cell()!.rowspan > 1 ? cell()!.rowspan : undefined}
                          style={style()}
                          covered={!isAnchor()}
                        >
                          {isAnchor() ? cell()!.anchorCol.name : ''}
                        </props.Th>
                      )
                    }}
                  </props.EachCells>
                </props.Tr>
              )}</For>
            </Thead>
          )}
        </Show>
      )
    },
  },
}