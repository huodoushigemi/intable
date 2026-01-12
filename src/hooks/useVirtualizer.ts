import { createElementSize } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
// import { createVirtualizer } from '@tanstack/solid-virtual'
import { inRange, keyBy, uniqBy } from 'es-toolkit'
import { batch, createComputed, createEffect, createMemo, createRenderEffect, createSignal, mergeProps, untrack } from 'solid-js'
import { createMutable } from 'solid-js/store'

interface VirtualizerOptions {
  enable?: boolean
  overscan?: number
  batch?: number
  getScrollElement: () => Element
  horizontal?: boolean
  count: number
  estimateSize: (i: number) => number
}

export function useVirtualizer(opt: VirtualizerOptions) {
  opt = mergeProps({ overscan: 0, batch: 0, enable: true }, opt)
  const size = createElementSize(opt.getScrollElement)
  const pos = createScrollPosition(opt.getScrollElement)
  const y = createMemo(() => opt.horizontal ? pos.x : pos.y)
  const h = createMemo(() => opt.horizontal ? size.width : size.height)
  const y2 = createMemo(() => y() + h())
  
  const sizes = createMutable(Array(opt.count))
  createComputed(() => {
    const { count } = opt
    untrack(() => {
      for (let i = 0; i < count; i++) sizes[i] ||= opt.estimateSize(i)
    })
  })

  type Item = { start: number; end: number; index: number }
  const [items, setItems] = createSignal([] as Item[])
  createRenderEffect(() => {
    const { count } = opt
    let arr = Array(count) as Item[]
    let t = 0
    for (let i = 0; i < count; i++) {
      arr[i] = { start: t, end: t + sizes[i], index: i }
      t = arr[i].end
    }
    setItems(arr)
  })

  const start = createMemo((prev: number) => {
    const { batch, overscan = 0 } = opt
    let i = findClosestIndex(items(), e => e.start > y() ? -1 : e.end < y() ? 1 : 0)!
    i -= overscan
    if (batch) {
      if (i > prev) i = i <= prev + batch ? prev : (i > prev + batch * 2 ? i : prev + batch)
      else i -= batch
    }
    return Math.max(i, 0)
  }, 0)
  const end = createMemo((prev: number) => {
    const { batch, overscan = 0 } = opt
    let i = findClosestIndex(items(), e => e.start > y2() ? -1 : e.end < y2() ? 1 : 0)
    i += overscan
    if (batch) {
      if (i < prev) i = i >= prev - batch ? prev : (i < prev - batch * 2 ? i : prev - batch)
      else i += batch
    }
    return Math.min(i, opt.count - 1)
  }, 0)
  const items2 = createMemo(() => {
    if (!opt.enable) return items()
    let arr = items().slice(start(), end() + 1)
    if (opt.extras) {
      arr.push(...opt.extras()?.map(i => items()[i]) || [])
      arr = uniqBy(arr, e => e.index).sort((a, b) => a.index - b.index)
    }
    return arr
  })

  function findClosestIndex<T>(arr: T[], fn: (e: T) => any) {
    let l = 0, r = arr.length - 1
    while (l < r) {
      const m = l + Math.floor((r - l) / 2)
      const v = fn(arr[m])
      if (v < 0 && r != m) r = m
      else if (v > 0 && l != m) l = m
      else return m
    }
    return l
  }

  return {
    options: opt,
    getTotalSize: () => items()[items().length - 1]?.end || 0,
    resizeItem: (i, size) => {
      // 修复滚动抖动
      if (i <= start() && size != sizes[i]) {
        const el = opt.getScrollElement()
        const v = opt.horizontal ? el.scrollLeft : el.scrollTop
        if (v != 0) {
          opt.horizontal
            ? el.scrollLeft += size - sizes[i]
            : el.scrollTop += size - sizes[i]
        }
      }
      sizes[i] = size
    },
    getVirtualItems: items2,
    // getVirtualIndexes: createMemo(() => items2().map(e => e.index))
    getVirtualItem: (() => {
      const keybyed = createMemo(() => keyBy(items2(), e => e.index))
      return i => keybyed()[i]
    })()
  }
}
