import { unFn } from '@/utils'
import { createElementBounds } from '@solid-primitives/bounds'
import { children, createComputed, createEffect, createMemo, For, Index, mapArray, mergeProps, onMount, splitProps, type JSXElement } from 'solid-js'
import { Portal } from 'solid-js/web'

type SplitProps = {
  container?: Element
  cells: () => Element[]
  handle?: (i: number) => JSXElement
  size?: number
  dir?: 'x' | 'y'
  leading?: boolean
  trailing?: boolean
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
  // const bounds = createMemo(() => props.cells().map()
  const bounds = mapArray(() => props.cells(), el => createElementBounds(el))
  const rect = createElementBounds(() => el)
  createEffect(() => el.style.position = 'absolute')

  const style = (e, bool) => props.dir == 'x'
    ? `transform: translate(${(bool ? e.left + e.width : e.left) - (props.size! / 2)}px, ${e.top}px); width: ${props.size}px; height: ${e.height}px;`
    : `transform: translate(${e.left}px, ${(bool ? e.top + e.height : e.top) - (props.size! / 2)}px); width: ${e.width}px; height: ${props.size}px;`

  const Handle = (e) => (
    <div class='absolute z-1' style={style({ ...e.e, left: e.e.left - rect.left, top: e.e.top - rect.top }, e.bool)}>{props.handle?.(e.i)}</div>
  )

  ; //
  <Portal ref={el} mount={props.container || document.body}>
    <For each={bounds().slice(0, -1)}>
      {(e, i) => <Handle e={unFn(e)} bool={1} i={unFn(i)} />}
    </For>
    {!!bounds().length && props.leading && <Handle e={bounds()[0]} i={-1} />}
    {!!bounds().length && props.trailing && <Handle e={bounds()[bounds().length - 1]} bool={1} i={bounds().length - 1} />}
  </Portal>
}
