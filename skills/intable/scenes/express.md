# 计算列（valueGetter / valueSetter）

计算列（派生列），值由 `valueGetter` 函数动态计算，支持异步；可选 `valueSetter` 处理写入。**内置功能，无需引入插件。**

---

## 何时使用 valueGetter

`valueGetter` 会把结果定义为 `row[col.id]` 的 getter，派生值因此贯穿整个数据管道：

| 场景 | 选择 |
|------|------|
| 全名、小计、百分比等计算列 | `valueGetter` |
| 派生值需要排序 / 筛选 / 合计 / 导出 | `valueGetter`（`render` 不影响这些） |
| 按 id 异步查询名称等 | 异步 `valueGetter` |
| 派生列可编辑并写回源字段 | `valueGetter` + `valueSetter` |
| 只是想改颜色、图标、标签样式，值不变 | `render` / `type` / `enum`，见 [07-render.md](./07-render.md) |

判断口诀：**值变了用 `valueGetter`，只是长得不一样用 `render`。**

> **派生列的 `id` 建议加 `_` 前缀**（如 `_fullName`、`_total`）：`valueGetter` 会在每一行上以 `col.id` 定义 getter，若与原始字段同名会覆盖原值；加前缀还能让派生字段在遍历/序列化行数据时一眼可辨。
>
> 可编辑的派生列必须提供 `valueSetter`，否则编辑结果无处写入。

---

## valueGetter — 计算列值

列的值由函数动态返回，支持同步和异步：

```tsx
const columns = [
  { id: 'firstName', name: '姓', width: 100 },
  { id: 'lastName', name: '名', width: 100 },
  {
    id: '_fullName',
    name: '全名',
    width: 150,
    valueGetter: ({ data }) => `${data.firstName} ${data.lastName}`,
  },
]

<Intable columns={columns} data={data} rowKey='id' />
```

> 注意 `id` 是 `_fullName` 而不是 `fullName`：派生 getter 挂在 `row[col.id]` 上，加 `_` 前缀可避免和原始字段冲突。

### valueGetter 参数

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `any` | 当前行数据 |
| `col` | `TableColumn` | 当前列定义 |

---

## 异步 valueGetter

`valueGetter` 支持异步，返回值自动等待：

```tsx
const columns = [
  { id: 'userId', name: '用户ID', width: 100 },
  {
    id: '_userName',
    name: '用户名',
    width: 150,
    valueGetter: async ({ data }) => {
      const res = await fetch(`/api/users/${data.userId}`)
      const user = await res.json()
      return user.name
    },
  },
]
```

---

## valueSetter — 处理写入

配合 `editable: true` 使用，自定义值写入逻辑：

```tsx
const columns = [
  { id: 'firstName', name: '姓', width: 100, editable: true },
  { id: 'lastName', name: '名', width: 100, editable: true },
  {
    id: '_fullName',
    name: '全名',
    width: 150,
    editable: true,
    valueGetter: ({ data }) => `${data.firstName} ${data.lastName}`,
    valueSetter: ({ data, value }) => {
      const [first, last] = value.split(' ')
      data.firstName = first || ''
      data.lastName = last || ''
    },
  },
]
```

### valueSetter 参数

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `any` | 当前行数据（可直接修改） |
| `col` | `TableColumn` | 当前列定义 |
| `value` | `any` | 当前输入新值 |

---

## 完整示例

```tsx
import { Intable } from '@intable/react'

const columns = [
  { id: 'price', name: '单价', width: 100, editable: true, type: 'number' },
  { id: 'quantity', name: '数量', width: 100, editable: true, type: 'number' },
  {
    id: '_total',
    name: '小计',
    width: 120,
    valueGetter: ({ data }) => (data.price || 0) * (data.quantity || 0),
  },
]

const data = [
  { id: 1, price: 10, quantity: 3 },
  { id: 2, price: 20, quantity: 5 },
]

<Intable columns={columns} data={data} rowKey='id' border />
```

---

## 关键约束

- `valueGetter` 在每次渲染时自动执行，依赖变化时重新计算
- 异步 `valueGetter` 会显示为 loading 状态直到返回结果
- `valueSetter` 中直接修改 `data` 对象即可，无需返回值
