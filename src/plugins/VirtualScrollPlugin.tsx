import { createEffect, createMemo, useContext, createComputed, mergeProps, createSignal, createRenderEffect, mapArray, untrack } from 'solid-js'
import { createMutable, createStore, reconcile } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createScrollPosition } from '@solid-primitives/scroll'
import { createVirtualizer, defaultRangeExtractor, Virtualizer } from '@tanstack/solid-virtual'
import { useVirtualizer } from '@/hooks/useVirtualizer'
import { defaultsDeep } from 'es-toolkit/compat'
import { Ctx, type Plugin } from '../xxx'
import { log } from '@/utils'

const $ML = Symbol()

// const aa: TableProps
declare module '../xxx' {
  interface TableProps {
    virtual?: {
      x?: Partial<Parameters<typeof useVirtualizer>[0]>
      y?: Partial<Parameters<typeof useVirtualizer>[0]>
    }
  }
  interface TableStore {
    // virtualizerY: Virtualizer<HTMLElement, Element>
    // virtualizerX: Virtualizer<HTMLElement, Element>
    virtualizerY: ReturnType<typeof useVirtualizer>
    virtualizerX: ReturnType<typeof useVirtualizer>
  }
}

export const VirtualScrollPlugin: Plugin = {
  processProps: {
    virtual: ({ virtual }) => defaultsDeep(virtual, {
      x: { overscan: 5 },
      y: { overscan: 10 },
    }),
    Table: ({ Table }, { store }) => (o) => {
      let el: HTMLElement

      const { props } = useContext(Ctx)
      
      const virtualizerY = useVirtualizer(mergeProps(() => props.virtual?.y, {
        getScrollElement: () => el,
        get count() { return props.data?.length || 0 },
        estimateSize: () => 32,
        indexAttribute: 'y',
      }))

      const virtualizerX = useVirtualizer(mergeProps(() => props.virtual?.x, {
        horizontal: true,
        getScrollElement: () => el,
        get count() { return props.columns?.length || 0 },
        estimateSize: i => props.columns?.[i].width ?? 40,
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
      }))

      store.virtualizerY = virtualizerY
      store.virtualizerX = virtualizerX

      store[$ML] = createMemo(() => {
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
      const mo = combineProps({ get style() { return `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset ?? 0}px` } }, o)
      return <Td {...mo} />
    },
    Th: ({ Th }, { store }) => (o) => {
      createEffect(() => store.thSizes[o.x] && store.virtualizerX.resizeItem(o.y, store.thSizes[o.x]!.width))
      const ml = createMemo(() => store[$ML]?.()[o.x])
      const mo = combineProps(() => ({ style: `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset ?? 0}px` }), o)
      return <Th {...mo} />
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

