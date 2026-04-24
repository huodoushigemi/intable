# 行选择 / 行展开 / 树形表格 / 行拖拽 / 行分组

## 行选择（内置）

```tsx
let store
// 读取当前已选行对象数组（multiple=true 时为数组，否则为单个对象）
store.commands.rowSelector.value        // Row[]（multiple=true）
store.commands.rowSelector.has(row)     // 判断某行是否已选
store.commands.rowSelector.add(row)     // 编程式选中某行
store.commands.rowSelector.del(row)     // 取消选中
store.commands.rowSelector.clear()      // 清空所有选中

<Intable
  store={s => store = s}
  columns={columns}
  data={data}
  rowKey='id'
  rowSelection={{
    enable: true,                         // 必须为 true，否则不显示复选框列
    multiple: true,
    onChange: (selected) => console.log(selected),   // multiple=true 时 selected 为 Row[]
    selectable: (row) => row.age > 18,    // 限制可选行（可选）
  }}
/>
```

---

## 行展开/收起（内置）

```tsx
<Intable
  columns={columns}
  data={data}
  expand={{
    render: ({ data, y }) => (
      <div class='p-4 bg-gray-50'>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    ),
  }}
/>
```

编程式控制（通过 store）：

```tsx
let store
store.commands.expand.toggle(rowKey)
store.commands.expand.isSelected(rowKey)
```

---

## 树形表格（内置）

数据含 `children` 字段即可，无需额外配置。

```tsx
const data = [
  { id: 1, name: '研发部', children: [
    { id: 2, name: 'Web 组', children: [
      { id: 3, name: 'Alice' },
    ]},
    { id: 4, name: 'App 组' },
  ]},
]

<Intable columns={columns} data={data} rowKey='id' />

// 自定义 children 字段名
<Intable columns={columns} data={data} rowKey='id' tree={{ children: 'subItems' }} />
```

---

## 行拖拽排序（内置，默认关闭）

需先选中整行（点击行首列），再长按拖拽。

```tsx
// 行拖拽
<Intable columns={columns} data={data} onDataChange={setData} rowDrag />

// 列拖拽（同理）
<Intable columns={columns} data={data} onColumnsChange={setColumns} colDrag />
```

---

## 行分组（内置）

按指定字段对数据分组，支持多字段嵌套分组。

```tsx
<Intable
  columns={columns}
  data={data}
  rowGroup={{ fields: ['dept'] }}
/>

// 多字段嵌套分组
<Intable
  columns={columns}
  data={data}
  rowGroup={{ fields: ['dept', 'city'] }}
/>
```
