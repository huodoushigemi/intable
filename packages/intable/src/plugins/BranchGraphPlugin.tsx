import { createMemo, Show, type JSX } from 'solid-js'
import { type Plugin$0, type TableColumn, type TableStore } from '../index'
import { solidComponent } from '../components/utils'
import { toArr } from '../utils'
import { combineProps } from '@solid-primitives/props'

// ------------------------------------------------------------
// Module augmentation
// ------------------------------------------------------------

declare module '../index' {
  interface TableProps {
    /**
     * Render a git-style branch graph in a dedicated leading column.
     *
     * Each row links to its parent(s) via a `parentid` field (a single id or an
     * array of ids for merge rows). Display order must be topological: a parent
     * must appear above its children. The connecting lines are drawn as a single
     * SVG overlay injected through `rewriteProps.Table`.
     */
    branchGraph?: {
      /** Field holding a row's parent id(s). Default `'parentid'`. */
      parentField?: string
      /** Branch graph column width. Default `120`. */
      width?: number
      /** Pixel gap between lanes. Default `18`. */
      laneGap?: number
      /** Lane color palette (cycled by lane index). */
      colors?: string[]
    }
  }
}

// ------------------------------------------------------------
// Layout
// ------------------------------------------------------------

interface BranchNode {
  y: number
  nodeLane: number
  /** Parent keys - resolved via `laneByKey` / `indexByKey` to draw connecting lines. */
  parents: any[]
  key: any
}
interface BranchLayout {
  rows: BranchNode[]
  laneByKey: Map<any, number>
  indexByKey: Map<any, number>
}

/**
 * Assign each row to a horizontal "lane" (for x-positioning) and record its parent
 * keys. Single top-down pass.
 *
 *  - A parent's *last* child continues straight in the parent's lane.
 *  - Every other child starts a fresh lane.
 *  - A lane is reclaimed once the owner's last child has been placed.
 *
 * Drawing is then just: one circle per node, plus a line from each node's circle to
 * each of its parent's circles.
 */
function computeLayout(data: any[], rowKey: string, parentField: string): BranchLayout | null {
  if (!data?.length) return null
  const keyOf = (r: any) => r?.[rowKey]
  const indexByKey = new Map<any, number>()
  const lastChildRow = new Map<any, number>()   // key -> row index of its last child
  const childrenByKey = new Map<any, any[]>()
  data.forEach((r, i) => {
    const k = keyOf(r)
    indexByKey.set(k, i)
    for (const pk of toArr(r?.[parentField])) {
      lastChildRow.set(pk, i)
      if (!childrenByKey.has(pk)) childrenByKey.set(pk, [])
      childrenByKey.get(pk)!.push(k)
    }
  })
  // helper: row‑index range a node's line would span on whatever lane it occupies
  const spanOf = (row: number, parentKeys: any[]) => {
    const r = Math.min(row, ...parentKeys.map(pk => indexByKey.get(pk) ?? row))
    return [r, Math.max(row, ...parentKeys.map(pk => indexByKey.get(pk) ?? row))]
  }
  // descendant count per key (memoised). Used to decide which child inherits the
  // parent's lane in bottom-up data — the child with the largest subtree continues
  // straight on the main line.
  const descCount = new Map<any, number>()
  const countDesc = (k: any): number => {
    if (descCount.has(k)) return descCount.get(k)!
    let n = (childrenByKey.get(k)?.length ?? 0)
    for (const c of childrenByKey.get(k) ?? []) n += countDesc(c)
    descCount.set(k, n)
    return n
  }
  for (const d of data) countDesc(keyOf(d))

  const rows: BranchNode[] = []
  const laneByKey = new Map<any, number>()
  // parent key → { lane, claimantKey } — overwritten only by a claimant with more descendants
  const childLaneByParent = new Map<any, { lane: number; claimant: any }>()
  const lanes: any[] = []          // lanes[i] = owner key, or null when free

  data.forEach((r, i) => {
    const k = keyOf(r)
    const pks = toArr(r?.[parentField])

    // reclaim lanes whose owner's last child is above this row and the owner
    // has no unresolved parent still pending below (bottom-up: a child must
    // keep its lane alive until its parent inherits it)
    for (let L = 0; L < lanes.length; L++) {
      const owner = lanes[L]
      if (owner == null) continue
      const ownerLcr = lastChildRow.get(owner)
      if (ownerLcr == null) continue    // leaf node — keep its lane as a distinct branch channel
      if (ownerLcr < i) {
        const ownerRow = indexByKey.get(owner)!
        const hasPendingParent = (ownerRow != null)
          && toArr(data[ownerRow]?.[parentField]).some(pk => (indexByKey.get(pk) ?? -1) >= i)
        if (!hasPendingParent) lanes[L] = null
      }
    }

    // continue in a parent's lane if this is that parent's descendant‑heaviest child
    let nodeLane = -1
    for (const pk of pks) {
      const L = lanes.indexOf(pk)
      if (L === -1) continue
      const pkChildren = childrenByKey.get(pk)
      if (!pkChildren) continue
      const best = pkChildren.reduce((a, c) => (descCount.get(c) ?? 0) > (descCount.get(a) ?? 0) ? c : a, pkChildren[0])
      if (best === k) { nodeLane = L; break }
    }
    // fallback: take a child's lane when the parent hasn't been placed yet (bottom‑up)
    if (nodeLane === -1) {
      const childLane = childLaneByParent.get(k)
      if (childLane != null && lanes[childLane.lane] != null) nodeLane = childLane.lane
    }
    // pick a free lane, or reuse a leaf-owned lane whose line span doesn't overlap
    if (nodeLane === -1) {
      const [nMin, nMax] = spanOf(i, pks)
      for (let L = 0; L < lanes.length; L++) {
        const o = lanes[L]
        if (o == null) { nodeLane = L; break }
        if (lastChildRow.get(o) != null) continue
        const oRow = indexByKey.get(o)!
        const oPks = toArr(data[oRow]?.[parentField])
        if (oPks.some(p => (indexByKey.get(p) ?? -1) >= i)) continue
        const [oMin, oMax] = spanOf(oRow, oPks)
        if (oMax < nMin || nMax < oMin) { nodeLane = L; break }
      }
      if (nodeLane === -1) nodeLane = lanes.length
    }

    laneByKey.set(k, nodeLane)
    rows.push({ y: i, nodeLane, parents: pks, key: k })
    lanes[nodeLane] = k

    // record lane for the primary yet-unplaced parent so it connects back up to
    // this node when processed later (bottom-up). The child with the most
    // descendants continues straight; secondary parents start new branches.
    for (const pk of pks) {
      if (lanes.indexOf(pk) !== -1) continue
      const cur = childLaneByParent.get(pk)
      const myDesc = descCount.get(k) ?? 0
      if (!cur || myDesc > (descCount.get(cur.claimant) ?? 0))
        childLaneByParent.set(pk, { lane: nodeLane, claimant: k })
      break
    }
  })

  return { rows, laneByKey, indexByKey }
}

