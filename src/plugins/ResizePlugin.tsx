import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, $PROXY } from 'solid-js'
import { createMutable, createStore, unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { clamp, difference, identity, isEqual, mapValues, sumBy } from 'es-toolkit'
import { defaultsDeep } from 'es-toolkit/compat'
import { toReactive, useMemo, usePointerDrag } from '@/hooks'
import { useSplit } from '@/components/Split'

import { Ctx, type Plugin, type TableColumn } from "@/index"

declare module '../index' {
  interface TableProps {
    resizable?: {
      col: Partial<{ enable: boolean; min: number; max: number }>
      row: Partial<{ enable: boolean; min: number; max: number }>
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

export const ResizePlugin: Plugin = {
  rewriteProps: {
    resizable: ({ resizable }) => defaultsDeep(resizable, {
      col: { enable: true, min: 45, max: 800 },
      row: { enable: false, min: 20, max: 400 }
    }),
    columns: ({ columns }, { store }) => (
      columns.map(e => defaultsDeep(e, { resizable: store.props?.resizable?.col.enable } as TableColumn))
    ),
    Thead: ({ Thead }, { store }) => o => {
      let theadEl: HTMLElement
      const { props } = useContext(Ctx)
      const ths = createMemo(() => store.ths.filter(e => e != null))
      onMount(() => {
        useSplit({ container: theadEl, cells: ths, size: 10, trailing: true, dir: 'x', handle: i => <Handle i={i} /> })
      })
      
      const Handle: Component = ({ i }) => {
        let el!: HTMLDivElement
        usePointerDrag(() => el, {
          start(e, move, end) {
            const { min, max }  = props.resizable.col
            const th = ths()[i] as HTMLTableColElement
            const sw = th.offsetWidth
            move((e, o) => th.style.width = `${clamp(sw + o.ox, min, max)}px`)
            end(() => {
              const col = props.columns[i]
              const cols = [...store.rawProps.columns || []]
              const index = cols?.findIndex(e => e.id == col.id)
              if (index > -1) {
                cols[index] = { ...cols[index], width: th.offsetWidth }
                props.onColumnsChange?.(cols)
              }
              col.onWidthChange?.(th.offsetWidth)
            })
          },
        })
        return <div ref={el} class="in-cell__resize-handle flex justify-center after:w-1 cursor-w-resize" />
      }
      
      o = combineProps({ ref: e => theadEl = e }, o)
      return <Thead {...o} />
    },
    Tbody: ({ Tbody }, { store }) => o => {
      let el!: HTMLElement
      const { props } = useContext(Ctx)
      const tds = createMemo(() => store.trs.filter(e => e != null).map(e => e.firstElementChild!))
      onMount(() => {
        useSplit({ container: el, cells: tds, size: 8, trailing: true, dir: 'y', handle: i => <Handle i={i} /> })
      })

      const Handle: Component = ({ i }) => {
        let el!: HTMLDivElement
        usePointerDrag(() => el, {
          start(e, move, end) {
            const { min, max }  = props.resizable.row
            const tr = tds()[i] as HTMLTableColElement
            const sw = tr.offsetHeight
            move((e, o) => tr.style.height = `${clamp(sw + o.oy, min, max)}px`)
            end(() => {
              // todo
            })
          },
        })
        return <div ref={el} class="in-cell__resize-handle flex flex-row items-center after:h-1 cursor-s-resize" />
      }

      o = combineProps({ ref: e => el = e }, o)
      return <Tbody {...o}/>
    }
  }
}