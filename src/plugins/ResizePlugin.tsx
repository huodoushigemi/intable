import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, $PROXY } from 'solid-js'
import { createMutable, createStore, unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { clamp, difference, identity, isEqual, mapValues, sumBy } from 'es-toolkit'
import { defaultsDeep } from 'es-toolkit/compat'
import { toReactive, useMemo, usePointerDrag } from '@/hooks'
import { useSplit } from '@/components/Split'

import { Ctx, type Plugin, type TableColumn } from "@/xxx"

declare module '../xxx' {
  interface TableProps {
    resizable?: {
      col: Partial<{ enable: boolean; min: number; max: number }>
      row: Partial<{ enable: boolean; min: number; max: number }>
    }
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
  processProps: {
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
        useSplit({ container: theadEl, cells: ths, size: 8, trailing: true, dir: 'x', handle: i => <Handle i={i} /> })
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
              props.columns[i].width = th.offsetWidth
              props.columns[i].onWidthChange?.(th.offsetWidth)
            })
          },
        })
        return <div ref={el} class="handle size-full cursor-w-resize hover:bg-gray active:bg-gray" />
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
        return <div ref={el} class="handle size-full cursor-s-resize hover:bg-gray active:bg-gray" />
      }

      o = combineProps({ ref: e => el = e }, o)
      return <Tbody {...o}/>
    }
  }
}