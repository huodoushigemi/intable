import { $PROXY, batch, children, createEffect, createRoot, For, mergeProps, onMount, onCleanup, createComponent, createRenderEffect } from 'solid-js'
import { insert, render as solidRender } from 'solid-js/web'
import { $RAW, createMutable } from 'solid-js/store'
import { Table, type TableProps } from './xxx'
import { log } from './utils'

import './index.scss'
import 'virtual:uno.css'

import { createApp, defineComponent, getCurrentInstance, h, onMounted, onUnmounted, normalizeStyle, normalizeClass, ref, reactive, toRaw, render, Fragment, Comment, createCommentVNode, createTextVNode, cloneVNode, type Component, createVNode, createElementVNode } from 'vue'
import { mapValues } from 'es-toolkit'
import type { RenderProps } from './plugins/RenderPlugin'

const container = document.createElement('div')
document.body.append(container)

const VueTable: Component<TableProps> = (props) => (
  h('div', {
    style: 'display: contents !important',
    '.props': props,
    props,
    onVnodeBeforeMount(vnode) {
      createRoot(dispose => {
        // const props = createMutable(mapValues(vnode.props['.props'], v => toRaw(v)))
        const props = createMutable({ ...vnode.props['.props'] })
        // console.log(props)
        console.log(props.data, 1)
        console.log(props.data, 2)
        return
        // console.log(props.data)
        // const props = { ...vnode.props['.props'] }

        props.style = normalizeStyle([props.style])
        props.class = normalizeClass(props.class)
        vnode.ctx.__solid = { props, dispose }
        insert(vnode.el, <Table {...props} />)
      })
    },
    onVnodeUpdated(vnode) {
      batch(() => {
        const old = vnode.ctx.__solid.props
        const props = vnode.props['.props']
        for (const k in old) {
          if (!(k in props)) delete old[k]
        }
        Object.assign(old, mapValues(vnode.props['.props'], v => toRaw(v)))
      })
    },
    onVnodeUnmounted(vnode) {
      vnode.ctx.__solid?.dispose?.()
      vnode.ctx.__solid = void 0
    }
  })
)

const component = <T extends Record<string, any>>(Comp: Component<T>) => {
  return (props: T) => {
    const root = document.createDocumentFragment()
    createRenderEffect(() => render(h(Comp, { ...props }), root))
    // createEffect(() => render(h(Comp, { ...props }), root))
    onCleanup(() => render(null, root))
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

const data = ref([{ 1: 'x1' }])
setTimeout(() => {
  // data.value = [{}, {}, {}]
  // data.value.push({})
}, 1000);

createApp(() => [
  h(VueTable, {
    style: 'width: 400px',
    // data: [...data.value],
    data: data.value,
    columns: [
      { name: '1', id: '1' },
      { name: '2', id: '2' },
      { name: '3', id: '3' },
      // { name: '4', id: '4', render: component<RenderProps>(o => h('div', { class: 'c-red' }, o.x)) },
    ],
    rowSelection: { enable: true }
    // plugins: window.xxx ??= [
    //   {
    //     processProps: {
    //       Td: ({ Td }) => component(o => {
    //         return [
    //           // h('div', { class: 'c-red' }, 'x'),
    //           solidNode2vnode2(createComponent(Td, o))
    //         ]
    //       })
    //     }
    //   }
    // ]
  }),
  // h(Comment, { onVnodeMounted: (vnode) => console.log(vnode) }, [h('div', 'xxx')])
  // createTextVNode()
  // cloneVNode(createCommentVNode('xxx'), { onVnodeMounted: (vnode) => console.log(vnode) })
  // cloneVNode(createTextVNode('xxx', 1), { onVnodeMounted: (vnode) => console.log(vnode) })
  // h(xx)
])
  .mount(container)
