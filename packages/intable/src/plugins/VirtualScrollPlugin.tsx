import { createEffect, createMemo, useContext, mergeProps } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { defaultRangeExtractor } from '@tanstack/solid-virtual'
import { defaultsDeep } from 'es-toolkit/compat'
import { useVirtualizer } from '../hooks/useVirtualizer'
import { RecycleList } from '../components/RecycleList'
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
  name: 'virtual-scroll',
  rewriteProps: {
    virtual: ({ virtual }) => defaultsDeep(virtual, {
      x: { overscan: 5 },
      y: { overscan: 10 },
      // x: { batch: 3, overscan: 2 },
      // y: { batch: 5, overscan: 5 },
    }),
    Table: ({ Table }, { store }) => (o) => {
      let el: HTMLElement

      const { props } = useContext(Ctx)
      
      const virtualizerY = useVirtualizer(mergeProps(() => props.virtual?.y, {
        getScrollElement: () => el,
        get count() { return props.data?.length || 0 },
        estimateSize: () => 32,
        indexAttribute: 'y',
        extras: (yStart, yEnd) => {
          const mergeMap = store._mergeMap?.()
          if (!mergeMap?.spans.size) return []
          const vx = store.virtualizerX
          const xStart = vx ? vx.startIdx() : 0
          const xEnd = vx ? vx.endIdx() : Infinity
          const extras: number[] = []
          for (const [key, span] of mergeMap.spans) {
            if (span.rowspan <= 1) continue
            const [ay, ax] = key.split(',').map(Number)
            if (ay > yEnd || ay + span.rowspan - 1 < yStart) continue
            if (ax > xEnd || ax + span.colspan - 1 < xStart) continue
            for (let dy = 0; dy < span.rowspan; dy++) extras.push(ay + dy)
          }
          return extras
        },
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
        extras: (xStart, xEnd) => {
          const fixed = props.columns?.map((e, i) => e.fixed ? i : void 0).filter(e => e != null) || []
          const headerAnchors = store._headerGroupAnchors?.(xStart, xEnd) || []
          const base = new Set<number>([...fixed, ...headerAnchors])
          const mergeMap = store._mergeMap?.()
          if (!mergeMap?.spans.size) return [...base]
          const yStart = virtualizerY.startIdx(), yEnd = virtualizerY.endIdx()
          for (const [key, span] of mergeMap.spans) {
            if (span.colspan <= 1) continue
            const [ay, ax] = key.split(',').map(Number)
            if (ay > yEnd || ay + span.rowspan - 1 < yStart) continue
            if (ax > xEnd || ax + span.colspan - 1 < xStart) continue
            for (let dx = 0; dx < span.colspan; dx++) base.add(ax + dx)
          }
          return [...base]
        },
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
        const { table } = store
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
      createEffect(() => o.y != null && store.trSizes[o.y] && store.virtualizerY.resizeItem(o.y!, store.trSizes[o.y!]!.height))
      return <Tr {...o} />
    },
    Td: ({ Td }, { store }) => (o) => {
      const ml = createMemo(() => store[$ML]()[o.x])
      const mo = combineProps({ get style() {
        const cs = o.colspan ?? 1
        const w = cs > 1
          ? Array.from({ length: cs }, (_, dx) => store.props.columns?.[o.x + dx]?.width ?? 80).reduce((a, b) => a + b, 0)
          : (o.col.width || 80)
        return `width: ${w}px; margin-left: ${o.col.fixed ? 0 : ml()?.offset ?? 0}px`
      } }, o)
      return <Td {...mo} />
    },
    Th: ({ Th }, { store }) => (o) => {
      // Only resize the virtualizer for single-column cells; colspan cells would report
      // their combined width which shouldn't override individual column sizes.
      createEffect(() => (o.colspan ?? 1) === 1 && store.thSizes[o.x] && store.virtualizerX.resizeItem(o.x, store.thSizes[o.x]!.width))
      const ml = createMemo(() => store[$ML]?.()[o.x])
      const mo = combineProps({ get style() {
        const cs = o.colspan ?? 1
        const w = cs > 1
          ? Array.from({ length: cs }, (_, dx) => store.props.columns?.[o.x + dx]?.width ?? 80).reduce((a, b) => a + b, 0)
          : (o.col.width || 80)
        return `width: ${w}px; margin-left: ${o.col.fixed ? 0 : ml()?.offset ?? 0}px`
      } }, o)
      return <Th {...mo} />
    },
    
    EachRows: ({ EachRows }, { store }) => (o) => {
      // use recycle-list
      EachRows = RecycleList
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
      // use recycle-list
      EachCells = RecycleList
      // Skip X virtualization when the array doesn't match the column virtualizer count
      // (e.g. header group rows have fewer entries than leaf columns)
      if (o.each?.length !== store.virtualizerX?.options?.count) {
        return <EachCells {...o} />
      }
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
