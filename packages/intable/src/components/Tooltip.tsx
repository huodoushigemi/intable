import { type JSX } from 'solid-js'
import { Popover, type FloatingProps } from './Popover'
import { offset } from 'floating-ui-solid'
import type { Placement } from '@floating-ui/dom'

export type TooltipProps = {
  /** Tooltip body — plain text or JSX */
  content: JSX.Element
  placement?: Placement
  children: JSX.Element
} & Partial<FloatingProps>

/**
 * Wraps any element and shows a small floating tooltip on hover.
 *
 * ```jsx
 * <Tooltip content="Save file">
 *   <button>💾</button>
 * </Tooltip>
 * ```
 */
export function Tooltip(props: TooltipProps) {
  const placement = () => props.placement ?? 'top'

  return (
    <Popover
      trigger='hover'
      placement={placement()}
      middleware={[offset({ mainAxis: 8 })]}
      {...props}
      reference={props.children as any}
      floating={
        <div class='in-tooltip' data-placement={placement()}>
          {props.content}
        </div> as any
      }
    />
  )
}
