import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, on, untrack, batch, Index, $PROXY, type Owner } from 'solid-js'
import { createMutable, reconcile } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createLazyMemo } from '@solid-primitives/memo'
import { createElementSize, createResizeObserver, makeResizeObserver } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
import { difference, isEqual, memoize, sumBy, uniq } from 'es-toolkit'
import { renderComponent, solidComponent } from './components/utils'
import { log, unFn } from './utils'

import 'virtual:uno.css'
import './style.scss'

import { CellSelectionPlugin } from './plugins/CellSelectionPlugin'
import { ClipboardPlugin } from './plugins/CopyPastePlugin'
import { EditablePlugin } from './plugins/EditablePlugin'
import { RenderPlugin } from './plugins/RenderPlugin'
import { MenuPlugin } from './plugins/MenuPlugin'
import { CommandPlugin } from './plugins/CommandPlugin'
import { RowSelectionPlugin } from './plugins/RowSelectionPlugin'
import { ResizePlugin } from './plugins/ResizePlugin'
import { DragPlugin } from './plugins/DragPlugin'
import { RowGroupPlugin } from './plugins/RowGroupPlugin'
import { ExpandPlugin } from './plugins/ExpandPlugin'
import { SortPlugin } from './plugins/SortPlugin'
import { CellMergePlugin } from './plugins/CellMergePlugin'
import { TreePlugin } from './plugins/TreePlugin'
import { HeaderGroupPlugin } from './plugins/HeaderGroup'
import { ValidatorPlugin } from './plugins/ValidatorPlugin'
import { AggregatePlugin } from './plugins/AggregatePlugin'
import { AutoFillPlugin } from './plugins/AutoFillPlugin'
import { FilterPlugin } from './plugins/FilterPlugin'
import { ImportExportPlugin } from './plugins/ImportExportPlugin'
import { TooltipPlugin } from './plugins/TooltipPlugin'

export const Ctx = createContext({
  props: {} as TableProps2,
  store: {} as TableStore,
})

type Requireds<T, K extends keyof T> = Pri<Omit<T, K> & Required<Pick<T, K>>>
type Pri<T> = { [K in keyof T]: T[K] }
type TableProps2 = Requireds<TableProps, (
  'Scroll' | 'Table' | 'Thead' | 'Tbody' | 'Tr' | 'Th' | 'Td' | 'EachRows' | 'EachCells' |
  'rowKey' | 'data' | 'columns' |
  'newRow'
)>

type Each<T = any> = (props: { each: T[]; children: (e: () => T, i: () => number) => JSX.Element }) => JSX.Element

type ProcessProps = {
  [K in keyof TableProps]?: (prev: TableProps2, ctx: { store: TableStore }) => TableProps[K]
}

export interface Plugin {
  name: string
  priority?: number
  store?: (store: TableStore) => Partial<TableStore> | void
  rewriteProps?: ProcessProps
  layers?: Component<TableStore>[]
  onInit?: (store: TableStore) => void
  onMount?: (store: TableStore) => void
  /**
   * Declare keyboard shortcuts for this plugin.
   * Collected and registered as a **single** keydown listener by CommandPlugin.
   * Keys use tinykeys syntax, e.g. `'$mod+Z'`, `'$mod+Shift+K'`.
   */
  keybindings?: (store: TableStore) => Record<string, (e?: KeyboardEvent) => void>
}

export type Plugin$0 = Plugin | ((store: TableStore) => Plugin)

export interface TableProps {
  store?: { value: TableStore } | { current: TableStore } | ((store: TableStore) => void)
  columns?: TableColumn[]
  data?: any[]
  index?: boolean
  border?: boolean
  stickyHeader?: boolean
  class?: any
  style?: any
  rowKey?: any
  size?: string
  loading?: boolean
  newRow?: (i: number) => any
  // Component
  Scroll?: Component<any>
  Table?: Component<any>
  Thead?: Component<any>
  Tbody?: Component<any>
  Td?: Component<TDProps>
  Th?: Component<THProps>
  Tr?: Component<{ y?: number; data?: any; style?: any; children: JSX.Element }>
  EachRows?: Each
  EachCells?: Each<TableColumn>
  Footer?: Component<any>
  // 
  cellClass?: ((props: Omit<TDProps, 'y' | 'data'> & { y?:number, data? }) => string) | string
  cellStyle?: ((props: Omit<TDProps, 'y' | 'data'> & { y?:number, data? }) => string) | string
  // 
  renderer?: (comp: (props) => JSX.Element) => ((props) => JSX.Element)
  // Plugin
  plugins?: Plugin$0[]
  /**
   * Override or disable individual plugin keybindings.
   * - Override: `{ '$mod+Z': (e) => myUndo() }`
   * - Disable:  `{ '$mod+Z': false }`
   */
  keybindings?: Record<string, ((e?: KeyboardEvent) => void) | false>

