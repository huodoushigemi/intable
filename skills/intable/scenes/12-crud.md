# 通用 CRUD 模板（React TSX）

**包含功能：** 新增 / 删除 / 编辑 / 校验 / 保存 / 刷新 · Diff 变更高亮 · Excel 导入/导出 · 自动填充

```sh
pnpm add intable @intable/react antd ahooks zod
```

```tsx
import { useState, useRef } from 'react'
import { Intable } from '@intable/react'
import type { TableStore } from 'intable'
import { DiffPlugin } from 'intable/plugins/DiffPlugin'
import { ZodValidatorPlugin } from 'intable/plugins/ZodValidatorPlugin'
import { z } from 'zod'
import { useReactive, useRequest } from 'ahooks'
import { Button, Space, Modal, message, Avatar, Tag, Pagination } from 'antd'
import { AntdPlugin } from '@intable/react/plugins/antd'

interface Row {
  id: number | symbol
  name: string
  dept: string
  salary: number
}

const columns = [
  { id: 'name',   name: '姓名', width: 140, editable: true, required: true },
  { id: 'dept',   name: '部门', width: 120, editable: true, enum: { eng: '工程', design: '设计', pm: '产品' } },
  { id: 'salary', name: '薪资', width: 120, editable: true, type: 'number', validator: (v) => { if (v < 0) throw new Error('薪资不能为负') } },
  { id: 'email', name: '邮箱', editable: true, zodSchema: z.string().email('请输入有效邮箱').or(z.literal('')) },
]

export default function CrudTable() {
  const [snapshot, setSnapshot] = useState<Row[]>([])  // diff 基准快照
  const storeRef = useRef<TableStore>()

  const query = useReactive({
    page: 1,
    pageSize: 20,
  })

  const listApi = useRequest(
    () => {
      return getList({
        page: query.page,
        pageSize: query.pageSize,
        filters: storeRef.current?.filter.value,  // 传递当前筛选条件
        sorts: storeRef.current?.sort.value,      // 传递当前排序条件
      }).then((res: any) => {
        const rows = (res.data?.list || [])
        setSnapshot(JSON.parse(JSON.stringify(rows)))  // 深拷贝一份作为对比基准
        return res?.data || { list: [], total: 0 }
      })
    },
    {
      refreshDeps: [query.page, query.pageSize],
      debounceWait: 300,
      onError: (err: any) => {
        message.error(err?.msg || err?.message || '获取列表失败')
      },
    },
  )

  // ── 新增空行（Symbol 作为临时 ID）
  function addRow() {
    pageApi.mutate((prev) => ({ ...prev, list: [{ id: Symbol() }, ...(prev?.list || [])] }))
  }

  // ── 删除选中行
  function deleteSelected() {
    const store = storeRef.current!
    pageApi.mutate((prev) => ({ ...prev, list: prev?.list.filter(r => !store.commands.rowSelector.has(r)) }))
    store.commands.rowSelector.clear()
  }

  // ── 保存：区分新增/修改/删除 → 并发请求 → 刷新
  async function save({ added, removed, changed }) {
    await storeRef.current!.validate()

    if (!added.length && !removed.length && !changed.length) {
      return message.info('没有变更需要保存')
    }

    await Modal.confirm({
      title: '确认保存当前变更？',
      content: (
        <div>
          {!!added.length && <p>新增 {added.length} 行</p>}
          {!!changed.length && <p>修改 {changed.length} 行</p>}
          {!!removed.length && <p>删除 {removed.length} 行</p>}
        </div>
      ),
      onOk: async () => {
        // 提交 api 以实际项目为准
        await Promise.all([
          ...added.map(r => createRow(r)),
          ...changed.map(r => updateRow(r)),
          ...removed.map(r => deleteRow(r)),
        ])
      }
    })

    await listApi.refresh()   // 重新拉取，获得服务端 ID 并更新 diff 基准
  }

  // ── Excel 导入
  async function importExcel() {
    const rows = await storeRef.current!.commands.readExcel()
    pageApi.mutate((prev) => ({ ...prev, list: [...rows.map(r => ({ ...r, id: r.id ?? Symbol() })), ...(prev?.list || [])] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={listApi.refresh}>刷新</Button>
        <Button onClick={addRow}>新增</Button>
        <Button onClick={deleteSelected}>删除选中</Button>
        <Button onClick={() => storeRef.current!.commands.diffCommit()}>保存</Button>
        <Button onClick={() => storeRef.current!.commands.exportExcel()}>导出 Excel</Button>
        <Button onClick={() => importExcel()}>导入 Excel</Button>
      </div>

      <Intable
        store={s => storeRef.current = s}
        columns={columns}
        data={listApi.data || []}
        onDataChange={list => pageApi.mutate(prev => ({ ...prev, list }))}
        rowKey='id'
        rowSelection={{ enable: true, multiple: true }}
        index border stickyHeader
        loading={listApi.loading}
        autoFill // 启用自动填充，类似 Excel 填充柄
        filter={{ autoMatch: false, onChange: () => listApi.refresh() }}  // 可选：启用筛选时自动刷新
        sort={{ autoSort: false, onChange: () => listApi.refresh() }}    // 可选：启用排序时自动刷新
        plugins={[DiffPlugin, ZodValidatorPlugin, AntdPlugin]}
        diff={{
          data: snapshot,
          onCommit: save,
        }}
        style={{ flex: 1 }}
      />

      <Pagination
        className='text-right justify-end'
        current={query.page}
        pageSize={query.pageSize}
        total={pageApi.data?.total}
        size='small'
        showSizeChanger
        showTotal={(total) => `共 ${total} 条`}
        onChange={(page, pageSize) => {
          query.page = page
          query.pageSize = pageSize
        }}
      />
    </div>
  )
}
```

---

## 关键模式速查

| 场景 | 方法 |
|------|------|
| 获取已选行（数组） | `store.commands.rowSelector.value`（`Row[]` 当 multiple=true） |
| 判断某行是否已选 | `store.commands.rowSelector.has(row)` |
| 清空选中 | `store.commands.rowSelector.clear()` |
| 提交变更 | `await store.commands.diffCommit()` - 回调触发 `diff.onCommit` |
| 提交前校验 | `await store.validate()` — 失败时抛出，单元格自动标红 |
| 清除校验状态 | `store.clearValidation()` |
| 更新 diff 基准 | 保存成功后重新 `listApi.refresh()`，覆盖 `snapshot` |
| 导出 Excel | `store.commands.exportExcel()` — 直接下载 |
| 获取 Excel Blob | `await store.commands.createExcel()` — 可上传服务器 |
| 导入 Excel | `await store.commands.readExcel()` — 返回行数组 |
| 自动填充 | `autoFill` prop，拖拽填充柄向下/向右填充 |

---

## 关键约束
- 为保持代码简洁，columns 中的每列都只用一行代码定义，复杂的 validator 验证函数可单独定义。