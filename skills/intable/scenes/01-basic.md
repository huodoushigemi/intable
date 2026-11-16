# 基础表格

## SolidJS

```tsx
import { Intable } from 'intable'
import 'intable/style.css'

const columns = [
  { id: 'name', name: '姓名', width: 120 },
  { id: 'age',  name: '年龄', width: 80  },
  { id: 'city', name: '城市', width: 120 },
]
const data = [
  { id: 1, name: 'Alice', age: 28, city: 'Beijing' },
  { id: 2, name: 'Bob',   age: 32, city: 'Shanghai' },
]

export default () => (
  <Intable
    class='h-400px'
    columns={columns}
    data={data}
    rowKey='id'
    index       // 行号列
    border
    stickyHeader
  />
)
```

## React

```tsx
import { Intable } from '@intable/react'
import '@intable/react/style.css'

export default function App() {
  const [data] = useState([{ id: 1, name: 'Alice', age: 28 }])
  return (
    <Intable
      style={{ width: '100%', height: '400px' }}
      columns={[
        { id: 'name', name: '姓名', width: 120 },
        { id: 'age',  name: '年龄', width: 80  },
      ]}
      data={data}
      rowKey='id'
      index border stickyHeader
    />
  )
}
```

## Vue 3

```vue
<template>
  <intable
    style="width:100%;height:400px"
    :columns="columns"
    :data="data"
    row-key="id"
    index border sticky-header
  />
</template>
<script setup>
import { ref } from 'vue'
import { Intable } from '@intable/vue'
import '@intable/vue/style.css'
const columns = ref([{ id: 'name', name: '姓名' }, { id: 'age', name: '年龄' }])
const data    = ref([{ id: 1, name: 'Alice', age: 28 }])
</script>
```

## 加载态

```tsx
const [loading, setLoading] = useState(true)
<Intable columns={columns} data={data} loading={loading} />
```

## 无表头（headless）

`headless` 不渲染 `thead`，只显示数据行，适合外部已有表头或移动端卡片列表。

```tsx
<Intable columns={columns} data={data} headless />
```

列宽在无表头模式下取首行单元格实测宽度（未指定 `width` 时），固定列偏移同样可用。

## 单元格 class/style 回调

```tsx
<Intable
  columns={columns}
  data={data}
  cellClass={({ col, value }) => col.id === 'age' && value > 30 ? 'c-red-500' : ''}
  cellStyle={({ col }) => col.id === 'name' ? 'font-weight:600' : ''}
/>
```

也可以按列配置：`class` 是固定字符串，同时作用于表头与单元格；`cellClass` 只作用于单元格，支持函数形式。

```tsx
const columns = [
  { id: 'name', name: '姓名', class: 'font-semibold' },
  { id: 'age',  name: '年龄', cellClass: ({ value }) => value > 30 ? 'c-red-500' : '' },
]
```
