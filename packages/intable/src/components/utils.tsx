import type { JSX } from 'solid-js'
import type { TableStore } from '..'

export function solidComponent<T extends (...arg) => JSX.Element>(comp: T) {
  comp.__solid = 1
  return comp
}

export function renderComponent(Comp: any, props: any, store: TableStore) {
  if (!Comp) return null
  const t = typeof Comp
  if (t === 'string' || t === 'number') {}
  else if (!Comp.__solid) Comp = store.props.renderer!(Comp)
  return t === 'function' ? <Comp {...props} /> : Comp
}