import type { JSX } from 'solid-js'
import type { TableStore } from '..'

export function solidComponent<T extends (...arg) => JSX.Element>(comp: T) {
  comp.__solid = 1
  return comp
}

export function renderComponent(Comp: any, props: any, store: TableStore) {
  if (!Comp) return null
  if (typeof Comp == 'string') {}
  else if (!Comp.__solid) Comp = store.props.renderer!(Comp)
  return typeof Comp === 'function' ? <Comp {...props} /> : Comp
}