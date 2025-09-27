import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, $PROXY } from 'solid-js'
import { createMutable, createStore, unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { clamp, difference, identity, isEqual, mapValues, sumBy } from 'es-toolkit'
import { toReactive, useMemo, usePointerDrag } from '@/hooks'
import { useSplit } from '@/components/Split'

import './styles/index.scss'
import { log, unFn } from '@/utils'
import { createElementSize } from '@solid-primitives/resize-observer'
import { CellSelectionPlugin } from './plugins/CellSelectionPlugin'
import { CopyPlugin, PastePlugin } from './plugins/CopyPastePlugin'
import { VirtualScrollPlugin } from './plugins/VirtualScrollPlugin'
import { ExpandPlugin } from './plugins/ExpandPlugin'
import { RowGroupPlugin } from './plugins/RowGroupPlugin'
import { EditablePlugin } from './plugins/EditablePlugin'
import { RenderPlugin } from './plugins/RenderPlugin'
import { HistoryPlugin } from './plugins/HistoryPlugin'
import { captureStoreUpdates } from '@solid-primitives/deep'

export const Ctx = createContext({
  props: {} as TableProps2
})

type Requireds<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
type TableProps2 = Requireds<TableProps, 'Table' | 'Thead' | 'Tbody' | 'Tr' | 'Th' | 'Td' | 'EachRows' | 'EachCells'>

type ProcessProps = {
  [K in keyof TableProps]?: (props: TableProps2, ctx: { store: TableStore }) => TableProps[K]
}

export type Plugin = {
  priority?: number
  store?: (store: TableStore) => Partial<TableStore>
  processProps?: ProcessProps
}

export interface TableProps {
  columns?: TableColumn[]
  data?: any[]
  index?: boolean
  border?: boolean
  stickyHeader?: boolean
  class: any
  style: any
  // Component
  Table?: Component<any>
  Thead?: Component<any>
  Tbody?: Component<any>
  Td?: TD
  Th?: Component<{ x: number; col: TableColumn; children: JSX.Element }>
  Tr?: Component<{ y?: number; data?: any; children: JSX.Element }>
  EachRows?: typeof For
  EachCells?: typeof For<TableColumn[], JSX.Element>
  // 
  thProps?: (props) => JSX.HTMLAttributes<any> | void
  tdProps?: (props: Parameters<TD>[0]) => JSX.HTMLAttributes<any> | void
  cellProps?: (props) => JSX.HTMLAttributes<any> | void
  // Plugin
  plugins?: Plugin[]

  onDataChange?: (data: any[]) => void
}

export type TD = Component<{ x: number; y: number; data: any; col: TableColumn; children: JSX.Element }>

type Obj = Record<string | symbol, any>

export interface TableColumn extends Obj {
  id?: any
  name?: string
  width?: number
  fixed?: 'left' | 'right'
  // render?: (data: any, index: number) => JSXElement
  class?: any
  style?: any
  props?: (props) => JSX.HTMLAttributes<any>
  onWidthChange?: (width: number) => void
}

type Nullable<T> = T | undefined

export interface TableStore extends Obj {
  ths: Nullable<Element>[]
  thSizes: Nullable<{ width: number; height: number }>[]
  trs: Nullable<Element>[]
  trSizes: Nullable<{ width: number; height: number }>[]
  internal: symbol
  props?: TableProps
  rawProps: TableProps
}

export const Table = (props: TableProps) => {
  const plugins = createMemo(() => [...defaultsPlugins, ...props.plugins || []].sort((a, b) => (b.priority || 0) - (a.priority || 0)))

  const pluginsProps = mapArray(plugins, () => createSignal<Partial<TableProps>>({}))

  const store = createMutable({}) as TableStore
  store.rawProps = props

  const owner = getOwner()!
  createComputed((old: Plugin[]) => {
    const added = difference(plugins(), old)
    runWithOwner(owner, () => {
      added.forEach(e => Object.assign(store, e.store?.(store)))
    })
    return plugins()
  }, [])
  // const aaa = mapArray(plugins, (o) => {
  //   Object.assign(store, o.store?.(store))
  // })
  // createEffect(() => [...aaa()])
  
  createComputed(mapArray(plugins, (e, i) => {
    const prev = createMemo(() => pluginsProps()[i() - 1]?.[0]() || props)
    const ret = mergeProps(prev(), toReactive(mapValues(e.processProps || {}, v => useMemo(() => v(prev(), { store })) )))
    pluginsProps()[i()][1](ret)
  }))
  
  const mProps = toReactive(() => pluginsProps()[pluginsProps().length - 1][0]()) as TableProps2
  store.props = mProps

  const ctx = createMutable({ props: mProps })

  window.store = store
  window.ctx = ctx

  return (
    <Ctx.Provider value={ctx}>
      <ctx.props.Table>
        <colgroup>
          <For each={ctx.props.columns}>{e => <col style={`width: ${e.width}px`} />}</For>
        </colgroup>
        <THead />
        <TBody />
      </ctx.props.Table>
    </Ctx.Provider>
  )
}

const THead = () => {
  const { props } = useContext(Ctx)
  return (
    <props.Thead>
      <props.Tr>
        <props.EachCells each={props.columns || []}>
          {(col, colIndex) => <props.Th col={col} x={colIndex()}>{col.name}</props.Th>}
        </props.EachCells>
      </props.Tr>
    </props.Thead>
  )
}

const TBody = () => {
  const { props } = useContext(Ctx)
  return (
    <props.Tbody>
      <props.EachRows each={props.data}>{(row, rowIndex) => (
        <props.Tr y={rowIndex()} data={row}>
          <props.EachCells each={props.columns}>{(col, colIndex) => (
            <props.Td col={col} x={colIndex()} y={rowIndex()} data={row}>
              {row[col.id]}
            </props.Td>
          )}</props.EachCells>
        </props.Tr>
      )}</props.EachRows>
    </props.Tbody>
  )
}

// process ===================================================================================================================================================================================================

function BasePlugin(): Plugin {
  const omits = { col: null, data: null }

  const table = o => <table {...o} /> as any
  const thead = o => <thead {...o} /> as any
  const tbody = o => <tbody {...o} /> as any
  const tr = o => <tr {...o} {...omits} /> as any
  const th = o => <th {...o} {...omits} /> as any
  const td = o => <td {...o} {...omits} /> as any

  return {
    priority: Infinity,
    store: (store) => ({
      ths: [],
      // thSizes: toReactive(mapArray(() => store.ths, el => el && createElementSize(el))),
      thSizes: [],
      trs: [],
      // trSizes: toReactive(mapArray(() => store.trs, el => el && createElementSize(el))),
      trSizes: [],
      internal: Symbol('internal')
    }),
    processProps: {
      data: ({ data }) => data![$PROXY] ?? data,
      Tbody: ({ Tbody = tbody }) => Tbody,
      Thead: ({ Thead = thead }) => Thead,
      Table: ({ Table = table }) => o => {
        const { props } = useContext(Ctx)
        o = combineProps({
          get class() { return `data-table ${props.class} ${props.border && 'data-table--border'}` },
          get style() { return props.style }
        }, o)
        return <Table {...o} />
      },
      Tr: ({ Tr = tr }, { store }) => o => {
        const [el, setEl] = createSignal<HTMLElement>()
        o = combineProps({ ref: setEl }, o)

        createEffect(() => {
          const { y } = o
          store.trs[y] = el()
          store.trSizes[y] = createElementSize(el())
          onCleanup(() => store.trSizes[y] = store.trs[y] = void 0)
        })

        return <Tr {...o} />
      },
      Th: ({ Th = th }, { store }) => o => {
        const [el, setEl] = createSignal<HTMLElement>()
        
        const { props } = useContext(Ctx)
        const mProps = combineProps(
          o,
          () => ({ ref: setEl, class: o.col.class, style: o.col.style }),
          createMemo(() => props.cellProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => props.thProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => o.col.props?.(o) || {}, null, { equals: isEqual }),
        )

        createEffect(() => {
          const { x } = o
          store.ths[x] = el()
          store.thSizes[x] = createElementSize(el())
          onCleanup(() => store.thSizes[x] = store.ths[x] = void 0)
        })
        
        return <Th {...mProps}>{o.children}</Th>
      },
      Td: ({ Td = td }, { store }) => o => {
        const { props } = useContext(Ctx)
        const mProps = combineProps(
          o,
          () => ({ class: o.col.class, style: o.col.style }),
          createMemo(() => props.cellProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => props.tdProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => o.col.props?.(o) || {}, null, { equals: isEqual }),
        )
        return <Td {...mProps}>{o.children}</Td>
      },
      EachRows: ({ EachRows }) => EachRows || For,
      EachCells: ({ EachCells }) => EachCells || For
    }
  }
}

const IndexPlugin: Plugin = {
  store: (store) => ({
    $index: { name: '', id: Symbol('index'), fixed: 'left', [store.internal]: 1, width: 40, style: 'text-align: center', class: 'index', render: (o) => o.y + 1 } as TableColumn
  }),
  processProps: {
    columns: (props, { store }) => props.index ? [store.$index, ...props.columns || []] : props.columns
  }
}

const StickyHeaderPlugin: Plugin = {
  processProps: {
    Thead: ({ Thead }) => o => {
      const { props } = useContext(Ctx)
      o = combineProps(() => props.stickyHeader ? { class: 'sticky-header' } : {}, o)
      return <Thead {...o} />
    },
  }
}

const FixedColumnPlugin: Plugin = {
  processProps: {
    columns: ({ columns }) => [
      ...columns?.filter(e => e.fixed == 'left') || [],
      ...columns?.filter(e => !e.fixed) || [],
      ...columns?.filter(e => e.fixed == 'right') || [],
    ],
    cellProps: ({ cellProps }, { store }) => (o) => {
      const { x, col: { fixed } } = o
      const prev = cellProps?.(o)
      return fixed ? combineProps(prev || {}, {
        class: `fixed-${fixed}`,
        style: `${fixed}: ${sumBy(store.thSizes.slice(fixed == 'left' ? 0 : x + 1, fixed == 'left' ? x : Infinity), size => size?.width || 0)}px`
      }) : prev
    }
  }
}

const ResizePlugin: Plugin = {
  processProps: {
    Thead: ({ Thead }, { store }) => o => {
      let theadEl: HTMLElement
      const { props } = useContext(Ctx)
      onMount(() => {
        useSplit({ container: theadEl, cells: () => store.ths.filter(identity), size: 8, handle: i => <Handle i={i} /> })
      })
      
      const Handle: Component = ({ i }) => {
        let el!: HTMLElement
        usePointerDrag(() => el, {
          start(e, move, end) {
            const col = theadEl.parentElement?.querySelector('colgroup')?.children[i - 1]! as HTMLTableColElement
            const sw = col.offsetWidth
                      move((e, o) => col.style.width = `${clamp(sw + o.ox, 45, 800)}px`)
            // end(() => props.columns[o.i - 1].width = col.offsetWidth) // todo
            end(() => props.columns![i - 1].onWidthChange?.(col.offsetWidth))
          },
        })
        return <div ref={el} class="handle size-full cursor-w-resize hover:bg-gray active:bg-gray" />
      }
      
      o = combineProps({ ref: e => theadEl = e }, o)
      return <Thead {...o} />
    },
  }
}

export const defaultsPlugins = [
  BasePlugin(),
  VirtualScrollPlugin,
  RenderPlugin,
  IndexPlugin,
  StickyHeaderPlugin,
  FixedColumnPlugin,
  ResizePlugin,
  CellSelectionPlugin,
  CopyPlugin,
  PastePlugin,
  // ExpandPlugin,
  // RowGroupPlugin,
  EditablePlugin,
  HistoryPlugin,
]