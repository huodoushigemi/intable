/* @refresh reload */
import { batch, createEffect, createMemo, createSignal, untrack } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { createMutable } from 'solid-js/store'
import { Intable } from './'
import { useMemoState } from './hooks'

const PROPS = {
  options: {},
  css: { value: '', attribute: 'css', notify: true, reflect: false },
  theme: '',
  noShadow: true,
}

export const TableElement = customElement('wc-table', PROPS, (attrs, { element }) => {
  attrs.noShadow && noShadowDOM()

  const props = useMemoState(() => attrs.options)
  
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
