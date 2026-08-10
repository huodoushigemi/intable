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
  { id: 'name', name: '姓名',                 width: 140, filterable: true },
  { id: 'dept', name: '部门',                 width: 140, filterable: true, enum: { eng: '工程', design: '设计', pm: '产品' } },
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

| 操作符 | 说明 | text | number | date | enum | checkbox |
|---|---|---|---|---|---|---|
| `contains` | 包含 | ✅ | — | — | — | — |
| `eq` | 等于 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ne` | 不等于 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lt` | 小于 / 早于 | — | ✅ | ✅ | — | — |
| `gt` | 大于 / 晚于 | — | ✅ | ✅ | — | — |
| `lte` | 小于等于 / 不晚于 | — | ✅ | ✅ | — | — |
| `gte` | 大于等于 / 不早于 | — | ✅ | ✅ | — | — |
| `between` | 介于 | — | ✅ | ✅ | — | — |
| `not_between` | 不介于 | — | ✅ | ✅ | — | — |
| `in` | 在列表中 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `not_in` | 不在列表中 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `startwith` | 开头是 | ✅ | — | — | — | — |
| `endwith` | 结尾是 | ✅ | — | — | — | — |
| `blank` | 为空 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `noblank` | 不为空 | ✅ | ✅ | ✅ | ✅ | ✅ |

### `filters` 结构（`onChange` 回调参数）

`onChange` 接收 `AndOrNode[]`，每个元素是 `GroupNode` 或 `RuleNode`：

```ts
type AndOrNode = GroupNode | RuleNode
```

**GroupNode** — 逻辑分组，支持嵌套 AND/OR：

```ts
type GroupNode = {
  op?: 'and' | 'or'         // 逻辑运算符，默认 'and'
  children?: AndOrNode[]    // 子节点（RuleNode 或 嵌套 GroupNode）
}
```

**RuleNode** — 单个筛选条件：

```ts
type RuleNode = {
  field: string  // 列 id
  op: string     // 操作符，见上表
  value: any     // 筛选值
}
```

**示例** — `(姓名包含"张" AND 年龄>25) OR 部门=设计`：

```ts
const filters: AndOrNode[] = [
  {
    op: 'or',
    children: [
      {
        op: 'and',
        children: [
          { field: 'name', op: 'contains', value: '张' },
          { field: 'age',  op: 'gt',       value: 25 },
        ],
      },
      { field: 'dept', op: 'eq', value: 'design' },
    ],
  },
]
```
