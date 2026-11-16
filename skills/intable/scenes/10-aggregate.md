# 合计行（Aggregate）

无需额外插件。在列上设置 `aggregate` 字段，表格底部自动显示合计行。

## 基础用法

```tsx
const columns = [
  { id: 'name',   name: '姓名',   width: 120 },
  { id: 'sales',  name: '销售额', width: 100, aggregate: 'sum'   },
  { id: 'count',  name: '订单数', width: 80,  aggregate: 'count' },
  { id: 'score',  name: '评分',   width: 80,  aggregate: 'avg'   },
  { id: 'profit', name: '利润',   width: 100, aggregate: 'max'   },
  { id: 'cost',   name: '成本',   width: 100, aggregate: 'min'   },
]

<Intable columns={columns} data={data} />
```

`aggregate` 可选值：`'sum'` | `'avg'` | `'count'` | `'min'` | `'max'`

## 自定义聚合函数

```tsx
{ id: 'ratio', name: '达成率', width: 100,
  aggregate: (values, col, allData) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return `${(avg * 100).toFixed(1)}%`
  },
}
```

## 分组行聚合（rowGroup）

同时开启 `rowGroup` 时，每个分组行的 `aggregate` 列会显示**该分组下叶子行**的聚合值（折叠时也显示）：

```tsx
<Intable
  columns={[
    { id: 'name',     name: '名称', width: 120 },
    { id: 'category', name: '分类', width: 120 },
    { id: 'value',    name: '金额', width: 100, aggregate: 'sum' },
    { id: 'orders',   name: '订单数', width: 90, aggregate: 'count' },
  ]}
  data={data}
  rowGroup={{ fields: ['category'] }}
/>
```

## 数值格式化

```tsx
<Intable
  columns={columns}
  data={data}
  aggregate={{
    formatter: (value, type, col) => {
      if (col.id === 'sales')  return `¥${Number(value).toLocaleString()}`
      if (col.id === 'score')  return `${value} 分`
      return value
    },
  }}
/>
```

非聚合列在合计行中留空，不显示额外标签。
