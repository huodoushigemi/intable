import { onCleanup, createRenderEffect } from 'solid-js'
import { type Plugin, type TableProps } from 'intable'
import 'intable/wc'
import './style.scss'

import { h, normalizeStyle, normalizeClass, toRaw, render, type Component } from 'vue'
import { mapValues } from 'es-toolkit'

const VueTable: Component<TableProps> = (props) => (
  props = mapValues(props, v => toRaw(v)),
  h('wc-table', {
    style: 'display: contents',
    '.options': {
      ...props,
      class: normalizeClass(props.class),
      style: normalizeStyle([props.style]),
      renderer: component,
      plugins: [
        VModelPlugin,
        ...props.plugins || []
      ]
    } as TableProps
  })
)

const VModelPlugin: Plugin = {
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

VueTable.inheritAttrs = false

const component = <T extends Record<string, any>>(Comp: Component<T>) => {
  return (props: T) => {
    const root = document.createDocumentFragment()
    root.remove ??= () => {}
    createRenderEffect(() => render(h(Comp, { ...props }), root))
    onCleanup(() => render(null, root))
    return root
  }
}

export default VueTable