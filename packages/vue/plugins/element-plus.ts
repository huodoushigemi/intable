import type { Plugin } from '@/index'
import type { Editor } from '@/plugins/EditablePlugin'
import { log, resolveOptions } from '@/utils'

import { ElCheckbox, ElColorPicker, ElDatePicker, ElInput, ElInputNumber, ElRate, ElSelect, ElSwitch, ElTimePicker } from 'element-plus'
import 'element-plus/dist/index.css'
import { type Component, h, mergeProps, ref, render } from 'vue'

export const ElementPlusPlugin: Plugin = {
  store(store) {
    store.editors.text = editor(ElInput)
    store.editors.number = editor(ElInputNumber)
    store.editors.rate = editor(ElRate)
    store.editors.switch = editor(ElSwitch)
    store.editors.checkbox = editor(ElCheckbox)
    store.editors.color = selector(ElColorPicker)
    store.editors.select = selector(ElSelect)
    store.editors.date = selector(ElDatePicker)
    store.editors.time = selector(ElTimePicker)
    store.editors.datetime = selector(ElDatePicker, { type: 'datetime' })
  },
  rewriteProps: {
    class: ({ class: clazz }) => `element-plus ${clazz}`
  }
}

const getel = el => {
  if (!el) return el
  if (el instanceof Text) el = el.nextElementSibling
  el = el.querySelector('input') ?? el.querySelector('button') ?? el.querySelector('[class*=__trigger]') ?? el
  return el
}

const editor = (Comp: Component<any>, extra?): Editor => {
  return ({ eventKey, value, ok, cancel, props }) => {
    const v = ref(eventKey || value)
    const elref = ref()
    const root = document.createDocumentFragment()
    root.remove ??= () => {}
    const App = () => h(Comp, mergeProps(extra, props, {
      ref: elref,
      modelValue: v.value,
      'onUpdate:modelValue': val => v.value = val,
      onPointerdown: e => e.stopPropagation(),
      onKeydown: e => {
        e.stopPropagation()
        e.key == 'Enter' && ok()
        e.key == 'Escape' && cancel()
      }
    }))
    render(h(App), root)
    return {
      el: root,
      getValue: () => v.value,
      destroy: () => render(null, root),
      focus: () => elref.value?.focus?.(),
      blur: () => elref.value?.blur?.(),
    }
  }
}

const selector = (Comp: Component<any>, extra?): Editor => {
  return ({ eventKey, value, col, data, ok, cancel, props }) => {
    const v = ref(value)
    const elref = ref()
    const root = document.createDocumentFragment()
    root.remove ??= () => {}
    const App = () => h(Comp, mergeProps(extra, props, {
      ref: elref,
      modelValue: v.value,
      'onUpdate:modelValue': val => v.value = val,
      // todo：部分组件 onPointerdown 无效
      onPointerdown: e => e.stopPropagation(),
      onChange: () => ok(),
      options: resolveOptions(col.enum ?? []),
      onKeydown: e => {
        e.key == 'Escape' && cancel()
      }
    }))
    render(h(App), root)
    return {
      el: root,
      getValue: () => v.value,
      destroy: () => render(null, root),
      focus: () => (getel(elref.value.$el)?.click(), elref.value?.focus?.()),
      blur: () => elref.value?.blur?.(),
    }
  }
}