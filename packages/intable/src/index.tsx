import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, on, untrack, batch, Index, $PROXY } from 'solid-js'
import { createMutable, reconcile } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { difference, mapValues, sumBy } from 'es-toolkit'
import { toReactive, useMemo, useMemoState } from './hooks'

import 'virtual:uno.css'
import './style.scss'

import { log, unFn } from './utils'
import { createElementSize, createResizeObserver, getElementSize } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
import { CellSelectionPlugin } from './plugins/CellSelectionPlugin'
import { ClipboardPlugin } from './plugins/CopyPastePlugin'
import { EditablePlugin } from './plugins/EditablePlugin'
import { RenderPlugin } from './plugins/RenderPlugin'
import { MenuPlugin } from './plugins/MenuPlugin'
import { CommandPlugin } from './plugins/CommandPlugin'
import { RowSelectionPlugin } from './plugins/RowSelectionPlugin'
import { ResizePlugin } from './plugins/ResizePlugin'
import { DragPlugin } from './plugins/DragPlugin'
import { solidComponent } from './components/utils'
import { RowGroupPlugin } from './plugins/RowGroupPlugin'
import { ExpandPlugin } from './plugins/ExpandPlugin'

export const Ctx = createContext({
  props: {} as TableProps2,
  store: {} as TableStore,
})

type Requireds<T, K extends keyof T> = Pri<Omit<T, K> & Required<Pick<T, K>>>
type Pri<T> = { [K in keyof T]: T[K] }
type TableProps2 = Requireds<TableProps, (
  'Table' | 'Thead' | 'Tbody' | 'Tr' | 'Th' | 'Td' | 'EachRows' | 'EachCells' |
  'rowKey' | 'data' | 'columns' |
  'newRow'
)>

type Each<T = any> = (props: { each: T[]; children: (e: () => any, i: () => number) => JSX.Element }) => JSX.Element

type ProcessProps = {
  [K in keyof TableProps]?: (prev: TableProps2, ctx: { store: TableStore }) => TableProps[K]
}

export interface Plugin {
  name?: string
  priority?: number
  store?: (store: TableStore) => Partial<TableStore> | void
  rewriteProps?: ProcessProps
  layers?: Component<TableStore>[]
  onMount?: (store: TableStore) => void
}

export interface TableProps {
  columns?: TableColumn[]
  data?: any[]
  index?: boolean
  border?: boolean
  stickyHeader?: boolean
  class?: any
  style?: any
  rowKey?: any
  size?: string
  newRow?: (i: number) => any
  // Component
  Table?: Component<any>
  Thead?: Component<any>
  Tbody?: Component<any>
  Td?: TD
  Th?: Component<THProps>
  Tr?: Component<{ y?: number; data?: any; children: JSX.Element }>
  EachRows?: Each
  EachCells?: Each<TableColumn>
  // 
  cellClass?: ((props: Omit<TDProps, 'y' | 'data'> & { y?:number, data? }) => string) | string
  cellStyle?: ((props: Omit<TDProps, 'y' | 'data'> & { y?:number, data? }) => string) | string
  // 
  renderer?: (comp: (props) => JSX.Element) => ((props) => JSX.Element)
  // Plugin
  plugins?: Plugin[]

  onDataChange?: (data: any[]) => void
}

export type THProps = { x: number; col: TableColumn; children: JSX.Element }
export type TDProps = { x: number; y: number; data: any; col: TableColumn; children: JSX.Element }
export type TD = Component<{ x: number; y: number; data: any; col: TableColumn; children: JSX.Element }>

type Obj = Record<string | symbol, any>

export interface TableColumn extends Obj {
  id?: any
  name?: string
  width?: number
  fixed?: 'left' | 'right'
  class?: any
  style?: any
  props?: (props) => JSX.HTMLAttributes<any>
}

type Nullable<T> = T | undefined

export interface TableStore extends Obj {
  scroll_el?: HTMLElement
  table: HTMLElement
  thead: HTMLElement
  tbody: HTMLElement
  ths: Nullable<Element>[]
  thSizes: Nullable<{ width: number; height: number }>[]
  trs: Nullable<Element>[]
  trSizes: Nullable<{ width: number; height: number }>[]
  internal: symbol
  raw: symbol
  props: TableProps2
  rawProps: TableProps
  plugins: Plugin[]
}

