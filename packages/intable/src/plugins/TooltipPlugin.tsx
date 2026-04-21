import { createSignal, Show } from 'solid-js'
import type { Plugin } from '..'
import { Tooltip } from '../components/Tooltip'
import { combineProps } from '@solid-primitives/props'
import { offset } from 'floating-ui-solid'

declare module '..' {
  interface TableColumn {
    /**
     * Show a floating tooltip on cell hover.
     * - `boolean`    → display the cell value as-is
     * - `string`  → always show this fixed string
     * - `function`→ compute from `(o: TDProps) => string | undefined`
     */
    tooltip?: boolean | string | ((o: TDProps) => any)
  }
}

export const TooltipPlugin: Plugin = {
  name: 'tooltip',
  rewriteProps: {
    Td: ({ Td }) => o => {
      const tip = () => {
        const t = o.col.tooltip
        if (t == null) return
        if (typeof t == 'boolean') return t && o.value != null ? String(o.value) : undefined
        if (typeof t === 'string') return t
        return t(o)
      }
      const [td, setTd] = createSignal()
      o = combineProps({ ref: setTd }, o)
      return (
        <Td {...o}>
          <Show when={tip()} fallback={o.children}>
            {tip => (
              <Tooltip content={tip()} strategy='fixed' target={td()} middleware={[offset({ mainAxis: 4 })]}>
              {/*@once*/ o.children}
            </Tooltip>
            )}
          </Show>
        </Td>
      )
    },
  },
}
