/* @refresh reload */
import { createEffect, createSignal, getOwner, runWithOwner } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { isPlainObject, mapValues } from 'es-toolkit'
import { createShallowState, useMemoState } from './hooks'
import { change2 } from './utils'
import { Intable } from './'

const PROPS = {
  options: {},
  css: { value: '', attribute: 'css', notify: true, reflect: false },
  theme: '',
  noShadow: true,
}

export const TableElement = customElement('wc-table', PROPS, (attrs, { element }) => {
  attrs.noShadow && noShadowDOM()

  const owner = getOwner()
  let cache = {} as any

  const props = useMemoState(() => (
    mapValues(attrs.options, (v, k) => {
      if (!isPlainObject(v)) return v
      runWithOwner(owner, () => cache[k] ??= createShallowState({}))
      return change2(cache[k], v)
    })
  ))
  
  return (
    <Intable {...props} />
  )
})

function memoAsync(fn) {
  const ret = createSignal('')
  let count = 0
  createEffect(async () => {
    const _count = ++count
    let val = fn()
    if (val instanceof Promise) val = await val
    if (_count == count) ret[1](val)
  })
  return ret[0]
}
