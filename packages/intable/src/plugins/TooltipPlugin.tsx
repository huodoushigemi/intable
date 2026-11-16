import { createSignal, Show, createEffect } from 'solid-js'
import type { Plugin, TDProps } from '..'
import { renderComponent } from '../components/utils'
import { autoUpdate, createFloating, flip, offset, shift } from 'floating-ui-solid'
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
    Scroll: ({ Scroll }, { store }) => (o) => {
        const [td, setTd] = createSignal<HTMLElement>()
        const [tipel, setTipel] = createSignal<HTMLElement>()

        const hover = useHover(() => [td(), tipel()].filter(e => e))

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

        const content = () => {
          if (!showTd()) return
          const r = showTd()
          if (!r || r.text == null) return
          return renderComponent(r.text, { x: r.x, y: r.y, data: r.row, col: r.col, value: r.val }, store)
        }

        // 使用 floating-ui 计算位置：以单元格为参考元素，tooltip 为浮层。
        const floating = createFloating({
          placement: 'top',
          strategy: 'fixed',
          middleware: [offset(0), flip(), shift({ padding: 4 })],
          elements: {
            reference: () => td() ?? null,
            floating: () => tipel() ?? null,
          },
          whileElementsMounted: (reference, floatingEl, update) => autoUpdate(reference, floatingEl, update),
        })

        createEffect(() => {
          const el = tipel()
          if (!el) return
          Object.assign(el.style, floating.floatingStyles())
        })

        createEventListener(() => store.table, 'pointerover', (e: PointerEvent) => {
          const el = (e.target as HTMLElement).closest('td[x][y]')
          if (!el) return
          setTd(el as any)
          hover(true)
        })

        return (
          <Scroll {...o}>
            {o.children}
            <Show when={content()}>
              <div
                ref={setTipel}
                class='in-tooltip'
                data-placement={floating.placement()}
                style='z-index:9999'
              >
                {content()}
              </div>
            </Show>
          </Scroll>
        )
      },

      cellClass({ cellClass }) {
        return o => unFn(cellClass, o) + (o.col.tooltip == true ? ' truncate' : '')
      },
  },
}