export const Intable = (props: TableProps) => {
  props = mergeProps({ rowKey: 'id' } as Partial<TableProps>, props)
  const plugins = createMemo(() => [
    ...defaultsPlugins,
    ...props.plugins || [],
    RenderPlugin
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0)))
  
  const store = createMutable({
    get rawProps() { return props },
    get plugins() { return plugins() }
  } as TableStore)
  
  // init store
  const owner = getOwner()!
  createComputed((old: Plugin[]) => {
    const added = difference(plugins(), old)
    runWithOwner(owner, () => {
      added.forEach(e => Object.assign(store, e.store?.(store)))
    })
    return plugins()
  }, [])
  
  // init processProps
  const pluginsProps = mapArray(plugins, () => createSignal<Partial<TableProps>>())
  store.props = toReactive(createMemo(() => pluginsProps()[pluginsProps().length - 1][0]() || props)) as TableProps2
  // store.props = useMemoState(createMemo(() => pluginsProps()[pluginsProps().length - 1][0]() || props)) as TableProps2

  createComputed(mapArray(plugins, (e, i) => {
    const prev = createMemo(() => pluginsProps()[i() - 1]?.[0]() || props)
    const ret = mergeProps(prev, toReactive(mapValues(e.rewriteProps || {}, v => useMemo(() => v(prev(), { store })) )))
    pluginsProps()[i()][1](ret)
  }))

  // on mount
  onMount(() => {
    createEffect(mapArray(plugins, e => e.onMount?.(store)))
  })
  
  const ctx = createMutable({ props: store.props, store })

  window.store = store
  window.ctx = ctx

  return (
    <Ctx.Provider value={ctx}>
      <ctx.props.Table>
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
          {(col, colIndex) => <props.Th col={col()} x={colIndex()}>{col().name}</props.Th>}
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
        <props.Tr y={rowIndex()} data={row()}>
          <props.EachCells each={props.columns}>{(col, colIndex) => (
            <props.Td col={col()} x={colIndex()} y={rowIndex()} data={row()}>
              {row()[col().id]}
            </props.Td>
          )}</props.EachCells>
        </props.Tr>
      )}</props.EachRows>
    </props.Tbody>
  )
}

export default Intable

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
    name: 'base',
    priority: Infinity,
    store: (store) => ({
      ths: [],
      // thSizes: toReactive(mapArray(() => store.ths, el => el && createElementSize(el))),
      thSizes: [],
      trs: [],
      // trSizes: toReactive(mapArray(() => store.trs, el => el && createElementSize(el))),
      trSizes: [],
      internal: Symbol('internal'),
      raw: Symbol('raw'),
    }),
    rewriteProps: {
      data: ({ data = [] }) => data,
      columns: ({ columns = [] }) => columns,
      newRow: ({ newRow = () => ({}) }) => newRow,
      Table: ({ Table = table }, { store }) => o => {
        const [el, setEl] = createSignal<HTMLElement>()
        const { props } = useContext(Ctx)
        o = combineProps({
          ref: setEl,
          get class() { return `data-table ${props.class} ${props.border && 'data-table--border'} data-table--${props.size}` },
          get style() { return props.style }
        }, o)
        return <Table {...o} />
      },
      Thead: ({ Thead = thead }, { store }) => o => {
        o = combineProps({ ref: el => store.thead = el }, o)
        return <Thead {...o} />
      },
      Tbody: ({ Tbody = tbody }, { store }) => o => {
        o = combineProps({ ref: el => store.tbody = el }, o)
        return <Tbody {...o} />
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
          { ref: setEl },
          { get class() { return unFn(props.cellClass, o) }, get style() { return unFn(props.cellStyle, o) } },
          { get class() { return o.col.class }, get style() { return o.col.style } },
          { get style() { return o.col.width ? `width: ${o.col.width}px` : '' } },
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
          { get class() { return unFn(props.cellClass, o) }, get style() { return unFn(props.cellStyle, o) } },
          { get class() { return o.col.class }, get style() { return o.col.style } },
          { get style() { return o.col.width ? `width: ${o.col.width}px` : '' } },
        )
        return <Td {...mProps}>{o.children}</Td>
      },
      EachRows: ({ EachRows }) => EachRows || (o => <For each={o.each}>{(e, i) => o.children(() => e, i)}</For>),
      EachCells: ({ EachCells }) => EachCells || (o => <For each={o.each}>{(e, i) => o.children(() => e, i)}</For>),
      // EachRows: ({ EachRows }) => EachRows || (o => <Index each={o.each}>{(e, i) => o.children(e, () => i)}</Index>),
      // EachCells: ({ EachCells }) => EachCells || (o => <Index each={o.each}>{(e, i) => o.children(e, () => i)}</Index>),
      renderer: ({ renderer = a => a }) => renderer
    }
  }
}

