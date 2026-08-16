# 对象关系映射（ORM）

## 声明表格结构

使用对象定义表格结构，包含 `columns`、`rowKey` 和 `request`（异步数据请求函数）。

```tsx
const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120, editable: true },
    { id: 'age', name: '年龄', width: 80, editable: true, type: 'number' },
    { id: 'email', name: '邮箱', width: 180, editable: true },
    { id: 'active', name: '在职', width: 70, editable: true, type: 'checkbox' },
  ],
  rowKey: 'id',
  request: async (params) => {
    const data = await api.getUsers(params)
    return { data: data.list, total: data.total }
  }
}

<Intable class='h-60vh' {...userTable} />
```

---

## 关联类型

### 单选关联（`type: 'obj'`）

选择单个关联对象，值为对象本身。

```tsx
const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120 },
    { id: 'manager', name: '上级', width: 120, editable: true, type: 'obj', table: () => userTable },
  ],
  rowKey: 'id',
}

// 数据示例
{ id: 1, name: 'Alice', manager: { id: 4, name: 'David' } }
```

### 多选关联（`type: 'objs'`）

选择多个关联对象，值为对象数组。

```tsx
const roleTable = {
  columns: [
    { id: 'name', name: '角色名', editable: true },
    { id: 'desc', name: '描述', editable: true },
  ],
  rowKey: 'name',
}

const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120 },
    { id: 'roles', name: '角色', width: 200, editable: true, type: 'objs', table: () => roleTable },
  ],
  rowKey: 'id',
}

// 数据示例
{ id: 1, name: 'Alice', roles: [{ name: 'admin', desc: '管理员' }, { name: 'user', desc: '普通用户' }] }
```

### 外键单选（`type: 'fk'`）

只存储关联对象的 ID，值为 ID 本身。使用 `foreignField` 将外键对象回填到当前行中。

```tsx
const deptTable = {
  columns: [{ id: 'name', name: '部门名称', editable: true }],
  rowKey: 'id',
}

const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120 },
    { id: 'dept_id', name: '部门', width: 120, editable: true, type: 'fk', foreignField: 'dept', table: () => deptTable },
  ],
  rowKey: 'id',
}

// 数据示例
{ id: 1, name: 'Alice', dept_id: 1 }
// 回填后可访问 data.dept?.name
{ id: 'dept_id', name: '部门', width: 120, editable: true, type: 'fk', foreignField: 'dept', table: () => deptTable, render: o => o.data.dept?.name },
```

### 外键多选（`type: 'fks'`）

存储多个关联对象的 ID 数组。使用 `foreignField` 将外键对象数组回填到当前行中。

```tsx
const postTable = {
  columns: [
    { id: 'title', name: '标题', width: 200, editable: true },
    { id: 'content', name: '内容', width: 300, editable: true },
  ],
  rowKey: 'id',
}

const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120 },
    { id: 'post_ids', name: '文章', width: 200, editable: true, type: 'fks', foreignField: 'posts', table: () => postTable },
  ],
  rowKey: 'id',
}

// 数据示例
{ id: 1, name: 'Alice', post_ids: [1, 2, 3] }
// 回填后可访问 data.posts[0].title | data.posts[0].content
{ id: 'post_ids', name: '文章', width: 200, editable: true, type: 'fks', foreignField: 'posts', table: () => postTable, render: o => o.data.posts?.map(post => post.title).join(', ') },
```

---

## 完整示例

```tsx
import { Intable } from 'intable'

const deptTable = {
  columns: [{ id: 'name', name: '部门名称', editable: true }],
  rowKey: 'id',
  request: async (params) => {
    const data = [{ id: 1, name: 'IT' }, { id: 2, name: 'Devops' }, { id: 3, name: 'Test' }]
    return { data, total: data.length }
  }
}

const roleTable = {
  columns: [{ id: 'name', name: '角色名', editable: true }, { id: 'desc', name: '描述', editable: true }],
  rowKey: 'name',
  request: async (params) => {
    const data = [{ name: 'admin', desc: '管理员' }, { name: 'user', desc: '普通用户' }, { name: 'editor', desc: '编辑' }]
    return { data, total: data.length }
  }
}

const userTable = {
  columns: [
    { id: 'name', name: '姓名', width: 120, editable: true },
    { id: 'age', name: '年龄', width: 80, editable: true, type: 'number' },
    { id: 'email', name: '邮箱', width: 180, editable: true },
    { id: 'active', name: '在职', width: 70, editable: true, type: 'checkbox' },
    { id: 'manager', name: '上级', width: 120, editable: true, type: 'obj', table: () => userTable },
    { id: 'roles', name: '角色', width: 200, editable: true, type: 'objs', table: () => roleTable },
    { id: 'dept_id', name: '部门', width: 120, editable: true, type: 'fk', foreignField: 'dept', table: () => deptTable },
  ],
  rowKey: 'id',
  request: async (params) => {
    const data = [
      { id: 1, name: 'Alice', age: 30, email: 'alice@example.com', active: true, manager: { id: 4, name: 'David' }, roles: [{ name: 'admin', desc: '管理员' }], dept_id: 1 },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com', active: false, roles: [{ name: 'user', desc: '普通用户' }], dept_id: 2 },
    ]
    return { data, total: data.length }
  }
}

export default () => <Intable class='h-60vh' {...userTable} />
```

---

## 关联数据展示

### 默认展示（标签形式）

使用 `type: 'obj'` 或 `type: 'objs'` 时，自动以标签形式展示关联数据。

### 自定义展示

```tsx
const columns = [
  { id: 'name', name: '姓名', width: 120 },
  { id: 'dept', name: '部门', width: 200, render: ({ value }) => value?.name || '-' },
  { id: 'roles', name: '角色', width: 300, render: ({ value }) => <div class='flex gap-1'>{value?.map(r => <span class='badge'>{r.name}</span>)}</div> },
]
```

---

## 嵌套表格

在表格中嵌套子表格展示一对多关系。

```tsx
const columns = [
  { id: 'name', name: '部门', width: 140 },
  { id: 'employees', name: '员工', width: 400, render: ({ value }) => <Intable columns={[{ id: 'name', name: '姓名', width: 100 }, { id: 'role', name: '职位', width: 100 }]} data={value || []} size='small' border={false} /> },
]
```

---

## 关联数据校验

校验关联数据的完整性。

```tsx
const columns = [
  { id: 'name', name: '姓名', width: 120, editable: true, required: true },
  { id: 'dept_id', name: '部门', width: 120, editable: true, type: 'fk', table: () => deptTable, required: true },
  { id: 'roles', name: '角色', width: 200, editable: true, type: 'objs', table: () => roleTable, validator: (value) => { if (!value?.length) throw new Error('请至少选择一个角色'); if (value.length > 3) throw new Error('最多选择 3 个角色') } },
]
```

---

## 数据转换

将关联数据转换为 API 所需格式。

```tsx
// 提交时转换
const handleSubmit = (data) => {
  const payload = data.map(row => ({ ...row, manager_id: row.manager?.id, role_names: row.roles?.map(r => r.name) }))
  api.save(payload)
}

// 加载时转换
const loadData = async () => {
  const res = await api.list()
  const depts = await api.depts()
  const roles = await api.roles()
  return res.map(row => ({ ...row, dept: depts.find(d => d.id === row.dept_id), roles: row.role_names?.map(name => roles.find(r => r.name === name)) }))
}
```
