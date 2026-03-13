import { createElementSize } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
import { keyBy, uniqBy } from 'es-toolkit'
import { createComputed, createMemo, createSignal, mergeProps, untrack } from 'solid-js'

/**
 * Fenwick Tree (Binary Indexed Tree)
 * O(log n) point-update and prefix-sum query.
 * Used to compute virtual item positions without rebuilding the full items array.
 */
class FenwickTree {
  n: number
  tree: Float64Array
  constructor(n: number) {
    this.n = n
    this.tree = new Float64Array(n + 1)
  }
  /** O(log n) add delta to index i (0-based) */
  add(i: number, delta: number) {
    for (i += 1; i <= this.n; i += i & -i) this.tree[i] += delta
  }
  /** O(log n) prefix sum [0..i] inclusive (0-based) */
  sum(i: number): number {
    let s = 0
    for (i += 1; i > 0; i -= i & -i) s += this.tree[i]
    return s
  }
  /** Total sum of all elements */
  total(): number {
    return this.n > 0 ? this.sum(this.n - 1) : 0
  }
  /**
   * O(log n) find the 0-based index of the element "containing" offset.
   * Returns smallest i where prefix_sum(0..i) > target.
   */
  findByOffset(target: number): number {
    let i = 0
    for (let pw = 1 << Math.floor(Math.log2(this.n || 1)); pw > 0; pw >>= 1) {
      if (i + pw <= this.n && this.tree[i + pw] <= target) {
        i += pw
        target -= this.tree[i]
      }
    }
    return Math.min(i, this.n - 1)
  }
  /** O(n) build from a sizes array (more efficient than n individual adds) */
  static build(values: number[]): FenwickTree {
    const n = values.length
    const ft = new FenwickTree(n)
    for (let i = 0; i < n; i++) {
      ft.tree[i + 1] += values[i]
      const j = i + 1 + ((i + 1) & -(i + 1))
      if (j <= n) ft.tree[j] += ft.tree[i + 1]
    }
    return ft
  }
}

interface VirtualizerOptions {
  enable?: boolean
  overscan?: number
  batch?: number
  getScrollElement: () => Element
  horizontal?: boolean
  count: number
  estimateSize: (i: number) => number
  extras?: (startIdx: number, endIdx: number) => number[]
  indexAttribute?: string
  rangeExtractor?: (range: any) => number[]
}

export function useVirtualizer(opt: VirtualizerOptions) {
  opt = mergeProps({ overscan: 0, batch: 0, enable: true }, opt)
  const scrollSize = createElementSize(opt.getScrollElement)
  const pos = createScrollPosition(opt.getScrollElement)
  const scrollPos = createMemo(() => opt.horizontal ? pos.x : pos.y)
  const viewSize = createMemo(() => opt.horizontal ? scrollSize.width : scrollSize.height)

  // Plain (non-reactive) sizes array + Fenwick tree.
  // Avoids O(n) full-rebuild on every resizeItem call.
  const sizes: number[] = []
  let tree = new FenwickTree(0)

  // Version signal: bumped by resizeItem; triggers start/end/items recompute.
  const [v, bumpV] = createSignal(0, { equals: false })

  // Grow when count increases; shrink when it decreases.
  createComputed(() => {
    const { count } = opt
    untrack(() => {
      if (count === sizes.length) return
      if (count > sizes.length) {
        for (let i = sizes.length; i < count; i++) sizes.push(opt.estimateSize(i))
      } else {
        sizes.length = count
      }
      // O(n) rebuild of Fenwick tree preserving measured sizes
      tree = FenwickTree.build(sizes.slice(0, count))
      bumpV(0)
    })
  })

  type Item = { start: number; end: number; index: number }
  /** Compute item geometry directly from Fenwick tree — no array needed. */
  const getItem = (i: number): Item => ({
    index: i,
    start: i > 0 ? tree.sum(i - 1) : 0,
    end: tree.sum(i),
  })

  const startIdx = createMemo((prev: number) => {
    v()
    const { batch: batchSize, overscan = 0 } = opt
    let i = tree.findByOffset(scrollPos()) - overscan
    if (batchSize) {
      if (i > prev) i = i <= prev + batchSize ? prev : (i > prev + batchSize * 2 ? i : prev + batchSize)
      else i -= batchSize
    }
    return Math.max(i, 0)
  }, 0)

  const endIdx = createMemo((prev: number) => {
    v()
    const { batch: batchSize, overscan = 0 } = opt
    let i = tree.findByOffset(scrollPos() + viewSize()) + overscan
    if (batchSize) {
      if (i < prev) i = i >= prev - batchSize ? prev : (i < prev - batchSize * 2 ? i : prev - batchSize)
      else i += batchSize
    }
    return Math.min(i, opt.count - 1)
  }, 0)

  const items2 = createMemo(() => {
    v()
    if (!opt.enable) {
      return Array.from({ length: opt.count }, (_, i) => getItem(i))
    }
    let arr: Item[] = []
    for (let i = startIdx(); i <= endIdx(); i++) arr.push(getItem(i))
    if (opt.extras) {
      arr.push(...(opt.extras(startIdx(), endIdx())?.map(i => getItem(i)) || []))
      arr = uniqBy(arr, e => e.index).sort((a, b) => a.index - b.index)
    }
    return arr
  })

  return {
    options: opt,
    startIdx,
    endIdx,
    getTotalSize: () => (v(), tree.total()),
    resizeItem: (i: number, newSize: number) => {
      const old = sizes[i] ?? 0
      if (old === newSize) return
      // Scroll-position correction to prevent jitter when items above viewport resize
      if (i < startIdx()) {
        const el = opt.getScrollElement()
        const scroll = opt.horizontal ? el.scrollLeft : el.scrollTop
        if (scroll !== 0) {
          opt.horizontal
            ? (el.scrollLeft += newSize - old)
            : (el.scrollTop += newSize - old)
        }
      }
      tree.add(i, newSize - old)
      sizes[i] = newSize
      bumpV()
    },
    getVirtualItems: items2,
    getVirtualItem: (() => {
      const keyed = createMemo(() => {
        v()
        const map: Record<number, Item> = {}
        for (const item of items2()) map[item.index] = item
        return map
      })
      return (i: number) => keyed()[i]
    })()
  }
}