  onDataChange?: (data: any[]) => void
}

export type THProps = { x: number; col: TableColumn; children?: JSX.Element; rowspan?: number; colspan?: number; style?: any }
export type TDProps = { x: number; y: number; data: any; col: TableColumn; value?: any; children?: JSX.Element; rowspan?: number; colspan?: number }

type Obj = Record<string | symbol, any>

export interface TableColumn extends Obj {
  id: any
  name?: string
  width?: number
  fixed?: 'left' | 'right'
  class?: any
  style?: any
  // props?: (props) => JSX.HTMLAttributes<any>
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
  raw: any
  props: TableProps2
  rawProps: TableProps
  ID: string
  plugins: Plugin[]
  owner: Owner
}

export const Intable = (props: TableProps) => {
  props = mergeProps({ rowKey: 'id' } as Partial<TableProps>, props)
  const owner = getOwner()!

  const store = createMutable({
    get rawProps() { return (props[$PROXY] ||= props) },
    get plugins() { return plugins() },
    owner: getOwner(),
  } as TableStore)

  const unplugin = memoize((e: Plugin$0) => runWithOwner(owner, () => unFn(e, store)) as Plugin)

  const plugins = createMemo(prev => {
    const ret = uniq([
      ...defaultsPlugins,
      ...props.plugins || [],
      RenderPlugin
    ].map(unplugin).sort((a, b) => (b.priority || 0) - (a.priority || 0)))

    // init store
    const added = difference(ret, prev)
    runWithOwner(owner, () => {
      added.forEach(e => Object.assign(store, e.store?.(store)))
    })

    return ret
  }, [])
  
  // init rewriteProps
  store.props = (() => {
    const owner = getOwner()
    const map = {}
    const get = (k) => (map[k] ??= runWithOwner(owner, () => createMemo(() => fn(k))))
    function fn(k) {
      const arr = createMemo(() => plugins().map(e => e.rewriteProps?.[k]).filter(e => e), undefined, { equals: isEqual })
      return arr().reduce((o, e) => e({ [k]: o }, { store }), props[k])
    }
    return new Proxy({}, {
      get(o, k, r) { return k == $PROXY ? r : get(k)() }
    }) as TableProps2
  })()

  createComputed(mapArray(plugins, e => e.onInit?.(store)))

  // on mount
  onMount(() => {
    createEffect(mapArray(plugins, e => e.onMount?.(store)))
  })
  
  const ctx = createMutable({ props: store.props, store })

  window.store = store
  window.ctx = ctx

  // ref
  createEffect(async () => {
    const ref = store.props.store
    await Promise.resolve()
    if (ref) {
      if (typeof ref === 'function') ref(store)
      else if ('value' in ref) ref.value = store
      else if ('current' in ref) ref.current = store
    }
  })

  return (
    <Ctx.Provider value={ctx}>
      <ctx.props.Scroll>
        <ctx.props.Table>
          <THead />
          <TBody />
        </ctx.props.Table>
      </ctx.props.Scroll>
    </Ctx.Provider>
  )
}

const THead = () => {
  const { props, store } = useContext(Ctx)
  return (
    <props.Thead>
      <props.Tr>
        <props.EachCells each={props.columns || []}>
          {(col, colIndex) => <props.Th col={col()} x={colIndex()}>{renderComponent(col().name, undefined, store)}</props.Th>}
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
            <props.Td col={col()} x={colIndex()} y={rowIndex()} data={row()} value={row()[col().id]} />
          )}</props.EachCells>
        </props.Tr>
      )}</props.EachRows>
    </props.Tbody>
  )
}

export default Intable

// process ===================================================================================================================================================================================================

