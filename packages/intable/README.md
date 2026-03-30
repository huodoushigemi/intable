---
name: intable
description: A high-performance, plugin-based Excel-like table component for SolidJS with virtual scroll, cell editing, validation, copy/paste, row grouping, tree data, column/row drag, merge cells, diff view, and multi-framework support (Vue, React).
---

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
- 树嵌套
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
  <Intable :data="data" :columns="columns" />
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

| 属性名       | 描述         | 类型                            | 默认值  |
| ------------ | ------------ | ------------------------------- | ------- |
| data         | 数据         | any[]                           |         |
| columns      | 展示列       | Column[]                        |         |
| rowKey       | 行唯一键字段 | string                          | `'id'`  |
| index        | 显示序号     | boolean                         | false   |
| border       | 显示纵向边框 | boolean                         | false   |
| stickyHeader | 表头吸顶     | boolean                         | false   |
| size         | 尺寸         | `'large' \| 'default' \| 'small'` | —     |
| plugins      | 插件列表     | Plugin[]                        | `[]`    |

## Column

| 属性名   | 描述                   | 类型                          |
| -------- | ---------------------- | ----------------------------- |
| id       | 字段名，对应数据 key   | string \| symbol              |
| name     | 表头显示名称           | string                        |
| width    | 列宽（px）             | number                        |
| fixed    | 固定列                 | `'left' \| 'right'`           |
| render   | 自定义渲染器           | `string \| Render`            |
| enum     | 枚举映射   | `Record<string,any> \| {label?,value}[]` |
| editable | 是否可编辑             | boolean                       |
| editor   | 编辑器类型或自定义实现 | `string \| Editor`            |
| resizable| 是否允许调整列宽       | boolean                       |

## 插件

插件通过 `plugins` 属性传入，部分插件需从对应路径手动引入。

---

### VirtualScrollPlugin — 虚拟滚动

大数据量下只渲染可见行列，显著提升性能。

```jsx
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

<Intable
  plugins={[VirtualScrollPlugin]}
  virtual={{
    y: { estimateSize: () => 40, overscan: 10 },  // 行虚拟化参数
    x: { overscan: 5 },                           // 列虚拟化参数
  }}
/>
```

---

### EditablePlugin — 单元格编辑

在 Column 上设置 `editable: true` 开启单元格编辑，双击或输入字符进入编辑状态。

```jsx
const columns = [
  { id: 'name', name: '姓名', editable: true },
  { id: 'age',  name: '年龄', editable: true, editor: 'number' },
  { id: 'type', name: '类型', editable: true, editor: 'select', enum: { 1: 'A', 2: 'B' } },
  { id: 'date', name: '日期', editable: true, editor: 'date' },
]

<Intable columns={columns} onDataChange={setData} />
```

内置编辑器类型：`text`（默认）、`number`、`select`、`date`、`time`、`datetime`、`switch`、`checkbox`、`rate`、`color`、`file`。

搭配 UI 库插件可直接使用对应组件：
- **Antd**：`import { AntdPlugin } from '@intable/react/plugins/antd'`
- **Element Plus**：`import { ElementPlusPlugin } from '@intable/vue/plugins/element-plus'`

---

### RowSelectionPlugin — 行选择

```jsx
<Intable
  rowSelection={{
    enable: true,
    multiple: true,              // 多选，默认 true
    value: selectedRows,         // 受控选中值
    selectable: row => row.age > 18,  // 可选条件
    onChange: rows => setSelected(rows),
  }}
/>
```

---

### ExpandPlugin — 行展开

点击行首箭头展开自定义内容区域。

```jsx
<Intable
  expand={{
    enable: true,
    render: ({ data, y }) => <div>详情：{data.name}</div>,
  }}
/>
```

---

### RowGroupPlugin — 行分组

按指定字段对行进行分级树形分组，支持展开/折叠。

```jsx
<Intable
  rowGroup={{ fields: ['type', 'subType'] }}
/>
```

---

### TreePlugin — 树形数据

渲染嵌套 `children` 字段的树状数据，支持展开/折叠，自动缩进。

```jsx
const data = [
  { id: 1, name: '总部', children: [
    { id: 2, name: '研发部' },
    { id: 3, name: '产品部', children: [
      { id: 4, name: '设计组' },
    ]},
  ]},
]

<Intable
  tree={{ children: 'children' }}  // 子节点字段名，默认 'children'
  data={data}
  columns={[{ id: 'name', name: '名称' }]}
/>
```

---

### ResizePlugin — 调整列宽 / 行高

拖动表头右侧边框调整列宽，拖动行底部边框调整行高。

```jsx
<Intable
  resizable={{
    col: { enable: true, min: 60, max: 600 },
    row: { enable: true, min: 28, max: 200 },
  }}
  onColumnsChange={cols => setColumns(cols)}
/>
```

也可在单列上单独控制：

```js
{ id: 'name', name: '姓名', resizable: false }  // 禁止该列拖拽
```

---

### DragPlugin — 列 / 行拖拽排序

长按后拖拽列标题或行首单元格可重新排序。

```jsx
<Intable
  colDrag={true}  // 开启列拖拽
  rowDrag={true}  // 开启行拖拽
  onColumnsChange={cols => setColumns(cols)}
/>
```

---

### HistoryPlugin — 撤销 / 重做

记录数据变更历史，支持 `Ctrl+Z` / `Ctrl+Y`。

```jsx
import { HistoryPlugin } from 'intable/plugins/HistoryPlugin'

<Intable plugins={[HistoryPlugin]} />
```

通过命令调用：
```js
store.history.undo()
store.history.redo()
```

---

### DiffPlugin — 数据差异对比

将当前数据与快照进行比较，高亮新增/删除/修改行，支持提交。

```jsx
import { DiffPlugin } from 'intable/plugins/DiffPlugin'

<Intable
  plugins={[DiffPlugin]}
  diff={{
    added: true,    // 高亮新增行，默认 true
    removed: true,  // 高亮删除行，默认 true
    changed: true,  // 高亮修改行，默认 true
    onCommit: (data, { added, removed, changed }) => save(data),
  }}
/>
```

`Ctrl+S` 触发提交，或通过命令：
```js
store.commands.diffCommit()
```

---

### CellMergePlugin — 单元格合并

通过 `merge` 回调或 Column 的 `mergeRow` 快捷属性合并相邻单元格。

```jsx
// 方式一：全局 merge 回调
<Intable
  merge={(row, col, y, x) => {
    if (col.id === 'name') {
      let rowspan = 1
      while (data[y + rowspan]?.name === row.name) rowspan++
      return rowspan > 1 ? { rowspan } : null
    }
  }}
/>

// 方式二：列级 mergeRow 快捷属性（自动合并相邻等值行）
const columns = [
  { id: 'type', name: '类型', mergeRow: true },
  { id: 'name', name: '名称' },
]
<Intable columns={columns} />
```

---

### CellSelectionPlugin — 单元格多选

鼠标拖拽或 `Shift+点击` 选择矩形区域，箭头键移动焦点。

---

### CopyPastePlugin — 复制粘贴

`Ctrl+C` 复制选中区域为 TSV 格式，`Ctrl+V` 粘贴。