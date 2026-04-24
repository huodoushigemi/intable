# 数据校验

## 内置校验（无需插件）

在列上加 `required` 或 `validator`，提交前调用 `store.validate()`。

```tsx
const columns = [
  { id: 'name',  name: '姓名', editable: true, required: true },
  { id: 'email', name: '邮箱', editable: true,
    validator: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        throw new Error('请输入有效邮箱')
    },
  },
  { id: 'age',   name: '年龄', editable: true, type: 'number',
    validator: (value) => {
      if (value != null && (value < 0 || value > 150))
        throw new Error('年龄范围 0-150')
    },
  },
]

let store

// 触发全表校验（有错误时单元格标红，抛出错误）
try {
  await store.validate()
  // 校验通过，提交数据
} catch (e) {
  console.error('校验失败', e)
}

// 清除所有校验状态
store.clearValidation()

// 读取错误信息
store.cellValidationErrors  // { [rowKey]: { [colId]: string | null } }

<Intable store={s => store = s} columns={columns} data={data} rowKey='id' />
```

表格级全局 `validator`（对所有单元格生效）：

```tsx
<Intable
  columns={columns}
  data={data}
  validator={(value, row, col) => {
    if (col.id === 'salary' && row.dept !== 'eng' && value > 50000)
      throw new Error('非工程部门薪资不能超过 50000')
  }}
/>
```

---

## Zod 校验（可选插件）

```bash
pnpm add zod
```

```tsx
import { ZodValidatorPlugin } from 'intable/plugins/ZodValidatorPlugin'
import { z } from 'zod'

const columns = [
  { id: 'name',  name: '姓名', editable: true, zodSchema: z.string().min(1, '不能为空').max(50) },
  { id: 'age',   name: '年龄', editable: true, type: 'number', zodSchema: z.number().int().min(0).max(150) },
  { id: 'email', name: '邮箱', editable: true, zodSchema: z.string().email('请输入有效邮箱').or(z.literal('')) },
]

let store
// 触发校验
await store.validate()

<Intable
  store={s => store = s}
  columns={columns}
  data={data}
  rowKey='id'
  plugins={[ZodValidatorPlugin]}
/>
```

> 内置校验和 ZodValidatorPlugin 可以共存，ZodValidatorPlugin 优先级更高。
