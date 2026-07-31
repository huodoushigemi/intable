import { createSignal, Show, createEffect } from 'solid-js'
import type { Plugin, TDProps } from '..'
import { renderComponent } from '../components/utils'
import { combineProps } from '@solid-primitives/props'
import { useHover, useMemoAsync } from '../hooks'
import { delay } from 'es-toolkit'
import { createEventListener } from '@solid-primitives/event-listener'

declare module '..' {
  interface TableColumn {
    /**
     * Show a floating tooltip on cell hover.
     * - `boolean`  → display the cell value as-is
     * - `string`   → always show this fixed string
     * - `function` → compute from `(o: TDProps) => string | undefined`
     */
    tooltip?: boolean | string | ((o: TDProps) => any)
  }
}

export const TooltipPlugin: Plugin = {
  name: 'tooltip',
  store: (store) => ({
    // 
  }),
  rewriteProps: {
    Table: ({ Table }, { store }) => (o) => {
        const [td, setTd] = createSignal<HTMLElement>()
        const [tip2, setTip2] = createSignal<HTMLElement>()

        const _show = useHover(() => [td(), tip2()].filter(e => e))
        const show = useMemoAsync(() => {
          const x = +td()?.getAttribute('x')!
          const col = store.props.columns[x]
          return col?.tooltip && _show() ? delay(100).then(() => true) : delay(200).then(() => false)
        })

        const tip = () => {
          if (!td() || !show()) return
          const x = +td()!.getAttribute('x')!
          const y = +td()!.getAttribute('y')!
          const col = store.props.columns[x]
          if (!col?.tooltip) return
          let text: any = col.tooltip
          const row = store.props.data[y]
          const val = row?.[col.id]
          if (typeof text === 'boolean') text = text && val != null ? String(val) : undefined
          if (typeof text === 'function') text = text({ x, y, data: row, col, value: val } as TDProps)
          if (text == null) return
          return renderComponent(text, { x, y, data: row, col, value: val }, store)
        }

        createEffect(() => {
          if (!tip2() || !td()) return
          const r = td()!.getBoundingClientRect()
          tip2()!.style.left = `${r.left + r.width / 2}px`
          tip2()!.style.top = `${r.top - 0}px`
        })

        createEventListener(() => store.table, 'pointerover', (e: PointerEvent) => {
          const el = (e.target as HTMLElement).closest('td[x][y]')
          if (!el) return
          setTd(el as any)
          _show(true)
        })

        return (
          <Table {...o}>
            {o.children}
            <Show when={tip()}>
              <div
                ref={setTip2}
                class='in-tooltip'
                data-placement='top'
                style='position:fixed;z-index:9999;transform:translate(-50%,-100%)'
              >
                {tip()}
              </div>
            </Show>
          </Table>
        )
      }
  },
}
