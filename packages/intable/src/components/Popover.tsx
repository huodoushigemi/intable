import { type Accessor, children, createEffect, createMemo, createSignal, type JSX, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'
import { autoUpdate, createFloating, type createFloatingProps, type ReferenceType } from 'floating-ui-solid'
import type { AutoUpdateOptions } from '@floating-ui/dom'
import { delay, mapValues } from 'es-toolkit'
import { useClicked, useHover, useMemoAsync } from '../hooks'
import { createLazyMemo } from '@solid-primitives/memo'
import { log } from '../utils'

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
  reference: Accessor<ReferenceType | JSX.Element>
  floating?: Accessor<JSX.Element>
  portal?: HTMLElement
  trigger?: 'click' | 'hover'
} & createFloatingProps

export function Floating(props: FloatingProps & { update?: Partial<AutoUpdateOptions> }) {
  const reference = children(() => props.reference)
  const floating = children(() => props.floating)
  
  useFloating(props)

  return (
    <>
      {reference()}
      {props.portal && floating() ? <Portal mount={props.portal}>{floating()}</Portal> : floating()}
    </>
  )
}

export const useFloating = (attrs: FloatingProps & { update?: Partial<AutoUpdateOptions> }) => {
  const [_, props] = splitProps(attrs, ['reference', 'floating'])
  const reference = children(() => attrs.reference)
  const floating = children(() => attrs.floating)

  const style = createLazyMemo(() => floating() && reference() ? createFloating({
    whileElementsMounted(ref, float, update) {
      return autoUpdate(ref, float, update, { ancestorResize: true, elementResize: true, layoutShift: true, ancestorScroll: true, ...attrs.update })
    },
    ...props,
    elements: { reference, floating },
  }).floatingStyles : void 0)

  createEffect(prev => {
    prev = mapValues(prev ?? {}, () => null)
    let sty = style()?.()
    if (!sty) sty = { display: 'none' }
    floating() && Object.assign(floating().style, prev, sty)
    return sty
  })
}