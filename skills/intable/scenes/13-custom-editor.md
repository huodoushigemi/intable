# 自定义编辑器

当内置编辑器不满足业务时，可在列上直接传 `editor: (opt) => EditorInstance`。

`editor` 函数入参：
- `value` 当前单元格值
- `eventKey` 用户键入触发编辑时的首字符
- `data` 当前行数据
- `col` 当前列定义
- `props` 即 `editorProps`
- `ok()` 提交编辑（会触发校验）
- `cancel()` 取消编辑

返回对象必须包含：
- `el` 编辑器 DOM
- `getValue()` 返回当前值
- `destroy()` 释放资源

可选返回：
- `focus()` / `blur()`

---

## 原生 DOM 编辑器

```tsx
import type { Editor } from 'intable/plugins/EditablePlugin'

const myNumber: Editor = ({ value, eventKey, ok, cancel, props }) => {
  const input = document.createElement('input')
  input.type = 'number'
  Object.assign(input, props)
  input.value = String(eventKey ?? value ?? '')

  return {
    el: input,
    getValue: () => Number(input.value || 0),
    destroy: () => input.remove(),
    focus: () => input.focus(),
    blur: () => input.blur(),
  }
}

const columns = [
  { id: 'amount', name: '金额', editable: true, editor: myNumber, editorProps: { step: '1' } },
]

<Intable columns={columns} data={data} onDataChange={setData} />
```

---

## React 组件编辑器

```tsx
import { useEffect, useRef, useState, createElement as h, type FC } from 'react'
import { createRoot } from 'react-dom/client'
import type { Editor } from 'intable/plugins/EditablePlugin'
import { resolveOptions } from 'intable/utils'

export const createEditor = (Comp: FC<any>, opts = v => v, isSelector?: boolean): Editor => (editorOpts) => {
  const { eventKey, value, col, ok, cancel, props } = editorOpts
  const container = document.createElement('div')
  container.style.display = 'contents'
  const root = createRoot(container)

  let currentValue = isSelector ? value : (eventKey || value)
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
      ...(col?.enum && { options: resolveOptions(col.enum) }),
      ...props,
    }))
  }

  root.render(h(EditorComp))

  return {
    el: container,
    getValue: () => currentValue,
    destroy: () => root.unmount(),
    focus: () => elRef?.focus?.(),
    blur: () => elRef?.blur?.(),
  }
}

// 用法
const myInput  = createEditor(Input)
const myNumber = createEditor(Input, o => ({ ...o, type: 'number' }))
const mySelect = createEditor(Select, o => o, true)

const columns = [
  { id: 'amount', name: '金额', editable: true, editor: myNumber, editorProps: { step: '1' } },
]
```

> 建议：优先用 `editorProps` 传参数，避免在 `editor` 内硬编码，便于复用。

---

## 全局注册自定义编辑器

适用于多列复用的场景，注册后列上用字符串引用即可。

```tsx
import { editors } from 'intable/plugins/EditablePlugin'

editors.myNumber = createEditor(Input, o => ({ ...o, type: 'number' }))
editors.myRating = createEditor(Rate)

const columns = [
  { id: 'amount', name: '金额',   editable: true, editor: 'myNumber', editorProps: { step: '1' } },
  { id: 'score',  name: '满意度', editable: true, editor: 'myRating' },
]
```
