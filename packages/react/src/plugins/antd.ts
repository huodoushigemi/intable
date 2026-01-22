import type { Plugin } from 'intable'
import type { Editor } from 'intable/plugins/EditablePlugin'
import { resolveOptions } from 'intable/utils'

import { Checkbox, ColorPicker, DatePicker, Input, InputNumber, Rate, Select, Switch, TimePicker } from 'antd'
import { useEffect, useRef, useState, createElement as h, type FC } from 'react'
import { createRoot } from 'react-dom/client'

export const AntdPlugin: Plugin = {
  store(store) {
    store.editors.text = editor(Input)
    store.editors.number = editor(InputNumber)
    store.editors.rate = editor(Rate)
    store.editors.switch = editor(Switch)
    store.editors.checkbox = editor(Checkbox)
    store.editors.color = selector(ColorPicker, { transform: v => v?.toHexString?.() || v })
    store.editors.select = selector(Select)
    store.editors.date = selector(DatePicker)
    store.editors.time = selector(TimePicker)
    store.editors.datetime = selector(DatePicker, { showTime: true })
  },
  rewriteProps: {
    class: ({ class: clazz }) => `antd ${clazz}`
  }
}

const getEl = (el: any) => {
  if (!el) return el
  if (el instanceof Text) el = el.nextElementSibling
  return el?.querySelector('input') ?? el?.querySelector('button') ?? el?.querySelector('[class*=trigger]') ?? el
}

const createEditor = (Comp: FC<any>, opts: any, isSelector?: boolean): Editor => (editorOpts) => {
  const { eventKey, value, col, ok, cancel, props } = editorOpts
  const container = document.createElement('div')
  const root = createRoot(container)
  
  let currentValue = eventKey || value
  let elRef: any
  
  const EditorComp = () => {
    const [val, setVal] = useState(currentValue)
    const ref = useRef<any>(null)
    
    useEffect(() => {
      elRef = ref.current
      if (isSelector) {
        setTimeout(() => (getEl(ref.current)?.click?.(), ref.current?.focus?.()), 0)
      } else {
        ref.current?.focus?.()
      }
    }, [])
    
    const handleChange = (newVal: any) => {
      currentValue = opts.transform ? opts.transform(newVal) : newVal
      setVal(currentValue)
      isSelector && setTimeout(ok, 100)
    }
    
    const handleKeyDown = (e: any) => {
      e.stopPropagation()
      if (e.key === 'Enter') ok()
      if (e.key === 'Escape') cancel()
    }
    
    return h(Comp, {
      ref,
      value: val,
      onChange: handleChange,
      onPointerDown: (e: any) => e.stopPropagation(),
      onKeyDown: handleKeyDown,
      ...(col?.enum && { options: resolveOptions(col.enum) }),
      ...opts,
      ...props,
    })
  }
  
  root.render(h(EditorComp))
  
  const fragment = document.createDocumentFragment()
  fragment.appendChild(container)
  
  return {
    el: fragment,
    getValue: () => currentValue,
    destroy: () => root.unmount(),
    focus: () => (isSelector && getEl(elRef)?.click?.(), elRef?.focus?.()),
    blur: () => elRef?.blur?.(),
  }
}

const editor = (Comp: FC<any>, opts = {}) => createEditor(Comp, opts, false)
const selector = (Comp: FC<any>, opts = {}) => createEditor(Comp, opts, true)
