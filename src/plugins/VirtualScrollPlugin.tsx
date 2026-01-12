import { createEffect, createMemo, useContext, mergeProps, batch } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createElementSize } from '@solid-primitives/resize-observer'
import { createVirtualizer, defaultRangeExtractor, Virtualizer } from '@tanstack/solid-virtual'
import { useVirtualizer } from '@/hooks/useVirtualizer'
import { defaultsDeep } from 'es-toolkit/compat'
import { Ctx, type Plugin } from '..'

const $ML = Symbol()

declare module '../index' {
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
  rewriteProps: {
    virtual: ({ virtual }) => defaultsDeep(virtual, {
      // x: { overscan: 5 },
      // y: { overscan: 10 },
      x: { batch: 3, overscan: 2 },
      y: { batch: 5, overscan: 5 },
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

      createEffect(() => {
        const { table, tbody } = store
        table.style.width = store.virtualizerX.getTotalSize() + 'px'
        table.style.height = store.virtualizerY.getTotalSize() + (store.thead?.offsetHeight || 0) + 'px'
      })

      return <Table {...o} />
    },
    Thead: ({ Thead }, { store }) => o => {
      o = combineProps(({
        get style() { return `transform: translate(${store.virtualizerX.getVirtualItems()[0]?.start}px, ${0}px);` }
      }), o)
      return <Thead {...o} />
    },
    Tbody: ({ Tbody }, { store }) => o => {
      o = combineProps({
        get style() { return `transform: translate(${store.virtualizerX.getVirtualItems()[0]?.start}px, ${store.virtualizerY.getVirtualItems()[0]?.start}px)` }
      }, o)
      return <Tbody {...o} />
    },
    Tr: ({ Tr }, { store }) => (o) => {
      createEffect(() => store.trSizes[o.y] && store.virtualizerY.resizeItem(o.y, store.trSizes[o.y]!.height))
      return <Tr {...o} />
    },
    Td: ({ Td }, { store }) => (o) => {
      const ml = createMemo(() => store[$ML]()[o.x])
      const mo = combineProps({ get style() { return `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset ?? 0}px` } }, o)
      return <Td {...mo} />
    },
    Th: ({ Th }, { store }) => (o) => {
      createEffect(() => store.thSizes[o.x] && store.virtualizerX.resizeItem(o.x, store.thSizes[o.x]!.width))
      const ml = createMemo(() => store[$ML]?.()[o.x])
      const mo = combineProps(() => ({ style: `width: ${o.col.width || 80}px; margin-left: ${ml()?.offset ?? 0}px` }), o)
      return <Th {...mo} />
    },
    
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
