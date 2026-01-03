// import './inject'
import { onCleanup, createRenderEffect } from 'solid-js'
import { type Plugin, type TableProps } from './xxx'

import './index.scss'
import './theme/element-plus.scss'
import 'virtual:uno.css'

import { createApp, h, normalizeStyle, normalizeClass, ref, toRaw, render, type Component } from 'vue'
import { mapValues } from 'es-toolkit'

const container = document.createElement('div')

document.body.append(container)

import './wc'
const VueTable: Component<TableProps> = props => (
  h('wc-table', {
    noShadow: true,
    style: 'display: contents',
    '.options': {
      ...mapValues(props, v => toRaw(v)),
      class: normalizeClass(props.class),
      style: normalizeStyle([props.style]),
      renderer: comp => component(comp),
      plugin: []
    }
  })
)

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
const data = ref([{ 1: 'x1', id: 1 }])
data.value = [{ id: 1, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' }, {  }, {}]
setTimeout(() => {
  // data.value.push({})
}, 1000);

createApp(() => [
  h(VueTable, {
    style: '',
    class: 'w-100 m-4',
    data: data.value,
    border: true,
    index: true,
    size: 'small',
    columns: [
      { name: 'Date', id: 'date', editable: true, editOnInput: true },
      { name: 'Name', id: 'name' },
      { name: 'Address', id: 'address', width: 250 },
      // { name: '4', id: '4', render: component<RenderProps>(o => h('div', { class: 'c-red' }, o.x)) },
      { name: '4', id: '4', render: o => h('div', { class: 'c-red' }, '111'), fixed: 'right' },
    ],
    rowSelection: { enable: true }
  }),
])
  .mount(container)
