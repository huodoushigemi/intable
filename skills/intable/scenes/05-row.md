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
store.commands.rowSelector.isAll(data)  // 判断是否全部选中
store.commands.rowSelector.isIndeterminate(data)  // 判断是否半选（部分选中）

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

受控/非受控：

```tsx
// 受控：通过 value + onChange 管理选中状态
<Intable rowSelection={{ enable: true, multiple: true, value: selectedRows, onChange: setSelected }} />

// 非受控：通过 initialValue 设置初始值，后续由组件内部管理
<Intable rowSelection={{ enable: true, multiple: true, initialValue: [row1, row2] }} />
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
store.commands.expand.toggle(row)
store.commands.expand.has(row)
```

受控/非受控：

```tsx
// 非受控：通过 initialValue 设置初始展开行
<Intable expand={{ initialValue: [row], render: ... }} />
```

---

## 行样式 / 行点击

```tsx
// rowClass / rowStyle：按行自定义样式（函数或静态字符串）
<Intable
  columns={columns}
  data={data}
  rowClass={({ y, data }) => data?.vip ? 'bg-yellow-50' : ''}
  rowStyle={({ y, data }) => data?.disabled ? 'opacity: 0.5' : ''}
/>

// onRowClick：点击行时回调
<Intable
  columns={columns}
  data={data}
  onRowClick={(row, rowIndex, e) => console.log(row, rowIndex)}
/>
```

`TRProps` 类型为 `{ y?: number; data?: any; style?: any; children: JSX.Element }`，可从 `intable` 导入。

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

// 自定义缩进宽度（默认 16px）
<Intable columns={columns} data={data} rowKey='id' tree={{ indent: 20 }} />

// 显示缩进引导线
<Intable columns={columns} data={data} rowKey='id' tree={{ indentLine: true }} />
```

编程式控制展开/收起（通过 `store.commands.tree`）：

```tsx
let store
store.commands.tree.value           // 当前已展开的行对象数组（Row[]）
store.commands.tree.has(row)        // 判断某行是否已展开
store.commands.tree.add(row)        // 展开指定行
store.commands.tree.del(row)        // 收起指定行
store.commands.tree.toggle(row)     // 切换展开/收起
store.commands.tree.clear()         // 收起所有行
store.commands.tree.selectAll(data) // 展开所有行
store.commands.tree.isAll(data)     // 判断是否全部展开
```

树形展开本质是一个 `multiple` 选择器，`value` / `initialValue` / `onChange` 同样适用：

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
