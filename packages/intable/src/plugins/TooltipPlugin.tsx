import { createSignal, mergeProps, Show } from 'solid-js'
import type { Plugin } from '..'
import { Tooltip } from '../components/Tooltip'
import { offset } from 'floating-ui-solid'
import { renderComponent } from '../components/utils'
import { createLazyMemo } from '@solid-primitives/memo'

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
  store: (store) => ({
    hasTooltip: createLazyMemo(() => store.props.columns.some(c => c.tooltip))
  }),
  rewriteProps: {
    Td: ({ Td }, { store }) => !store.hasTooltip() ? Td : o => {
      const tip = () => {
        let t = o.col.tooltip
        if (t == null) return
        if (typeof t == 'boolean') t = t && o.value != null ? String(o.value) : undefined
        if (typeof t === 'function') t = t(o)
        return renderComponent(t, o, store)
      }
      const [td, setTd] = createSignal()
      const mo = mergeProps(o, { ref: e => (setTd(e), o.ref?.(e)) })
      return (
        <Td {...mo}>
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
