import type { Plugin } from 'intable'
import type { Editor } from 'intable/plugins/EditablePlugin'
import { resolveOptions } from 'intable/utils'

import { Checkbox, ColorPicker, DatePicker, Input, InputNumber, Rate, Select, Switch, TimePicker, version } from 'antd'
import { useEffect, useRef, useState, createElement as h, type FC } from 'react'

import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import localeData from 'dayjs/plugin/localeData'
// 兼容 antd@4 的 DatePicker
dayjs.extend(weekday)
dayjs.extend(localeData)

import { createRoot } from '../utils'

export const AntdPlugin: Plugin = {
  name: 'antd',
  store(store) {
    store.editors.text = editor(Input)
    store.editors.textarea = editor(Input.TextArea, o => ({ ...o }))
    store.editors.number = editor(InputNumber)
    store.editors.rate = editor(Rate)
    store.editors.switch = editor(Switch)
    store.editors.checkbox = editor(Checkbox, o => ({ ...o, checked: o.value, onChange: e => o.onChange(e.target.checked) }))
    store.editors.color = selector(ColorPicker, o => ({ ...o, onChange: undefined, onChangeComplete: v => o.onChange(v?.toHexString?.() || v) }))
    store.editors.select = selector(Select, o => ({ style: { width: '100%' }, ...o }))
    store.editors.date = selector(DatePicker, o => ({ ...o, value: o.value && dayjs(o.value), onChange: (_, v) => o.onChange(v) }))
    store.editors.time = selector(TimePicker, o => ({ ...o, value: o.value && dayjs(o.value, 'HH:mm:ss'), onChange: (_, v) => o.onChange(v) }))
    store.editors.datetime = selector(DatePicker, o => ({ ...o, showTime: true, value: o.value && dayjs(o.value), onChange: (_, v) => o.onChange(v) }))
  },
  rewriteProps: {
    class: ({ class: clazz }) => `antd ${clazz}`
  }
}

export const createEditor = (Comp: FC<any>, opts = v => v, isSelector?: boolean): Editor => (editorOpts) => {
  const { eventKey, value, col, ok, cancel, props } = editorOpts
  const container = document.createElement('div')
  container.style.display = 'contents'
  const root = createRoot(container)

  const Inputs = [Input, InputNumber, Input.TextArea]
  
  let currentValue = Inputs.includes(Comp) ? (eventKey || value) : value
  let elRef: any
  
  const EditorComp = () => {
    const [val, setVal] = useState(currentValue)
    const [searchValue, onSearch] = useState(eventKey)
    const ref = useRef<any>(null)
    
    useEffect(() => {
      elRef = ref.current
      ref.current?.focus?.()
    }, [])
    
    const handleChange = (e: any) => {
      currentValue = e.target instanceof Node ? e.target.value : e
      setVal(currentValue)
      isSelector && !Array.isArray(currentValue) && setTimeout(ok, 100)
    }
    
    return h(Comp, opts({
      ref,
      value: val,
      onChange: handleChange,
      open: true,

      // select
      ...+version.split('.')[0] <= 5
        ? { showSearch: true, optionFilterProp: 'label', searchValue, onSearch }
        : {  showSearch: { optionFilterProp: 'label', searchValue, onSearch } },

      ...(col?.enum && { options: resolveOptions(col.enum) }),

      // variant: 'borderless',
      // style: { width: '100%', height: '100%' },
      ...props,
    }))
  }
  
  // 延迟渲染以兼容 antd@4 下拉框的定位问题
  queueMicrotask(() => {
    root.render(h(EditorComp))
  })
  
  return {
    el: container,
    getValue: () => currentValue,
    destroy: () => root.unmount(),
    focus: () => elRef?.focus?.(),
    blur: () => elRef?.blur?.(),
  }
}

const editor = (Comp: FC<any>, opts?) => createEditor(Comp, opts, false)
const selector = (Comp: FC<any>, opts?) => createEditor(Comp, opts, true)