// ------------------------------------------------------------
// SVG overlay (rendered through rewriteProps.Table)
// ------------------------------------------------------------

const DEFAULT_COLORS = ['#51a2ff', '#f5a623', '#7ed321', '#d6418c', '#9b59b6', '#1abc9c', '#e74c3c', '#34495e']

function curve(xChild: number, yChild: number, xParent: number, yParent: number, stroke: string, continues: boolean): JSX.Element {
  // Straight along the child's lane for most of the span, then a short 30 px cubic
  // bend (controls at ±15 px) to the parent's lane near the target node.
  //   merge        (continues) → bend near the child  (merge node)
  //   branch‑off  (!continues) → bend near the parent (main‑line node)
  const s = Math.sign(yParent - yChild)        // +1 = parent below, -1 = parent above
  const span = Math.abs(yChild - yParent)
  const cl = 15                                // curve half‑length (controls offset)

  if (span <= cl * 2) {
    const ym = (yChild + yParent) / 2
    return (<path d={`M ${xChild} ${yChild} C ${xChild} ${ym} ${xParent} ${ym} ${xParent} ${yParent}`} fill="none" stroke={stroke} stroke-width="1.5" />)
  }

  if (continues) {
    // bend near the child — straight on the parent lane (branch) for most of the way
    return (<path d={`M ${xChild} ${yChild} L ${xChild} ${yChild + s * cl * 2} C ${xChild} ${yChild + s * cl} ${xParent} ${yChild + s * cl} ${xParent} ${yParent}`} fill="none" stroke={stroke} stroke-width="1.5" />)
  }
  // bend near the parent — straight on the child lane (branch) for most of the way
  return (<path d={`M ${xChild} ${yChild} L ${xChild} ${yParent - s * cl * 2} C ${xChild} ${yParent - s * cl} ${xParent} ${yParent - s * cl} ${xParent} ${yParent}`} fill="none" stroke={stroke} stroke-width="1.5" />)
}

