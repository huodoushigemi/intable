import { onCleanup, createRenderEffect } from 'solid-js'
import { type Plugin, type TableProps } from 'intable'
import 'intable/wc'
import './style.scss'

// import '../../intable/src/wc'

export type { TableProps } from 'intable'

import { h, normalizeClass, toRaw, render, type Component, type FunctionalComponent, type App } from 'vue'
import { stringifyStyle } from '@vue/shared'
import { mapValues } from 'es-toolkit'

export const Intable: FunctionalComponent<TableProps> = ((props) => (
  props = mapValues(props, v => toRaw(v)),
  h('wc-table', {
    style: 'display: contents',
    '.options': {
      ...props,
      class: normalizeClass(props.class),
      style: stringifyStyle(props.style),
      renderer: component,
      plugins: [
        VModelPlugin,
        ...props.plugins || []
      ]
    } as TableProps
  })
))

Intable.inheritAttrs = false
Intable.__name = 'intable'
Intable.install = app => app.component(Intable.__name, Intable)

const VModelPlugin: Plugin = {
  name: 'v-model',
  rewriteProps: {
    rowSelection: ({ rowSelection }, { store }) => ({
      get value() { return store.props?.selected },
      ...rowSelection,
      onChange(selected) {
        store.props!['onUpdate:selected']?.(selected)
        rowSelection?.onChange?.(...arguments)
      },
    }),
    onDataChange: ({ onDataChange }, { store }) => (data) => {
      store.props!['onUpdate:data']?.(data)
      onDataChange?.(data)
    }
  }
}

const component = <T extends Record<string, any>>(Comp: Component<T>) => {
  return (props: T) => {
    const root = document.createDocumentFragment()
    root.remove ??= () => {}
    createRenderEffect(() => render(h(Comp, { ...props }), root))
    onCleanup(() => render(null, root))
    return root
  }
}

export default Intable