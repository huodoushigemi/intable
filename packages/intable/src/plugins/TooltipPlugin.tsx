import { createSignal, Show, createEffect } from 'solid-js'
import type { Plugin, TDProps } from '..'
import { renderComponent } from '../components/utils'
import { combineProps } from '@solid-primitives/props'
import { useHover, useMemoAsync } from '../hooks'
import { delay } from 'es-toolkit'
import { createEventListener } from '@solid-primitives/event-listener'
import { unFn } from '../utils'

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

// 判断单元格内容是否超出（溢出）单元格；tooltip 列会设置 truncate（overflow: hidden），scrollWidth 可反映被裁剪的完整内容宽度
function isOverflow(el: HTMLElement) {
  return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
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

        const hover = useHover(() => [td(), tip2()].filter(e => e))

        // 解析 tooltip 配置，得到最终要显示的文本
        const resolve = () => {
          const el = td()
          if (!el) return
          const x = +el.getAttribute('x')!
          const y = +el.getAttribute('y')!
          const col = store.props.columns[x]
          if (!col?.tooltip) return
          const row = store.props.data[y]
          const val = row?.[col.id]
          let text: any = col.tooltip
          if (typeof text === 'boolean') text = text && val != null ? String(val) : undefined
          if (typeof text === 'function') text = text({ x, y, data: row, col, value: val } as TDProps)
          return { el, x, y, col, row, val, text }
        }

        const showable = () => {
          if (!hover()) return false
          const r = resolve()
          if (!r || r.text == null) return false
          const isValue = r.col.tooltip === true || (typeof r.col.tooltip === 'function' && String(r.text) === String(r.val))
          if (isValue && !isOverflow(r.el)) return false
          return true
        }

        const showTd = useMemoAsync(() => {
          return showable() ? resolve() : delay(200).then(() => undefined)
        })

        const tip = () => {
          if (!showTd()) return
          const r = showTd()
          if (!r || r.text == null) return
          return renderComponent(r.text, { x: r.x, y: r.y, data: r.row, col: r.col, value: r.val }, store)
        }

        createEffect(() => {
          if (!tip2() || !showTd()) return
          const r = showTd()!.el.getBoundingClientRect()
          tip2()!.style.left = `${r.left + r.width / 2}px`
          tip2()!.style.top = `${r.top - 0}px`
        })

        createEventListener(() => store.table, 'pointerover', (e: PointerEvent) => {
          const el = (e.target as HTMLElement).closest('td[x][y]')
          if (!el) return
          setTd(el as any)
          hover(true)
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
      },

      cellClass({ cellClass }) {
        return o => unFn(cellClass, o) + (o.col.tooltip == true ? ' truncate' : '')
      },
  },
}
