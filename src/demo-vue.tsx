// import './inject'
import { $PROXY, batch, children, createEffect, createRoot, For, mergeProps, onMount, onCleanup, createComponent, createRenderEffect } from 'solid-js'
import { insert, render as solidRender } from 'solid-js/web'
import { $RAW, createMutable, reconcile } from 'solid-js/store'
import { Table, type TableProps } from './xxx'
import { log } from './utils'

import './index.scss'
import './theme/element-plus.scss'
import 'virtual:uno.css'

import { createApp, defineComponent, getCurrentInstance, h, onMounted, onUnmounted, normalizeStyle, normalizeClass, ref, reactive, toRaw, render, Fragment, Comment, createCommentVNode, createTextVNode, cloneVNode, type Component, createVNode, createElementVNode, shallowReactive } from 'vue'
import { mapValues } from 'es-toolkit'
import type { RenderProps } from './plugins/RenderPlugin'

const container = document.createElement('div')

document.body.append(container)

import './wc'
const VueTable: Component<TableProps> = props => (
  h('wc-table', {
    noShadow: true,
    '.options': {
      ...mapValues(props, v => toRaw(v)),
      class: '',
      style: 'width: 100%; height: 100%',
      renderer: comp => component(comp)
    }
  })
)

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


const solid2vue = (Comp) => {
  return defineComponent({
    setup() {
      const ins = getCurrentInstance()
      onMounted(() => {
        const el = ins!.proxy!.$el
        createRoot(dispose => {
          insert(el.parentElement, typeof Comp == 'function' ? createComponent(Comp, {}) : '', el)
          onUnmounted(dispose)
        })
      })
      return () => createCommentVNode('solid-marker')
    }
  })
}

const solidNode2vnode = (node) => {
  return defineComponent({
    setup() {
      let el
      createRoot(dispose => {
        insert(el.parentElement, typeof Comp == 'function' ? createComponent(Comp, {}) : '', el)
        onUnmounted(dispose)
      })
      return {}
    },
    render(_ctx, _cache) {
      const vnode = _cache[0] ||= createElementVNode('div', null, null, -1)
      // vnode.el = el
      return vnode
    }
  })
}

const solidNode2vnode2 = (node) => {
  return h('div', {
    style: 'display: contents !important',
    onVnodeMounted({ el }) {
      Promise.resolve().then(() => {
      createRoot(dispose => {
        insert(el.parentElement, node, el)
        el.__solid = { dispose }
        el.remove()
      })
      })
    },
    onVnodeUnmounted({ el }) {
      el.__solid.dispose()
      el.__solid = void 0
    }
  })  
}

const solidNode2vnode3 = (node) => {
  console.log(node)
  return createElementVNode('div', {
    key: '__solid',
    onVnodeBeforeMount(vnode) {
      vnode.el = (
        typeof node == 'function' ? children(node)() :
        typeof node == 'string' || typeof node == 'number' ? document.createTextNode(node + '') :
        node
      )
    },
  }, null, -1)
}

const data = ref([{ 1: 'x1', id: 1 }])
setTimeout(() => {
  data.value = [{ id: 1, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' }, {  }, {}]
  // data.value.push({})
}, 1000);

createApp(() => [
  h(VueTable, {
    style: '',
    class: 'w-200 m-4',
    data: data.value,
    border: true,
    index: true,
    // size: 'small',
    columns: [
      { name: 'Date', id: 'date', editable: true, editOnInput: true },
      { name: 'Name', id: 'name' },
      { name: 'Address', id: 'address' },
      // { name: '4', id: '4', render: component<RenderProps>(o => h('div', { class: 'c-red' }, o.x)) },
      { name: '4', id: '4', render: o => h('div', { class: 'c-red' }, '111') },
    ],
    rowSelection: { enable: true }
  }),
])
  .mount(container)
