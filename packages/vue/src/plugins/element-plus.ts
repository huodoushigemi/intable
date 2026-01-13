import type { Plugin } from 'intable'
import type { Editor } from 'intable/plugins/EditablePlugin'
import { resolveOptions } from 'intable/utils'

import { ElCheckbox, ElColorPicker, ElDatePicker, ElInput, ElInputNumber, ElRate, ElSelect, ElSwitch, ElTimePicker } from 'element-plus'
import { type Component, h, mergeProps, ref, render } from 'vue'

export const ElementPlusPlugin: Plugin = {
  store(store) {
    store.editors.text = createEditor(ElInput)
    store.editors.number = createEditor(ElInputNumber)
    store.editors.rate = createEditor(ElRate)
    store.editors.switch = createEditor(ElSwitch)
    store.editors.checkbox = createEditor(ElCheckbox)
    store.editors.color = createEditor(ElColorPicker, {}, true)
    store.editors.select = createEditor(ElSelect, {}, true)
    store.editors.date = createEditor(ElDatePicker, { valueFormat: 'YYYY-MM-DD' }, true)
    store.editors.time = createEditor(ElTimePicker, {}, true)
    store.editors.datetime = createEditor(ElDatePicker, { type: 'datetime', valueFormat: 'YYYY-MM-DD HH:mm:ss' }, true)
  },
  rewriteProps: {
    class: ({ class: clazz }) => `element-plus ${clazz}`
  }
}

const getElement = (el: any) => {
  if (!el) return el
  if (el instanceof Text) el = el.nextElementSibling
  return el.querySelector('input') ?? el.querySelector('button') ?? el.querySelector('[class*=__trigger]') ?? el
}

const createEditor = (Comp: Component, extra?, isSelector?): Editor => {
  return ({ eventKey, value, col, ok, cancel, props }) => {
    const v = ref(isSelector ? value : (eventKey || value))
    const elref = ref()
    const root = document.createDocumentFragment()
    root.remove ??= () => {}
    
    const App = () => h(Comp, mergeProps(extra, props, {
      ref: elref,
      modelValue: v.value,
      'onUpdate:modelValue': (val) => v.value = val,
      onPointerdown: (e: Event) => e.stopPropagation(),
      onMousedown: (e: Event) => e.stopPropagation(),
      onKeydown: (e: KeyboardEvent) => {
        e.stopPropagation()
        if (e.key === 'Enter') ok()
        if (e.key === 'Escape') cancel()
      },
      ...isSelector ? {
        onChange: () => ok(),
        options: resolveOptions(col.enum ?? []),
      } : {}
    }))

    render(h(App), root)
    
    return {
      el: root,
      getValue: () => v.value,
      destroy: () => render(null, root),
      focus: () => {
        if (isSelector) getElement(elref.value?.$el)?.click()
        elref.value?.focus?.()
      },
      blur: () => elref.value?.blur?.(),
    }
  }
}