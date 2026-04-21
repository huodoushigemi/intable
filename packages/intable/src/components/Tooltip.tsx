import { children, type JSX } from 'solid-js'
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
  return (
    <Popover
      trigger='hover'
      placement={props.placement ?? 'top'}
      middleware={[offset({ mainAxis: 6 })]}
      {...props}
      reference={props.children as any}
      floating={<div class='tt-tooltip'>{props.content}</div> as any}
    />
  )
}
