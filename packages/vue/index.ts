import { onCleanup, createRenderEffect } from 'solid-js'
import { Plugin, type TableProps } from '../../src/xxx'
import '../../src/wc'

import 'virtual:uno.css'

import { h, normalizeStyle, normalizeClass, toRaw, render, type Component } from 'vue'
import { mapValues } from 'es-toolkit'

const VueTable: Component<TableProps> = props => (
  h('wc-table', {
    noShadow: true,
    style: 'display: contents',
    '.options': {
      ...mapValues(props, v => toRaw(v)),
      class: normalizeClass(props.class),
      style: normalizeStyle([props.style]),
      renderer: comp => component(comp),
      plugins: [xxxPlugin]
    }
  })
)

const xxxPlugin: Plugin = {
  processProps: {
    rowSelection: ({ selected, rowSelection, onUpdateSelected }) => ({
      value: selected,
      ...rowSelection,
      onChange(selected) {
        onUpdateSelected?.(selected)
        rowSelection?.onChange?.(...arguments)
      },
    }),
    onDataChange: ({ onDataChange, onUpdateData }) => (data) => {
      onUpdateData?.(data)
      onDataChange?.(data)
    }
  }
}

VueTable.inheritAttrs = false

const component = <T extends Record<string, any>>(Comp: Component<T>) => {
  return (props: T) => {
    const root = document.createDocumentFragment()
    createRenderEffect(() => render(h(Comp, { ...props }), root))
    // createEffect(() => render(h(Comp, { ...props }), root))
    onCleanup(() => render(null, root))
    root.remove = () => {}
    return root
  }
}

export default VueTable