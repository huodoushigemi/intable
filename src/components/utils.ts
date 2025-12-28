import type { JSX } from 'solid-js'

export function solidComponent<T extends (...arg) => JSX.Element>(comp: T) {
  comp.__solid = 1
  return comp
}
