import { createEffect, createMemo, useContext, createComputed, mergeProps, createSignal, createRenderEffect, mapArray, untrack } from 'solid-js'
import { createMutable, createStore, reconcile } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createScrollPosition } from '@solid-primitives/scroll'
import { createVirtualizer, defaultRangeExtractor, Virtualizer } from '@tanstack/solid-virtual'
import { Ctx, type Plugin } from '../xxx'
import { createElementSize } from '@solid-primitives/resize-observer'
import { uniqBy } from 'es-toolkit'
import { log } from '@/utils'

const $ML = Symbol()

// const aa: TableProps
declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    virtualizerY: Virtualizer<HTMLElement, Element>
    virtualizerX: Virtualizer<HTMLElement, Element>
  }
}

function useVirtualizer(opt) {
  opt = mergeProps({ overscan: 0 }, opt)
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

  const start = createMemo(() => {
    const i = findClosestIndex(items(), e => e.start > y() ? -1 : e.end < y() ? 1 : 0)!
    return Math.max(i - opt.overscan, 0)
  })
  const end = createMemo(() => {
    const i = findClosestIndex(items(), e => e.start > y2() ? -1 : e.end < y2() ? 1 : 0)
    return Math.min(i + opt.overscan, opt.count - 1)
  })
  const items2 = createMemo(() => {
    const arr = items().slice(start(), end() + 1).concat(opt.extras?.()?.map(i => items()[i]) || [])
    return uniqBy(arr, e => e.index).sort((a, b) => a.index - b.index)
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
    getTotalSize: () => items()[items().length - 1].end,
    resizeItem: (i, size) => {
      if (i <= start() && size != sizes[i]) opt.getScrollElement().scrollTop += size - sizes[i] // 修复滚动抖动
      sizes[i] = size
    },
    getVirtualItems: items2
  }
}

export const VirtualScrollPlugin: Plugin = {
  processProps: {
    Table: ({ Table }, { store }) => (o) => {
      let el: HTMLElement

      const { props } = useContext(Ctx)
      
      const virtualizerY = useVirtualizer({
        getScrollElement: () => el,
        get count() { return props.data?.length || 0 },
        estimateSize: () => 20,
        overscan: 10,
        indexAttribute: 'y',
      })

      const virtualizerX = useVirtualizer({
        horizontal: true,
        getScrollElement: () => el,
        get count() { return props.columns?.length || 0 },
        estimateSize: i => props.columns?.[i].width ?? 40,
        overscan: 5,
        indexAttribute: 'x',
        rangeExtractor(range) {
          return [
            ...new Set([
              ...props.columns?.map((e, i) => e.fixed ? i : void 0).filter(e => e != null) || [],
              ...defaultRangeExtractor(range)
            ])
          ]
        },
        extras: () => props.columns?.map((e, i) => e.fixed ? i : void 0).filter(e => e != null) || []
      })

      store.virtualizerY = virtualizerY
      store.virtualizerX = virtualizerX

      store[$ML] ??= createMemo(() => {
        const items = store.virtualizerX.getVirtualItems()
        const ret = {}
        for (let i = 1; i < items.length; i++) {
          const item = items[i], prev = items[i - 1]
          if (item.index - prev.index > 1) ret[item.index] = { item, offset: item.start - prev.end }
        }
        return ret
      })

      o = combineProps({ ref: e => el = e, class: 'virtual' }, o)

      return (
        <Table {...o}>
          {o.children}
          <div style={`position: absolute; top: 0; width: ${store.virtualizerX.getTotalSize()}px; height: ${store.virtualizerY.getTotalSize()}px; z-index: -1`} />
        </Table>
      )
    },
    Td: ({ Td }, { store }) => (o) => {
      const ml = createMemo(() => store[$ML]()[o.x])
      const mo = combineProps({ get style() { return `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset}px` } }, o)
      return <Td {...mo} />
    },
    Th: ({ Th }, { store }) => (o) => {
      const ml = createMemo(() => store[$ML]?.()[o.x])
      o = combineProps(() => ({ style: `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset}px` }), o)
      createEffect(() => store.thSizes[o.x] && store.virtualizerX.resizeItem(o.y, store.thSizes[o.x]!.width))
      return <Th {...o} />
    },
    Tr: ({ Tr }, { store }) => (o) => {
      createEffect(() => store.trSizes[o.y] && store.virtualizerY.resizeItem(o.y, store.trSizes[o.y]!.height))
      return <Tr {...o} />
    },
    Thead: ({ Thead }, { store }) => o => {
      o = combineProps(() => ({
        style: `transform: translate(${store.virtualizerX.getVirtualItems()[0]?.start}px, ${0}px);`
      }), o)
      return <Thead {...o} />
    },
    Tbody: ({ Tbody }, { store }) => o => {
      o = combineProps(() => ({
        style: `transform: translate(${store.virtualizerX.getVirtualItems()[0]?.start}px, ${store.virtualizerY.getVirtualItems()[0]?.start}px);`
      }), o)
      return <Tbody {...o} />
    },
    // tr: ({ tr }, { store }) => (o) => {
    //   let el
    //   o = combineProps({ ref: e => el = e }, o)
    //   o = combineProps(() => ({ style: `transform: translate(0, ${store.virtualizerY.getOffsetForIndex(o.y, 'start')?.[0]}px); position: absolute` }), o)
    //   onMount(() => store.virtualizerY.measureElement(el))
    //   return <Dynamic component={tr} {...o} />
    // },
    // tbody: ({ tbody }, { store }) => o => {
    //   o = combineProps(() => ({
    //     style: `width: ${store.virtualizerX.getTotalSize()}px; height: ${store.virtualizerY.getTotalSize()}px`
    //   }), o)
    //   return <Dynamic component={tbody} {...o} />
    // },
    EachRows: ({ EachRows }, { store }) => (o) => {
      const list = createMemo(() => store.virtualizerY.getVirtualItems().map(e => o.each[e.index]))
      return (
        <EachRows {...o} each={list()}>
          {(e, i) => {
            return o.children(e, createMemo(() => store.virtualizerY.getVirtualItems()[i()]?.index))
          }}
        </EachRows>
      )
    },
    EachCells: ({ EachCells }, { store }) => (o) => {
      const list = createMemo(() => store.virtualizerX.getVirtualItems().map(e => o.each[e.index]))
      return (
        <EachCells {...o} each={list()}>
          {(e, i) => {
            return o.children(e, createMemo(() => store.virtualizerX.getVirtualItems()[i()]?.index))
          }}
        </EachCells>
      )
    },
  }
}