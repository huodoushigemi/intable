import type { Plugin } from 'intable'
import type { Editor } from 'intable/plugins/EditablePlugin'
import { resolveOptions } from 'intable/utils'

import { Checkbox, ColorPicker, DatePicker, Input, InputNumber, Rate, Select, Switch, TimePicker } from 'antd'
import { useEffect, useRef, useState, createElement as h, type FC } from 'react'
import { createRoot } from 'react-dom/client'

export const AntdPlugin: Plugin = {
  name: 'antd', 
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

const editor = (Comp: FC<any>, opts = {}) => createEditor(Comp, opts, false)
const selector = (Comp: FC<any>, opts = {}) => createEditor(Comp, opts, true)
