import { batch, untrack, useContext } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { clamp } from 'es-toolkit'
import { defaultsDeep } from 'es-toolkit/compat'
import { usePointerDrag } from '../hooks'

import { Ctx, type Plugin, type TableColumn, type TDProps, type THProps } from "../index"
import { log, unFn } from '../utils'
import { createEventListener } from '@solid-primitives/event-listener'
import { reconcile } from 'solid-js/store'

declare module '../index' {
  interface TableProps {
    resizable?: {
      col?: Partial<{ enable: boolean; min: number; max: number }>
      row?: Partial<{ enable: boolean; min: number; max: number }>
    }
    onColumnsChange?: (columns: TableColumn[]) => void
  }
  interface TableColumn {
    resizable?: boolean
    onWidthChange?: (width: number) => void
  }
  interface TableStore {

  }
  interface Commands {
    
  }
}

const COL = Symbol('col_size')
const ROW = Symbol('row_size')

const findParentEl = (el: HTMLElement, cb) => {
  while (el = el.parentElement!) if (cb(el)) return el
}

const ColHandle = (o: THProps) => {
  const { props, store } = useContext(Ctx)
  let el!: HTMLDivElement
  usePointerDrag(() => el, {
    start(e, move, end) {
      e.stopPropagation()
      const i = o.x
      const { min, max }  = props.resizable!.col
      const th = findParentEl(el, (el) => el.tagName === 'TH')
      const sw = th.offsetWidth
      move((e, { ox }) => store[COL][o.x] = clamp(sw + ox, min, max))
      end(() => {
        const col = props.columns[i]
        const cols = [...store.rawProps.columns || []]
        const index = cols.findIndex(e =>  e[store.ID] === col[store.ID])
        if (index > -1) {
          cols[index] = { ...cols[index], width: th.offsetWidth }
          props.onColumnsChange?.(cols)
        }
        col.onWidthChange?.(th.offsetWidth)
      })
    },
  })
  return <div ref={el} class={`in-cell__resize-handle absolute top-0 right-0 flex justify-center w-10px! ${o.x == props.columns.length - 1 ? 'justify-end!' : 'w-10px! translate-x-1/2'} after:w-1 cursor-w-resize z-1`} onClick={e => e.stopPropagation()} />
}

const RowHandle = (o: TDProps) => {
  const { props, store } = useContext(Ctx)
  let el!: HTMLDivElement
  usePointerDrag(() => el, {
    start(e, move, end) {
      e.stopPropagation()
      const i = o.y
      const { min, max }  = props.resizable!.row
      const th = findParentEl(el, (el) => el.tagName === 'TD')
      const sh = th.offsetHeight
      move((e, { oy }) => store[ROW][o.y] = clamp(sh + oy, min, max))
      end(() => {
        const row = props.data[i]
        const data = [...store.rawProps.data || []]
        const index = data.findIndex(e => e[store.ID] === row[store.ID])
        if (index > -1) {
          // todo
        }
      })
    },
  })
  createEventListener(() => el, 'dblclick', () => o.data[COL]= void 0)
  return <div ref={el} class={`in-cell__resize-handle absolute bottom-0 left-0 flex flex-col justify-center h-1! ${o.y == props.data.length - 1 ? 'justify-end!' : ''} after:h-1 cursor-s-resize z-2`} />
}
export const ResizePlugin: Plugin = {
  name: 'resize',
  priority: -Infinity,
  store: () => ({
    [COL]: [],
    [ROW]: [],
  }),
  rewriteProps: {
    resizable: ({ resizable }) => defaultsDeep(resizable, {
      col: { enable: true, min: 45, max: 800 },
      row: { enable: false, min: 20, max: 400 }
    }),
    columns: ({ columns }, { store }) => (
      columns = columns.map((e, i) => ({ ...e, [store.ID]: e[store.ID] ??= Symbol() })),
      columns = columns.map(e => e.resizable === void 0 ? { ...e, resizable: store.props?.resizable?.col.enable } : e),
      columns = columns.map((e, i) => store[COL][i] ? { ...e, width: store[COL][i] } : e),
      untrack(() => batch(() => reconcile(columns, { key: store.ID })(store.__resize__cols ??= [])))
    ),
    Th: ({ Th }, { store }) => o => {
      return <Th {...o} class={`relative ${o.class}`}>
        {/*@once*/ o.children}
        {o.col.resizable && <ColHandle {...o} />}
      </Th>
    },
    Td: ({ Td }, { store }) => !store.props?.resizable?.row.enable ? Td : o => {
      return <Td {...o} class={`relative ${o.class}`}>
        {/*@once*/ o.children}
        {o.x == 0 && store.props?.resizable?.row.enable && <RowHandle {...o} />}
      </Td>
    },
    cellStyle: ({ cellStyle }, { store }) => o => {
      return `${unFn(cellStyle, o)};` + (store[ROW][o.y] ? `height: ${store[ROW][o.y]}px` : '')
    }
  }
}