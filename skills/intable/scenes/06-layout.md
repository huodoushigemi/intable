# 固定列 / 多级表头 / 列拖拽

## 固定列（内置）

在列定义上加 `fixed: 'left'` 或 `fixed: 'right'`，无需额外配置。

```tsx
const columns = [
  { id: 'name',   name: '姓名', width: 120, fixed: 'left'  },
  { id: 'age',    name: '年龄', width: 80   },
  { id: 'city',   name: '城市', width: 120  },
  { id: 'salary', name: '薪资', width: 100  },
  { id: 'dept',   name: '部门', width: 120  },
  { id: 'action', name: '操作', width: 80,  fixed: 'right' },
]

<Intable class='h-400px' columns={columns} data={data} border stickyHeader />
```

---

## 多级表头（内置）

列定义中嵌套 `children` 字段，无需额外配置。注意：叶子列才能有 `width`/`editable` 等字段。

```tsx
const columns = [
  { id: 'name', name: '姓名', width: 120, fixed: 'left' },
  {
    id: 'basic', name: '基本信息', children: [
      { id: 'age',  name: '年龄', width: 80  },
      { id: 'city', name: '城市', width: 120 },
    ],
  },
  {
    id: 'work', name: '工作信息', children: [
      { id: 'dept',   name: '部门', width: 120 },
      { id: 'salary', name: '薪资', width: 100 },
    ],
  },
]

<Intable columns={columns} data={data} stickyHeader />
```

---

## 列拖拽排序（内置，默认关闭）

需先通过单元格选区选中整列（点击列头），再长按拖拽。

```tsx
<Intable
  columns={columns}
  onColumnsChange={setColumns}
  data={data}
  colDrag
/>
```
