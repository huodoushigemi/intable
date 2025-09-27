import { batch, createMemo, useContext } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createEventListener } from '@solid-primitives/event-listener'
import { type MaybeAccessor } from '@solid-primitives/utils'
import { Ctx, type Plugin } from '../xxx'
import { usePointerDrag, useTinykeys } from '@/hooks'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    selected: { start: number[]; end: number[] }
  }
}

const inrange = (v, min, max) => v <= max && v >= min

export const CellSelectionPlugin: Plugin = {
  store: () => ({
    selected: { start: [], end: [] }
  }),
  processProps: {
    thProps: ({ thProps }, { store }) => (o) => {
      const { start, end } = store.selected
      const inx = inrange(o.x, ...[start[0], end[0]].sort((a, b) => a - b))
      return combineProps(thProps?.(o) || {}, { class: inx ? 'col-range-highlight' : '' })
    },
    Td: ({ Td }, { store }) => (o) => {
      const clazz = createMemo(() => {
        const { start, end } = store.selected
        let clazz = ''
        const xs = [start[0], end[0]].sort((a, b) => a - b)
        const ys  = [start[1], end[1]].sort((a, b) => a - b)
        const inx = inrange(o.x, ...xs)
        const iny = inrange(o.y, ...ys)
        if (inx && iny) {
          clazz += 'range-selected '
          if (o.x == xs[0]) clazz += 'range-selected-l '
          if (o.x == xs[1]) clazz += 'range-selected-r '
          if (o.y == ys[0]) clazz += 'range-selected-t '
          if (o.y == ys[1]) clazz += 'range-selected-b '
        }
        if (o.col.id == store.$index?.id && iny) clazz += 'row-range-highlight '
        return clazz
      })
      
      const mergedProps = combineProps(o, { get class() { return clazz() }, tabindex: -1 })
      return <Td {...mergedProps} />
    },
    Table: ({ Table }, { store }) => (o) => {
      let el: HTMLElement
      const { props } = useContext(Ctx)
      
      usePointerDrag(() => el, {
        start(e, move, end) {
          batch(() => {
            const findCell = (e: PointerEvent) => e.composedPath().find((e) => e.tagName == 'TH' || e.tagName == 'TD') as Element
            const getXY = (cell: Element) => [cell.getAttribute('x'), cell.getAttribute('y')]
            const cell = findCell(e)
            if (!cell) return
            if (cell.tagName == 'TH') {
              const [x, y] = getXY(cell)
              if (x == null) return
              store.selected.start = [+x, 0]
              store.selected.end = [+x, Infinity]
              move(e => {
                const cell = findCell(e)
                if (!cell) return
                const [x, y] = getXY(cell)
                if (x == null) return
                store.selected.end = [+x, Infinity]
              })
            }
            if (cell.classList.contains('index')) {
              const [x, y] = getXY(cell)
              if (x == null || y == null) return
              store.selected.start = [0, +y]
              store.selected.end = [Infinity, +y]
              move(e => {
                const cell = findCell(e)
                if (!cell) return
                const [x, y] = getXY(cell)
                if (x == null || y == null) return
                store.selected.end = [Infinity, +y]
              })
            }
            else if (cell.tagName == 'TD') {
              const [x, y] = getXY(cell)
              if (x == null || y == null) return
              store.selected.start = [+x, +y]
              store.selected.end = [...store.selected.start]
              move(e => {
                const cell = findCell(e)
                if (!cell) return
                const [x, y] = getXY(cell)
                if (x == null || y == null) return
                store.selected.end = [+x, +y]
              })
            }
            scrollIntoView()
          })
        },
      })

      useTinykeys(() => el, {
        'ArrowLeft': () => {
          const { start, end } = store.selected
          start[0] = end[0] = Math.max(start[0] - 1, 0)
          end[1] = start[1]
          scrollIntoView()
        },
        'ArrowRight': () => {
          const { start, end } = store.selected
          start[0] = end[0] = Math.min(start[0] + 1, props.columns!.length - 1)
          end[1] = start[1]
          scrollIntoView()
        },
        'ArrowUp': () => {
          const { start, end } = store.selected
          start[1] = end[1] = Math.max(start[1] - 1, 0)
          end[0] = start[0]
          scrollIntoView()
        },
        'ArrowDown': () => {
          const { start, end } = store.selected
          start[1] = end[1] = Math.min(start[1] + 1, props.data!.length - 1)
          end[0] = start[0]
          scrollIntoView()
        }
      })

      const scrollIntoView = () => {
        const cell = el.querySelector(`td[x="${store.selected.start[0]}"][y="${store.selected.start[1]}"]`)
        cell.scrollIntoViewIfNeeded(false)
        cell.focus()
      }

      o = combineProps(o, { ref: e => el = e })
      
      return <Table {...o} />
    }
  }
}