function BasePlugin(): Plugin$0 {
  const omits = { col: null, data: null }

  const scroll = o => <div {...o} />
  const table = o => <table {...o} /> as any
  const thead = o => <thead {...o} /> as any
  const tbody = o => <tbody {...o} /> as any
  const tr = o => <tr {...o} {...omits} /> as any
  const th = o => <th {...o} {...omits} /> as any
  const td = o => <td {...o} {...omits} /> as any

  return {
    name: 'base',
    priority: Infinity,
    store: (store) => {
      // 共享一个 ResizeObserver 观察所有 th，回调按 index 分发，替代每列独立 createElementSize
      const thObs = makeResizeObserver((es) => {
        batch(() => {
          for (const e of es) {
            const el = e.target
            const { inlineSize: width, blockSize: height } = e.borderBoxSize[0]
            const x = el.getAttribute('x')
            if (x >= 0 && el.parentElement) store.thSizes[x] = { width, height }
          }
        })
      })
      // 共享一个 ResizeObserver 观察所有 tr，回调按 index 分发，替代每行独立 createElementSize
      const trObs = makeResizeObserver((es) => {
        batch(() => {
          for (const e of es) {
            const el = e.target
            const { inlineSize: width, blockSize: height } = e.borderBoxSize[0]
            const y = el.getAttribute('y')
            if (y >= 0 && el.parentElement) store.trSizes[y] = { width, height }
          }
        })
      })
      return {
        thObs,
        trObs,
        ths: [],
        thSizes: [],
        trs: [],
        trSizes: [],
        internal: Symbol('internal'),
        // raw: Symbol('raw'),
        raw: '__raw',
        ID: '__ID',
      }
    },
    rewriteProps: {
      data: ({ data = [] }) => data,
      columns: ({ columns = [] }) => columns,
      newRow: ({ newRow }, { store }) => function () {
        const ret = newRow?.(...arguments) || {}
        ret[store.props.rowKey] ??= Symbol()
        return ret
      },
      Scroll: ({ Scroll = scroll }, { store }) => o => {
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
        
        o = combineProps(o,
          // { ref: el => store.scroll_el = el, class: '' },
          { get class() { return `data-table ${store.props.border && 'data-table--border'} data-table--${store.props.size}` } },
          { get class() { return store.props.class }, get style() { return store.props.style } },
          { get class() { return clazz() } }
        )

        const layers = mapArray(() => store.plugins.flatMap(e => e.layers ?? []), Layer => <Layer {...store} />)
        
        return (
          <Scroll tabindex={-1} {...o}>
            <div class='data-table__layers'>
              {layers()}
            </div>
            <div class='data-table--scroll-view h-full max-h-inherit' ref={el => store.scroll_el = el}>
              {o.children}
              <store.props.Footer />
              {!store.props.data.length && <div class='data-table__empty'>No data</div>}
            </div>
          </Scroll>
        )
      },
      Footer: ({ Footer }) => (
        Footer ??= o => <div {...combineProps({ class: 'data-table__footer' }, o)} />,
        o => <Footer {...o} />
      ),
      Table: ({ Table = table }, { store }) => o => {
        o = combineProps({ ref: el => store.table = el, class: `data-table--table` }, o)
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
          if (y == null) return
          store.trs[y] = el()
          store.trObs.observe(el())
          onCleanup(() => {
            store.trObs.unobserve(el())
            store.trs[y] = void 0
            if (store.props.data.length > y) return // 处理虚拟滚动
            store.trSizes[y] = void 0
          })
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
          { get style() { return o.col.width ? `width: ${o.col.width}px; max-width: ${o.col.width}px` : '' } },
        )

        createEffect(() => {
          if (o.covered) return
          if ((o.colspan ?? 1) != 1) return
          const { x } = o
          store.ths[x] = el()
          store.thObs.observe(el())
          onCleanup(() => {
            store.thObs.unobserve(el())
            store.ths[x] = void 0
            if (store.props.columns.length > x) return // 处理虚拟滚动
            store.thSizes[x] = void 0
          })
        })
        
        return <Th {...mProps}>{o.children}</Th>
      },
      Td: ({ Td = td }, { store }) => o => {
        const { props } = useContext(Ctx)
        const mProps = combineProps(
          o,
          { get class() { return unFn(props.cellClass, o) }, get style() { return unFn(props.cellStyle, o) } },
          { get class() { return o.col.class }, get style() { return o.col.style } },
          { get style() { return o.col.width ? `width: ${o.col.width}px; max-width: ${o.col.width}px` : '' } },
          // () => o.col.props?.(o) ?? {}
        )
        return <Td {...mProps}>{o.children}</Td>
      },
      EachRows: ({ EachRows }) => EachRows || (o => <For each={o.each}>{(e, i) => o.children(() => e, i)}</For>),
      EachCells: ({ EachCells }) => EachCells || (o => <For each={o.each}>{(e, i) => o.children(() => e, i)}</For>),
      // todo
      // EachCells: ({ EachCells }, { store }) => EachCells || (o => {
      //   const raws = createMemo(() => ({ list: o.each.map(e => e[store.raw]), map: new Map(o.each.map(e => [e[store.raw], e])) }))
      //   return <For each={raws().list}>{(e, i) => o.children(() => raws().map.get(e), i)}</For>
      // }),
      // EachRows: ({ EachRows }) => EachRows || (o => <Index each={o.each}>{(e, i) => o.children(e, () => i)}</Index>),
      // EachCells: ({ EachCells }) => EachCells || (o => <Index each={o.each}>{(e, i) => o.children(e, () => i)}</Index>),
      renderer: ({ renderer = a => a }) => renderer
    },
    layers: [
      function Loading(store) {
        return <>{
          store.props.loading ? <div class='data-table__loading'><IStreamlineUltimateLoadingBold class='text-2xl animate-spin' /></div> : null
        }</>
      }
    ]
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

const FixedColumnPlugin: Plugin$0 = store => {
  const fixedOffsets = createLazyMemo(() => {
    const offsets = {}
    for (const [i, col] of store.props.columns.entries()) {
      if (col.fixed === 'left') offsets[i] = sumBy(store.thSizes.slice(0, i), s => s?.width || 0)
      if (col.fixed === 'right') offsets[i] = sumBy(store.thSizes.slice(i + 1), s => s?.width || 0)
    }
    return offsets
  })
  const last = createLazyMemo(() => store.props.columns.filter(e => e.fixed == 'left').length - 1)
  const first = createLazyMemo(() => store.props.columns.length - store.props.columns.filter(e => e.fixed == 'right').length)
  return {
    name: 'fixed-column',
    rewriteProps: {
      columns: ({ columns }) => [
        ...columns?.filter(e => e.fixed == 'left') || [],
        ...columns?.filter(e => !e.fixed) || [],
        ...columns?.filter(e => e.fixed == 'right') || [],
      ],
      cellClass: ({ cellClass }) => o => (unFn(cellClass, o) || '') + (o.col.fixed ? ` fixed-${o.col.fixed} ${o.x == last() ? 'is-last' : ''} ${o.x == first() ? 'is-first' : ''}` : ''),
      cellStyle: ({ cellStyle }) => o => (unFn(cellStyle, o) || '') + (o.col.fixed ? `; ${o.col.fixed}: ${fixedOffsets()[o.x]}px` : '')
    }
  }
}

const FitColWidthPlugin: Plugin$0 = store => {
  const size = createMutable({ width: 0 })
  createResizeObserver(() => store.scroll_el!, (_, el, e) => size.width = e.contentBoxSize[0].inlineSize)
  const __fit_col_width__cols_temp = createMutable([] as any[])

  let lock = false
  createEffect(on(() => [size.width, store.props.columns.map(e => e.width)], async () => {
    if (!size.width) return
    if (lock) return
    __fit_col_width__cols_temp.length = 0
    lock = true
    await Promise.resolve()
    const gap = (size.width - store.table.getBoundingClientRect().width) / store.props!.columns.filter(e => !e.width).length
    const cols = store.props!.columns.map((e, i) => (e.width ? null : { width: Math.max((store.ths[i]?.getBoundingClientRect().width || 0) + gap, 80) }))
    __fit_col_width__cols_temp.push(...cols)
    lock = false
  }))
  return {
    name: 'fit-col-width',
    priority: -Infinity,
    rewriteProps: {
      columns: ({ columns }, { store }) => (
        columns = columns.map((e, i) => ({ ...e, ...__fit_col_width__cols_temp?.[i], [store.ID]: e[store.ID] ??= Symbol() })),
        untrack(() => batch(() => reconcile(columns, { key: store.ID })(store.__fit_col_width__cols ??= [])))
      )
    }
  }
}

export const defaultsPlugins = [
  BasePlugin,
  CommandPlugin,
  MenuPlugin,
  CellSelectionPlugin,
  StickyHeaderPlugin,
  HeaderGroupPlugin,
  FixedColumnPlugin,
  DragPlugin,
  ClipboardPlugin,
  ExpandPlugin,
  RowSelectionPlugin,
  IndexPlugin,
  SortPlugin,
  ValidatorPlugin,
  EditablePlugin,
  CellMergePlugin,
  TreePlugin,
  FitColWidthPlugin,
  RowGroupPlugin,
  ResizePlugin,
  AggregatePlugin,
  AutoFillPlugin,
  FilterPlugin,
  ImportExportPlugin,
  TooltipPlugin,
]