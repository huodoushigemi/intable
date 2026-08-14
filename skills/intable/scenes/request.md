# request 异步数据请求

`request` 是**内置功能**（非插件），传入 `request` 函数后，`data`、`loading`、`pagination` 自动由请求驱动，无需手动管理。

---

## 基本用法

```tsx
const columns = [
  { id: 'name', name: '姓名', width: 120 },
  { id: 'age',  name: '年龄', width: 80 },
]

<Intable
  class='h-60vh'
  columns={columns}
  rowKey='id'
  request={async (params) => {
    const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(params) })
    return res.json() // { data: [...], total: 100 }
  }}
/>
```

---

## params 参数

| 字段 | 类型 | 说明 |
|------|------|------|
| `params.filters` | `AndOrNode[]` | 筛选条件（树形结构，支持 and/or 嵌套） |
| `params.sorts` | `SortKey[]` | 排序配置 |
| `params.page` | `number` | 当前页码 |
| `params.pageSize` | `number` | 每页条数 |

> **自动触发：** filters / sorts / page / pageSize 任一变化时，自动重新请求（300ms 防抖）。

---

## store.request 访问

传入 `request` 后，`store.request` 暴露以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `store.request.data` | `{ data: any[], total: number }` | 请求返回的完整数据 |
| `store.request.loading` | `boolean` | 是否正在请求中 |
| `store.request.error` | `any` | 请求错误 |
| `store.request.mutate` | `Setter<any>` | 手动更新缓存数据（乐观更新） |
| `store.request.refresh` | `() => void` | 手动触发重新请求 |

```tsx
const storeRef = useRef()

// 手动刷新
storeRef.current.request.refresh()

// 乐观更新
storeRef.current.request.mutate(prev => ({
  ...prev,
  data: [...prev.data, newRow],
}))
```

---

## 与分页配合

`request` 模式下 `pagination.total` 自动取自请求返回的 `total`，无需手动传递：

```tsx
<Intable
  class='h-60vh'
  columns={columns}
  rowKey='id'
  pagination={{ enable: true, pageSize: 20 }}
  request={async (params) => {
    const res = await api.getUsers(params)
    return { data: res.data.list, total: res.data.total }
  }}
/>
```

---

## 与筛选/排序配合

筛选和排序参数自动传递给 `request`，无需手动桥接：

```tsx
const columns = [
  { id: 'name', name: '姓名', width: 120, filterable: true, sortable: true },
  { id: 'age',  name: '年龄', width: 80, filterable: true, sortable: true, type: 'number' },
]

<Intable
  class='h-60vh'
  columns={columns}
  rowKey='id'
  request={async (params) => {
    // params.filters 和 params.sorts 已自动包含筛选/排序状态
    return api.getUsers(params)
  }}
/>
```

---

## 与 store 联动示例

```tsx
import { useRef } from 'react'
import { Intable } from '@intable/react'
import type { TableStore } from 'intable'
import { Button } from 'antd'

export default function RequestDemo() {
  const storeRef = useRef<TableStore>()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => storeRef.current?.request?.refresh()}>刷新</Button>
        <Button
          onClick={() => {
            const store = storeRef.current
            if (store?.request) {
              // 乐观更新：在本地插入一行
              store.request.mutate(prev => ({
                ...prev,
                data: [{ id: Symbol(), name: '新用户', age: 20 }, ...prev.data],
                total: prev.total + 1,
              }))
            }
          }}
        >
          乐观新增
        </Button>
      </div>

      <Intable
        store={s => storeRef.current = s}
        class='h-60vh'
        columns={[
          { id: 'name', name: '姓名', width: 120, filterable: true, sortable: true },
          { id: 'age',  name: '年龄', width: 80, filterable: true, sortable: true, type: 'number' },
        ]}
        rowKey='id'
        pagination={{ enable: true, pageSize: 20 }}
        request={async (params) => {
          const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(params) })
          return res.json()
        }}
        border stickyHeader index
      />
    </div>
  )
}
```

---

## 服务端示例（Go + GORM）

`./example/querybuilder.go`

```golang
type UserQueryRequest struct {
  Filters  []querybuilder.Condition `json:"filters"`
  Sorts    []querybuilder.Sort     `json:"sorts"`
  Page     int                     `json:"page"`
  PageSize int                     `json:"pageSize"`
}

// handler
func ListUsers(c *gin.Context) {
  var req UserQueryRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    R(c).Fail(http.StatusBadRequest, err.Error())
    return
  }

  db := db.Model(&User{})

  // 通过反射自动生成字段映射
  fieldMap := querybuilder.BuildModelFields(User{})
  db, _ = querybuilder.ApplyFilters(db, req.Filters, fieldMap)
  db, _ = querybuilder.ApplySorts(db, req.Sorts, fieldMap)

  // 统计总数
  var total int64
  db.Count(&total)

  // 分页查询
  if req.Page < 1 { req.Page = 1 }
  if req.PageSize < 1 { req.PageSize = 10 }
  offset := (req.Page - 1) * req.PageSize

  var data []*User
  db.Offset(offset).Limit(req.PageSize).Find(&data)

  R(c).Ok(gin.H{
    "data":     data,
    "total":    total,
    "page":     req.Page,
    "pageSize": req.PageSize,
  })
}
```

---

## 关键约束

- 传入 `request` 后，`data` prop 由请求结果驱动，手动传入的 `data` 会被忽略
- 请求参数变化自动触发重新请求（300ms 防抖），无需手动监听