/* @refresh reload */
import { batch, createEffect, createMemo, createSignal, untrack } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { createMutable, reconcile } from 'solid-js/store'
import { Intable } from './'

const PROPS = {
  options: {},
  css: { value: '', attribute: 'css', notify: true, reflect: false },
  theme: '',
  noShadow: true,
}

export const TableElement = customElement('wc-table', PROPS, (attrs, { element }) => {
  attrs.noShadow && noShadowDOM()

  const props = createMutable(attrs.options)

  createEffect(() => {
    const { options } = attrs
    untrack(() => batch(() => reconcile(options)(props)))
  })
  
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
