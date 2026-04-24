# 列排序 / 列筛选

## 列排序（内置）

在列上加 `sortable: true`，点击列头循环切换：升序 → 降序 → 取消。

```tsx
const columns = [
  { id: 'name',   name: '姓名', width: 130, sortable: true },
  { id: 'age',    name: '年龄', width: 80,  sortable: true },
  { id: 'salary', name: '薪资', width: 100, sortable: true,
    sortComparator: (a, b) => a - b },  // 自定义比较函数（可选）
]

// 基础（客户端自动排序）
<Intable columns={columns} data={data} sort={{ multiple: true }} />

// 服务端排序
<Intable
  columns={columns}
  data={data}
  sort={{
    autoSort: false,
    onChange: (sorts) => fetchData(sorts),  // sorts: [{ field, order: 'asc'|'desc' }]
  }}
/>

// 受控排序
const [sort, setSort] = useState([{ field: 'age', order: 'asc' }])
<Intable columns={columns} data={data} sort={{ value: sort, onChange: setSort }} />
```

| `sort` 选项 | 说明 | 默认 |
|---|---|---|
| `multiple` | 允许多列同时排序 | `false` |
| `autoSort` | 客户端自动排序 | `true` |
| `onChange` | 回调 `(sorts: SortKey[]) => void` | — |
| `value` / `defaultValue` / `initialValue` | 受控 / 非受控 / 初始值 | — |

---

## 列筛选（内置）

在列上加 `filterable: true`，并传 `filter` prop。

```tsx
const columns = [
  { id: 'name', name: '姓名', type: 'text',   width: 140, filterable: true },
  { id: 'dept', name: '部门', type: 'enum',   width: 140, filterable: true,
    enum: { eng: '工程', design: '设计', pm: '产品' } },
  { id: 'age',  name: '年龄', type: 'number', width: 100, filterable: true },
  { id: 'date', name: '日期', type: 'date',   width: 140, filterable: true },
]

// 客户端实时过滤
<Intable columns={columns} data={data} filter={{ autoMatch: true }} />

// 服务端过滤
<Intable
  columns={columns}
  data={data}
  filter={{
    autoMatch: false,
    onChange: (filters) => fetchData(filters),
  }}
/>
```

各列 `type` 对应可用操作符：
- `text` / `textarea`：contains、eq、in、startswith、endswith、blank
- `number` / `date`：追加 lt、gt、between、not_between
- `enum` / `checkbox`：eq、in、blank
