import { createElementBounds } from '@solid-primitives/bounds'
import { children, createEffect, createMemo, For, Index, mergeProps, onMount, splitProps, type JSXElement } from 'solid-js'
import { Portal } from 'solid-js/web'

type SplitProps = {
  container?: Element
  cells: () => Element[]
  handle?: (i: number) => JSXElement
  size?: number
  dir?: 'x' | 'y'
  both?: boolean
}

export const Split = (props: SplitProps & { children?: JSXElement }) => {
  let el!: Element
  const child = children(() => props.children)

  onMount(() => {
    useSplit({
      ...props,
      container: el,
      cells: () => props.cells ? props.cells() : child()
    })
  })

  return <div ref={el} class='relative' {...props}>{child()}</div>
}

export const useSplit = (props: SplitProps) => {
  props = mergeProps({ dir: 'x', size: 4 }, props) as SplitProps

  let el!: HTMLDivElement
  const bounds = createMemo(() => props.cells().map(el => createElementBounds(el, { trackResize: true })))
  const rect = createElementBounds(() => el)
  createEffect(() => el.style.position = 'absolute')

  const style = (e, bool) => props.dir == 'x'
    ? `transform: translate(${(bool ? e.left : e.left + e.width) - (props.size! / 2)}px, ${e.top}px); width: ${props.size}px; height: ${e.height}px;`
    : `transform: translate(${e.left}px, ${(bool ? e.top : e.top + e.height) - (props.size! / 2)}px); width: ${e.width}px; height: ${props.size}px;`

  const Handle = (e) => (
    <div class='absolute z-1' style={style({ ...e.e, left: e.e.left - rect.left, top: e.e.top - rect.top }, e.bool)}>{props.handle?.(e.i)}</div>
  )

  ; //
  <Portal ref={el} mount={props.container || document.body}>
    <Index each={bounds().slice(1)}>
      {(e, i) => <Handle e={e()} bool={1} i={i + 1} />}
    </Index>
    {!!bounds().length && props.both && <Handle e={bounds()[0]} bool={1} i={0} />}
    {!!bounds().length && props.both && <Handle e={bounds()[bounds().length - 1]} bool={0} i={bounds().length} />}
  </Portal>
}