# intable

## 特征

- 类似 Excel 的表格组件
- 单元格多选、复制、粘贴
- 单元格编辑、数据校验
- 列宽、行高可调整
- 列、行可拖拽
- 虚拟滚动
- 数据分组
- 行展开
- 插件易扩展
- 多框架支持（Vue、React）
- 多 UI库支持（Antd、ElementPlus）

## 快速开始

<details>
<summary>solid-js</summary>

**安装**

```sh
pnpm add intable
```

**使用**

```jsx
import { render } from 'solid-js/web'
import Intable from 'intable'

const App = () => {
  const columns = [
    { id: 'name', name: '名称' },
    { id: 'date', name: '日期' },
    { id: 'address', name: '地址' },
  ]

  const data = [
    { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-01', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  ]

  return <Intable data={data} columns={columns} />
}

render(() => <App />)
```
</details>

<details>
<summary>vue</summary>

**安装**

```sh
pnpm add @intable/vue
```

**使用**

```html
<template>
  <Intable data={data} columns={columns} />
</template>

<script setup>
import Intable from '@intable/vue'

const columns = [
  { id: 'name', name: '名称' },
  { id: 'date', name: '日期' },
  { id: 'address', name: '地址' },
]

const data = [
  { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { date: '2016-05-01', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
]
</script>
```
</details>

<details>
<summary>react</summary>

**安装**

```sh
pnpm add @intable/react
```

**使用**

```jsx
import Intable from '@intable/react'

const App = () => {
  const columns = [
    { id: 'name', name: '名称' },
    { id: 'date', name: '日期' },
    { id: 'address', name: '地址' },
  ]

  const data = [
    { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
    { date: '2016-05-01', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  ]

  return <Intable data={data} columns={columns} />
}
```
</details>

## Props

| 属性名       | 描述         | 类型                            | 默认值 |
| ------------ | ------------ | ------------------------------- | ------ |
| data         | 数据         | any[]                           |        |
| columns      | 展示列       | Column[]                        |        |
| index        | 显示序号     | bool                            | false  |
| border       | 显示纵向边框 | bool                            | false  |
| stickyHeader | 表头吸顶     | bool                            | false  |
| size         | 尺寸         | 'large' \| 'default' \| 'small' | false  |
| rowSelection | 启用行选择   | [@see]()                        | false  |