const IndexPlugin: Plugin = {
  name: 'index',
  priority: -Infinity,
  store: (store) => ({
    $index: { name: '', id: Symbol('index'), fixed: 'left', [store.internal]: 1, width: 40, style: 'text-align: center', class: 'index', render: solidComponent((o) => <>{o.y + 1}</>) } as TableColumn
  }),
  rewriteProps: {
    columns: ({ columns }, { store }) => store.props?.index ? [store.$index, ...columns || []] : columns
  }
}

const StickyHeaderPlugin: Plugin = {
  name: 'sticky-header',
  rewriteProps: {
    Thead: ({ Thead }) => o => {
      const { props } = useContext(Ctx)
      o = combineProps({ get class() { return props.stickyHeader ? 'sticky-header' : '' } }, o)
      return <Thead {...o} />
    },
  }
}

const FixedColumnPlugin: Plugin = {
  name: 'fixed-column',
  rewriteProps: {
    columns: ({ columns }) => [
      ...columns?.filter(e => e.fixed == 'left') || [],
      ...columns?.filter(e => !e.fixed) || [],
      ...columns?.filter(e => e.fixed == 'right') || [],
    ],
    cellClass: ({ cellClass }) => o => (unFn(cellClass, o) || '') + (o.col.fixed ? ` fixed-${o.col.fixed}` : ''),
    cellStyle: ({ cellStyle }, { store }) => o => (unFn(cellStyle, o) || '') + (o.col.fixed ? `; ${o.col.fixed}: ${sumBy(store.thSizes.slice(o.col.fixed == 'left' ? 0 : o.x + 1, o.col.fixed == 'left' ? o.x : Infinity), size => size?.width || 0)}px` : '')
  }
}

const FitColWidthPlugin: Plugin = {
  name: 'fit-col-width',
  priority: -Infinity,
  rewriteProps: {
    Table: (prev, { store }) => o => {
      const size = createMutable({ width: 0 })
      createResizeObserver(() => store.scroll_el!, (_, el, e) => size.width = e.contentBoxSize[0].inlineSize)

      createEffect(on(() => [size.width, prev.columns.map(e => e.width)], async () => {
        if (!size.width) return
        store.__fit_col_width__cols_temp = null
        await Promise.resolve()
        const gap = (size.width - store.table.getBoundingClientRect().width) / store.props!.columns.filter(e => !e.width).length
        const cols = store.props!.columns.map((e, i) => (e.width ? null : { width: Math.max((store.ths[i]?.getBoundingClientRect().width || 0) + gap, 80) }))
        store.__fit_col_width__cols_temp = cols
      }))

      return <prev.Table {...o} />
    },
    columns: ({ columns }, { store }) => (
      columns = columns.map((e, i) => ({ ...e, ...store.__fit_col_width__cols_temp?.[i], [store.raw]: e[store.raw] ?? e })),
      untrack(() => batch(() => reconcile(columns, { key: store.raw })(store.__fit_col_width__cols ??= [])))
    )
  }
}

export const ScrollPlugin: Plugin = {
  name: 'scroll',
  priority: Infinity,
  rewriteProps: {
    Table: (prev, { store }) => o => {
      const pos = createScrollPosition(() => store.scroll_el)
      const size = createElementSize(() => store.scroll_el)

      const clazz = createMemo(() => {
        const el = store.scroll_el
        if (!el) return
        const isleft = pos.x == 0
        const isright = pos.x >= el.scrollWidth - (size.width || 0)
        return (
          isleft && isright ? '' :
          !isleft && !isright ? 'is-scroll-mid' :
          isleft ? 'is-scroll-left' : 
          isright ? 'is-scroll-right' :
          ''
        )
      })
      
      o = combineProps(o, { ref: el => store.scroll_el = el, class: 'data-table--scroll-view' }, { get class() { return clazz() } })

      const layers = mapArray(() => store.plugins.flatMap(e => e.layers ?? []), Layer => <Layer {...store} />)
      
      return (
        <div {...o}>
          <div class='data-table__layers'>
            {layers()}
          </div>
          <table ref={el => store.table = el} class={`data-table--table`}>{o.children}</table>
        </div>
      )
    }
  }
}

export const defaultsPlugins = [
  ScrollPlugin,
  BasePlugin(),
  CommandPlugin,
  MenuPlugin,
  CellSelectionPlugin,
  StickyHeaderPlugin,
  FixedColumnPlugin,
  ResizePlugin,
  DragPlugin,
  ClipboardPlugin,
  ExpandPlugin,
  RowSelectionPlugin,
  IndexPlugin,
  EditablePlugin,
  FitColWidthPlugin,
  RowGroupPlugin,
]