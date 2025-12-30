import type { JSX } from 'solid-js'

export function solidComponent<T extends (...arg) => JSX.Element>(comp: T) {
  comp.__solid = 1
  return comp
}

export function renderComponent(Comp: any, props: any, renderer: any) {
  if (!Comp.__solid) Comp = renderer(Comp)
  return <Comp {...props} />
}