function BranchGraphSVG(props: { store: TableStore }) {
  const store = props.store
  const cfg = () => store.props.branchGraph
  const palette = () => cfg()?.colors || DEFAULT_COLORS
  const laneGap = () => cfg()?.laneGap ?? 18

  const layout = createMemo(() => {
    const c = cfg()
    if (!c) return null
    return computeLayout(store.props.data, store.props.rowKey, c.parentField || 'parentid')
  })

  // locate the injected branch-graph column by identity (stored on the store)
  const branchIdx = createMemo(() => store.props.columns.findIndex(e => e.id == store.$branchCol.id))
  const branchOffset = createMemo(() => store.thSizes.slice(0, branchIdx()).reduce((s, t) => s + (t?.width || 0), 0))
  const branchWidth = createMemo(() => store.thSizes[branchIdx()]?.width ?? cfg()?.width ?? 120)
  const headerH = createMemo(() => store.thSizes[0]?.height ?? 0)

  // y-center of each row, accumulated from measured row heights (fallback to the first row's)
  const yCenters = createMemo(() => {
    const data = store.props.data, def = store.trSizes[0]?.height ?? 36
    let acc = 0
    return data.map((_, y) => {
      const h = store.trSizes[y]?.height ?? def
      const c = acc + h / 2
      acc += h
      return c
    })
  })

  const color = (L: number) => palette()[L % palette().length]
  const laneX = (L: number) => laneGap() + L * laneGap()

  // ---- hover focus (ancestors only, triggered by the Tr rewriteProp) ----
  const parentsByKey = createMemo(() => {
    const ly = layout()
    const m = new Map<any, any[]>()
    if (!ly) return m
    for (const n of ly.rows) m.set(n.key, n.parents)
    return m
  })

  const focus = createMemo(() => {
    const hk = store._branchHoverKey
    if (hk == null) return null          // null = no hover: show everything at full opacity
    const p = parentsByKey()
    const s = new Set([hk])
    let stack = [hk]
    while (stack.length) {
      const k = stack.pop()!
      for (const pk of p.get(k) ?? []) { if (!s.has(pk)) { s.add(pk); stack.push(pk) } }
    }
    return s
  })

  // ---- draw ----
  const elements = createMemo<JSX.Element[]>(() => {
    const ly = layout()
    if (!ly) return []
    const ys = yCenters()
    const { rows, laneByKey, indexByKey } = ly
    const f = focus()
    const lines: JSX.Element[] = []
    const circles: JSX.Element[] = []
    for (const n of rows) {
      const xNode = laneX(n.nodeLane), yNode = ys[n.y]
      const nodeColor = color(n.nodeLane)
      const continues = n.parents.some(pk => laneByKey.get(pk) === n.nodeLane)
      for (const pk of n.parents) {
        const pLane = laneByKey.get(pk), pRow = indexByKey.get(pk)
        if (pLane == null || pRow == null) continue
        const xP = laneX(pLane), yP = ys[pRow]
        // a line is "on the path" when both endpoints are in the focus set
        const on = f == null || (f.has(n.key) && f.has(pk))
        const o = on ? 1 : 0.12
        if (n.nodeLane === pLane) {
          lines.push(<line x1={xNode} y1={yNode} x2={xP} y2={yP} stroke={nodeColor} stroke-width="1.5" opacity={o} />)
        } else {
          lines.push(<g opacity={o}>{curve(xNode, yNode, xP, yP, color(continues ? pLane : n.nodeLane), continues)}</g>)
        }
      }
      circles.push(
        <circle cx={xNode} cy={yNode} r="4" fill={nodeColor} stroke="#fff" stroke-width="1" opacity={f == null || f.has(n.key) ? 1 : 0.2} />
      )
    }
    return [...lines, ...circles]
  })

  return (
    <Show when={layout() && branchIdx() >= 0}>
      <svg
        class="branch-graph-svg"
        style={{
          position: 'absolute',
          left: `${branchOffset()}px`,
          top: `${headerH()}px`,
          width: `${branchWidth()}px`,
          height: `calc(100% - ${headerH()}px)`,
          'pointer-events': 'none',
          'z-index': '3',
        }}
      >
        {elements()}
      </svg>
    </Show>
  )
}

// ------------------------------------------------------------
// Plugin
// ------------------------------------------------------------

export const BranchGraphPlugin: Plugin$0 = () => ({
  name: 'branch-graph',

  // The branch-graph column is created once and stashed on the store (mirrors the
  // `$index` pattern) so its identity stays stable and the `columns` rewriteProp /
  // SVG overlay can reference it via `store.$branchCol`. Only created when the
  // user opts in via `branchGraph`.
  store: (store) => ({
      _branchHoverKey: null as any,
      $branchCol: {
        id: Symbol('branch-graph'),
        name: '',
        width: 120,
        [store.internal]: 1,
        class: 'branch-graph-col',
        // empty placeholder so the cell keeps its height; the graph is drawn by the SVG overlay
        render: solidComponent(() => <span style="display:none" />),
      } as TableColumn,
  }),

  rewriteProps: {
    // only materialise a config when the user opts in (keeps `store.props.branchGraph`
    // falsy otherwise, so the column / overlay stay opt-in)
    branchGraph: ({ branchGraph }) => branchGraph ? {
      parentField: 'parentid',
      width: 120,
      laneGap: 18,
      colors: DEFAULT_COLORS,
      ...branchGraph,
    } : branchGraph,

    columns: ({ columns }, { store }) =>
      store.props.branchGraph ? [store.$branchCol, ...columns || []] : columns,

    // track which row is hovered so the SVG can dim unrelated nodes & lines
    Tr: ({ Tr }, { store }) => o => {
      o = combineProps(o, {
        onPointerEnter: () => { store._branchHoverKey = o.data?.[store.props.rowKey] },
        onPointerLeave: () => { store._branchHoverKey = null },
      })
      return <Tr {...o} />
    },

    // wrap the <table> and overlay a single SVG that draws every branch line / node
    Table: ({ Table }, { store }) => o => {
      o = combineProps(o, { class: 'relative' })
      return (
        <Table {...o}>
          {o.children}
          <BranchGraphSVG store={store} />
        </Table>
      )
    },
  },
})
