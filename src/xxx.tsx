import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, $PROXY, splitProps } from 'solid-js'
import { createMutable, createStore, unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { clamp, difference, identity, isEqual, mapValues, sumBy } from 'es-toolkit'
import { defaultsDeep } from 'es-toolkit/compat'
import { toReactive, useMemo, usePointerDrag } from '@/hooks'
import { useSplit } from '@/components/Split'

import './styles/index.scss'
import { log, unFn } from '@/utils'
import { createElementSize } from '@solid-primitives/resize-observer'
import { CellSelectionPlugin } from './plugins/CellSelectionPlugin'
import { ClipboardPlugin } from './plugins/CopyPastePlugin'
import { EditablePlugin } from './plugins/EditablePlugin'
import { RenderPlugin } from './plugins/RenderPlugin'
import { MenuPlugin } from './plugins/MenuPlugin'
import { CommandPlugin } from './plugins/CommandPlugin'
import { RowSelectionPlugin } from './plugins/RowSelectionPlugin'
import { ResizePlugin } from './plugins/ResizePlugin'
import { solidComponent } from './components/utils'
import { createScrollPosition } from '@solid-primitives/scroll'

export const Ctx = createContext({
  props: {} as TableProps2
})

type Requireds<T, K extends keyof T> = Pri<Omit<T, K> & Required<Pick<T, K>>>
type Pri<T> = { [K in keyof T]: T[K] }
type TableProps2 = Requireds<TableProps, (
  'Table' | 'Thead' | 'Tbody' | 'Tr' | 'Th' | 'Td' | 'EachRows' | 'EachCells' |
  'rowKey' | 'data' | 'columns' |
  'newRow'
)>

type ProcessProps = {
  [K in keyof TableProps]?: (prev: TableProps2, ctx: { store: TableStore }) => TableProps[K]
}

export interface Plugin {
  priority?: number
  store?: (store: TableStore) => Partial<TableStore> | void
  rewriteProps?: ProcessProps
  layers?: Component<TableStore>[]
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
  Th?: Component<{ x: number; col: TableColumn; children: JSX.Element }>
  Tr?: Component<{ y?: number; data?: any; children: JSX.Element }>
  EachRows?: typeof For
  EachCells?: typeof For<TableColumn[], JSX.Element>
  // 
  thProps?: (props) => JSX.HTMLAttributes<any> | void
  tdProps?: (props: Parameters<TD>[0]) => JSX.HTMLAttributes<any> | void
  cellProps?: (props) => JSX.HTMLAttributes<any> | void
  // 
  renderer?: (comp: (props) => JSX.Element) => ((props) => JSX.Element)
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
  class?: any
  style?: any
  props?: (props) => JSX.HTMLAttributes<any>
}

type Nullable<T> = T | undefined

export interface TableStore extends Obj {
  scroll_el?: HTMLElement
  table: HTMLElement
  ths: Nullable<Element>[]
  thSizes: Nullable<{ width: number; height: number }>[]
  trs: Nullable<Element>[]
  trSizes: Nullable<{ width: number; height: number }>[]
  internal: symbol
  props?: TableProps2
  rawProps: TableProps
  plugins: Plugin[]
}

export const Table = (props: TableProps) => {
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
  const pluginsProps = mapArray(plugins, () => createSignal<Partial<TableProps>>({}))
  createComputed(mapArray(plugins, (e, i) => {
    const prev = () => pluginsProps()[i() - 1]?.[0]() || props
    const ret = mergeProps(prev, toReactive(mapValues(e.rewriteProps || {}, v => useMemo(() => v(prev(), { store })) )))
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
    rewriteProps: {
      data: ({ data = [] }) => data,
      columns: ({ columns = [] }) => columns,
      newRow: ({ newRow = () => ({}) }) => newRow,
      Tbody: ({ Tbody = tbody }) => Tbody,
      Thead: ({ Thead = thead }) => Thead,
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
          { get style() { return o.col.width ? { width: `${o.col.width}px` } : {} } },
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
          { get style() { return o.col.width ? { width: `${o.col.width}px` } : {} } },
          createMemo(() => props.cellProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => props.tdProps?.(o) || {}, null, { equals: isEqual }),
          createMemo(() => o.col.props?.(o) || {}, null, { equals: isEqual }),
        )
        return <Td {...mProps}>{o.children}</Td>
      },
      EachRows: ({ EachRows }) => EachRows || For,
      EachCells: ({ EachCells }) => EachCells || For,
      renderer: ({ renderer = a => a }) => renderer
    }
  }
}

const IndexPlugin: Plugin = {
  store: (store) => ({
    $index: { name: '', id: Symbol('index'), fixed: 'left', [store.internal]: 1, width: 40, style: 'text-align: center', class: 'index', render: solidComponent((o) => o.y + 1) } as TableColumn
  }),
  rewriteProps: {
    columns: (props, { store }) => props.index ? [store.$index, ...props.columns || []] : props.columns
  }
}

const StickyHeaderPlugin: Plugin = {
  rewriteProps: {
    Thead: ({ Thead }) => o => {
      const { props } = useContext(Ctx)
      o = combineProps(() => props.stickyHeader ? { class: 'sticky-header' } : {}, o)
      return <Thead {...o} />
    },
  }
}

const FixedColumnPlugin: Plugin = {
  rewriteProps: {
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
    },
  }
}

export const ScrollPlugin: Plugin = {
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
  RowSelectionPlugin,
  IndexPlugin,
  StickyHeaderPlugin,
  FixedColumnPlugin,
  // ResizePlugin,
  CellSelectionPlugin,
  ClipboardPlugin,
  EditablePlugin,
]