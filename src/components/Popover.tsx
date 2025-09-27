import { children, createEffect, createMemo, createSignal, type JSX, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'
import { autoUpdate, createFloating, type createFloatingProps, type ReferenceType } from 'floating-ui-solid'
import type { AutoUpdateOptions } from '@floating-ui/dom'
import { delay } from 'es-toolkit'
import { useClicked, useHover, useMemoAsync } from '../hooks'

export function Popover(attrs: FloatingProps) {
  const [_, props] = splitProps(attrs, ['reference', 'floating'])
  
  const show = (attrs.trigger == 'click' ? useClicked : useHover)(() => [reference(), floating()].filter(e => e))
  const show2 = useMemoAsync(() => (
    attrs.trigger == 'click'
      ? show()
      : show() ? delay(100).then(() => true) : delay(200).then(() => false)
  ))

  const reference = children(() => attrs.reference as HTMLElement)
  const floating = children(() => show2() ? attrs.floating as HTMLElement : void 0)

  return <Floating {...props} reference={reference} floating={floating} />
}

type FloatingProps = {
  reference: ReferenceType
  floating?: JSX.Element | (() => JSX.Element)
  portal?: HTMLElement
  trigger?: 'click' | 'hover'
} & createFloatingProps

export function Floating(attrs: FloatingProps & { update?: Partial<AutoUpdateOptions> }) {
  const [_, props] = splitProps(attrs, ['reference', 'floating'])
  const reference = children(() => attrs.reference)
  const floating = children(() => attrs.floating)

  const style = createMemo(() => floating() ? createFloating({
    whileElementsMounted(ref, float, update) {
      return autoUpdate(ref, float, update, { ancestorResize: true, elementResize: true, layoutShift: true, ancestorScroll: true, ...attrs.update })
    },
    ...props,
    elements: { reference, floating },
  }).floatingStyles : void 0)

  createEffect(() => {
    // console.log(props.floating)
    floating() && Object.assign(floating().style, style()?.() ?? {})
  })

  return (
    <>
      {reference()}
      {props.portal && floating() ? <Portal mount={props.portal}>{floating()}</Portal> : floating()}
    </>
  )
}