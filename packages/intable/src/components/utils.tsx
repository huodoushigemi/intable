import { type JSX } from 'solid-js'
import { Ctx, type TableStore } from '..'
import { useContext } from 'solid-js'

export function solidComponent<T extends (...arg) => JSX.Element>(comp: T) {
  comp.__solid = 1
  return comp
}

export function renderComponent(Comp: any, props?: any, store = useContext(Ctx).store) {
  if (!Comp) return null
  const t = typeof Comp
  if (t === 'string' || t === 'number' || t === 'boolean') {}
  else if (!Comp.__solid && store) Comp = store.props.renderer!(Comp)
  return t === 'function' ? Comp(props) : Comp
}