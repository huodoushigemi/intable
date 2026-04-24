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

## 自定义标签和数值格式化

```tsx
<Intable
  columns={columns}
  data={data}
  aggregate={{
    label: '合计',    // 第一用户列显示的标签，默认 'Σ'
    formatter: (value, type, col) => {
      if (col.id === 'sales')  return `¥${Number(value).toLocaleString()}`
      if (col.id === 'score')  return `${value} 分`
      return value
    },
  }}
/>
```
