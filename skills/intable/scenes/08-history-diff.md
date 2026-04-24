# 撤销/重做 / Diff 变更高亮

## 撤销/重做（可选插件）

```tsx
import { HistoryPlugin } from 'intable/plugins/HistoryPlugin'

let store
// 默认快捷键：Mod+Z（撤销）、Mod+Shift+Z（重做）
// 编程调用：
store.history.undo()
store.history.redo()
store.history.canUndo()   // boolean
store.history.canRedo()   // boolean

<Intable
  store={s => store = s}
  columns={columns}
  data={data}
  rowKey='id'
  onDataChange={setData}
  plugins={[HistoryPlugin]}
/>
```

---

## Diff 变更高亮（可选插件）

`diff.data` 传入原始快照，自动高亮差异：新增行绿色、删除行红色、变更行黄色。

```tsx
import { DiffPlugin } from 'intable/plugins/DiffPlugin'

const [originalData] = useState(() => [...initialData])  // 保存初始快照

let store
// 提交变更到服务端并重置 diff
await store.commands.diffCommit()

<Intable
  store={s => store = s}
  columns={columns}
  data={currentData}
  rowKey='id'
  plugins={[DiffPlugin]}
  diff={{
    data: originalData,      // 原始快照（对比基准）
    onCommit: ({ added, removed, changed }) => {
      // diffCommit() 触发后调用，可在此同步到服务端
      console.log('新增:', added, '删除:', removed, '变更:', changed)
    },
  }}
/>
```

## 组合使用

HistoryPlugin + DiffPlugin 可以一起使用：

```tsx
import { HistoryPlugin } from 'intable/plugins/HistoryPlugin'
import { DiffPlugin    } from 'intable/plugins/DiffPlugin'

<Intable
  columns={columns}
  data={data}
  onDataChange={setData}
  plugins={[HistoryPlugin, DiffPlugin]}
  diff={{ data: originalData }}
/>
```
