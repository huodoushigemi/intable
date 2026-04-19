---
applyTo: "**/*.{tsx,ts,vue,jsx,js}"
---

# intable — AI 辅助使用指南

> 将此文件复制到你项目的 `.github/instructions/intable.instructions.md` 后，
> GitHub Copilot 会根据你的具体场景自动提供正确的 intable 用法建议。

---

## 包名与安装

| 框架 | 包名 | 安装 |
|---|---|---|
| SolidJS | `intable` | `pnpm add intable` |
| React | `@intable/react` | `pnpm add @intable/react` |
| Vue 3 | `@intable/vue` | `pnpm add @intable/vue` |

---

## 场景速查

根据用户描述的需求，匹配下面的场景，给出对应的完整代码。

---

### 场景 1：简单只读数据表格

> 关键词：展示数据、显示列表、不需要编辑

**SolidJS:**
```tsx
import { Intable } from 'intable'

const columns = [
  { id: 'name', name: '姓名', width: 120 },
  { id: 'age',  name: '年龄', width: 80  },
  { id: 'city', name: '城市', width: 120 },
]
const data = [
  { id: 1, name: 'Alice', age: 28, city: 'Beijing' },
  { id: 2, name: 'Bob',   age: 32, city: 'Shanghai' },
]

export default () => (
  <Intable
    class='h-400px'
    columns={columns}
    data={data}
    rowKey='id'
    border stickyHeader
  />
)
```

**React:**
```tsx
import { useState } from 'react'
import { Intable } from '@intable/react'

export default function App() {
  const [columns] = useState([
    { id: 'name', name: '姓名', width: 120 },
    { id: 'age',  name: '年龄', width: 80  },
  ])
  const [data] = useState([
    { id: 1, name: 'Alice', age: 28 },
  ])
  return <Intable style={{ width:'100%', height:'400px' }} columns={columns} data={data} rowKey='id' border stickyHeader />
}
```

**Vue 3:**
```vue
<template>
  <intable style="width:100%;height:400px" :columns="columns" :data="data" row-key="id" border sticky-header />
</template>
<script setup>
import { ref } from 'vue'
const columns = ref([{ id: 'name', name: '姓名' }, { id: 'age', name: '年龄' }])
const data = ref([{ id: 1, name: 'Alice', age: 28 }])
</script>
```

---

### 场景 2：可编辑表格（单元格编辑）

> 关键词：编辑、修改、输入、在线编辑、Excel 风格

编辑功能为内置，无需额外插件。双击单元格进入编辑，Enter 提交，Esc 取消。

`type` | `editor` 都可用来指定编辑器类型，通常情况下推荐使用 `type`，如果需要更细粒度的控制，可以使用 `editor` 明确指定编辑器组件。

```tsx
// columns 上加 editable: boolean | ((tdprops) => boolean) 来动态控制是否可编辑
const columns = [
  { id: 'name',   name: '姓名', width: 140, editable: true },                    // text（默认）
  { id: 'age',    name: '年龄', width: 80,  editable: true, editor: 'number' },  // 数字
  { id: 'joined', name: '入职', width: 140, editable: true, type: 'date' },    // 日期
  { id: 'dept',   name: '部门', width: 140, editable: true, enum: { eng: '工程', design: '设计', pm: '产品' } }, // 下拉
  { id: 'active', name: '在职', width: 80,  editable: true, type: 'checkbox' }, // 复选框
  { id: 'score',  name: '评分', width: 100, editable: true, type: 'range' },    // 滑块
  { id: 'color',  name: '颜色', width: 80,  editable: true, type: 'color' },    // 颜色
]
// React / Vue: 同样字段，框架用 useState / ref 包裹 columns 即可
```

新增行：使用 Symbol 生成唯一 ID，确保新行的 rowKey 不重复。 Symbol 在网络传输时会自动删除，因此无需手动处理。

```tsx
const [data, setData] = useState([])

<button onClick={() => setData(prev => [{ id: Symbol() }, ...prev])}>新增一行</button>
<Intable columns={columns} data={data} onDataChange={setData} rowKey='id' />
```
---

### 场景 3：数据校验

> 关键词：验证、校验、不能为空、格式校验

```tsx
import { ZodValidatorPlugin } from 'intable/plugins/ZodValidatorPlugin'
import { z } from 'zod'   // pnpm add zod

const columns = [
  { id: 'name',  name: '姓名', editable: true, zodSchema: z.string().min(1, '不能为空').max(50) },
  { id: 'age',   name: '年龄', editable: true, type: 'number', zodSchema: z.coerce.number().int().min(0).max(150) },
  { id: 'email', name: '邮箱', editable: true, zodSchema: z.string().email('请输入有效邮箱') },
]

let store
// 校验：await store.validate()

// SolidJS
<Intable store={e => store = e} columns={columns} data={data} plugins={[ZodValidatorPlugin]} />

// React
<Intable store={e => store = e} columns={columns} data={data} plugins={[ZodValidatorPlugin]} />

// Vue
<intable :store="e => store = e" :columns="columns" :data="data" :plugins="[ZodValidatorPlugin]" />
```

---

### 场景 4：大数据量 / 高性能（虚拟滚动）

> 关键词：10000 行、大量数据、卡顿、性能优化、虚拟列表

容器必须有固定高度。

```tsx
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

// SolidJS
const data = Array.from({ length: 10_000 }, (_, i) => ({ id: i, name: `Row ${i}` }))

<Intable
  class='h-600px'   // 必须固定高度
  columns={columns}
  data={data}
  plugins={[VirtualScrollPlugin]}
  border stickyHeader
/>

// React / Vue：plugins={[VirtualScrollPlugin]} 或 :plugins="[VirtualScrollPlugin]"
```

---

### 场景 5：列排序

> 关键词：排序、升序、降序、sort、点击表头排序

排序功能为内置，无需额外插件。在列上设置 `sortable: true` 即可，点击表头循环切换 升序→降序→取消。

```tsx
// SolidJS
const columns = [
  { id: 'name',   name: '姓名', width: 130, sortable: true },
  { id: 'age',    name: '年龄', width: 80,  sortable: true },
  { id: 'salary', name: '薪资', width: 100, sortable: true },
  { id: 'dept',   name: '部门', width: 130 },  // 不设 sortable，不可排序
]

// 基础：单列排序（默认）
<Intable columns={columns} data={data} />

// 多列排序
<Intable
  columns={columns} data={data}
  sort={{ multiple: true }}
/>

// 监听排序变化（如用于服务端排序）
<Intable
  columns={columns} data={data}
  sort={{
    autoSort: false,              // 关闭客户端排序
    onChange: sorts => fetchData(sorts),  // sorts: [{ field, order }][]
  }}
/>

// React / Vue：用法完全相同，框架用 useState/ref 包裹数据即可
```

| `sort` 选项 | 说明 | 默认 |
|---|---|---|
| `multiple` | 允许同时对多列排序 | `false` |
| `autoSort` | 客户端自动排序 | `true` |
| `onChange` | 排序键变化回调 `(sorts: SortKey[]) => void` | — |

---

### 场景 6：列筛选 / 搜索

> 关键词：筛选、过滤、搜索、filter、条件查询

```tsx
const columns = [
  { id: 'name', name: '姓名', type: 'text',   width: 140, filterable: true },
  { id: 'dept', name: '部门', type: 'enum',   width: 140, filterable: true, enum: { eng: '工程', design: '设计' } },
  { id: 'age',  name: '年龄', type: 'number', width: 100, filterable: true },
  { id: 'date', name: '日期', type: 'date',   width: 140, filterable: true },
]

// SolidJS
<Intable
  columns={columns} data={data}
  filter={{ autoMatch: true }}  // 客户端实时过滤
/>

// 后端过滤（autoMatch: false）
<Intable
  filter={{
    autoMatch: false,
    onChange: filters => fetchData(filters),  // filters 变化时请求接口
  }}
/>
```

每列 `type` 决定可用操作符：
- `text`: contains / eq / in / startwith / endwith / blank
- `number` / `date`: + lt / gt / between / not_between
- `enum` / `checkbox`: eq / in / blank

---

### 场景 7：撤销 / 重做（Ctrl+Z）

> 关键词：撤销、重做、undo、redo、历史记录

```tsx
import { HistoryPlugin } from 'intable/plugins/HistoryPlugin'

<Intable plugins={[HistoryPlugin]} ... />
// Ctrl+Z 撤销，Ctrl+Y 重做（Mac: Cmd+Z / Cmd+Shift+Z）
```

---

### 场景 8：变更比对 / 高亮修改

> 关键词：diff、比对、高亮变更、对比原始数据、提交修改

```tsx
import { DiffPlugin } from 'intable/plugins/DiffPlugin'

const originalData = structuredClone(rawData)   // 保存原始快照

<Intable
  plugins={[DiffPlugin]}
  diff={{
    data: originalData,      // 基准数据（不随编辑变化）
    onCommit: ({ added, changed, removed }) => {   // Ctrl+S 触发提交
      console.log({ added, changed, removed })
      submitToApi({ added, changed, removed })
    },
  }}
/>
// 修改过的单元格会高亮显示
```

---

### 场景 9：滚动到底部加载更多（无限加载）

> 关键词：分页、加载更多、infinite scroll、下拉加载、滚动加载

**React:**
```tsx
import { LoadMorePlugin } from 'intable/plugins/LoadMorePlugin'
import { useState } from 'react'

function InfiniteTable() {
  const [data, setData] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = async () => {
    setLoading(true)
    const res = await fetchPage({ offset: data.length })
    setData(prev => [...prev, ...res.rows])
    setHasMore(res.hasMore)
    setLoading(false)
  }

  return (
    <Intable
      style={{ width: '100%', height: '500px' }}
      data={data} columns={columns}
      plugins={[LoadMorePlugin]}
      loadMore={{
        enable: true, loading, hasMore,
        loadingText: '加载中…',
        noMoreText: '— 没有更多了 —',
        onLoadMore: loadMore,
      }}
    />
  )
}
```

**Vue 3:**
```vue
<script setup>
import { ref, computed } from 'vue'
import { LoadMorePlugin } from 'intable/plugins/LoadMorePlugin'
const data = ref(initialPage), loading = ref(false), total = ref(500)
const hasMore = computed(() => data.value.length < total.value)
const loadMore = async () => {
  loading.value = true
  const res = await fetchPage({ offset: data.value.length })
  data.value = [...data.value, ...res.rows]
  loading.value = false
}
</script>
<template>
  <intable :data="data" :columns="columns"
    :plugins="[LoadMorePlugin]"
    :load-more="{ enable: true, loading, hasMore, onLoadMore: loadMore,
                  loadingText: '加载中…', noMoreText: '没有更多了' }" />
</template>
```

---

### 场景 10：行选择 / 勾选行批量操作

> 关键词：勾选、行选择、多选、批量删除、批量操作

```tsx
// React
const [selected, setSelected] = useState([])

<Intable
  rowSelection={{ enable: true, multiple: true, onChange: setSelected }}
  ...
/>
<button disabled={!selected.length} onClick={() => batchDelete(selected)}>
  删除选中 ({selected.length})
</button>

// Vue
<intable :row-selection="{ enable: true, multiple: true, onChange: v => selected = v }" ... />
```

---

### 场景 11：行展开（展示详情）

> 关键词：展开、展开行、详情、折叠、accordion

```tsx
// SolidJS / React (JSX写法相同)
<Intable
  expand={{
    enable: true,
    render: ({ data }) => <pre>{JSON.stringify(data, null, 2)}</pre>,
  }}
  ...
/>

// Vue
<intable :expand="{ enable: true, render: ({ data }) => h('pre', JSON.stringify(data)) }" ... />
```

---

### 场景 12：树形数据（父子层级）

> 关键词：树形、树、父子、层级、children、子节点

```tsx
// 数据中包含 children 字段
const data = [
  { id: 1, name: '工程部', children: [
    { id: 2, name: '前端组', children: [
      { id: 3, name: 'Alice' },
    ]},
  ]},
]

// rowKey 必填
<Intable rowKey='id' tree={{ children: 'children' }} data={data} ... />
```

---

### 场景 13：行分组

> 关键词：分组、按部门分组、按类型分组、group by

```tsx
<Intable
  rowGroup={{ fields: ['dept', 'city'] }}   // 多级分组
  ...
/>
```

---

### 场景 14：列宽拖拽 / 列拖拽排序

> 关键词：调整列宽、拖拽、列排序、resize、drag

```tsx
<Intable
  resizable={{ col: { enable: true }, row: { enable: true } }}
  colDrag   // 拖拽排序列
  rowDrag   // 拖拽排序行
  onColumnsChange={setColumns}
  onDataChange={setData}
  ...
/>
```

---

### 场景 15：固定列

> 关键词：固定列、锁列、sticky、冻结

```tsx
const columns = [
  { id: 'name',    name: '姓名',  width: 120, fixed: 'left' },   // 左固定
  { id: 'action',  name: '操作',  width: 80,  fixed: 'right' },  // 右固定
  // ... 中间列正常滚动
]
```

---

### 场景 16：自定义单元格渲染

> 关键词：自定义显示、渲染、图片、链接、按钮、标签、badge

**SolidJS:**
```tsx
const columns = [
  {
    id: 'status', name: '状态', width: 100,
    render: ({ data }) => (
      <span class={`badge ${data.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
        {data.status === 'active' ? '在职' : '离职'}
      </span>
    ),
  },
]
```

**React:**
```tsx
import { Intable } from '@intable/react'

const StatusCell = ({ data }: any) => (
  <span className={data.active ? 'c-green' : 'c-gray'}>
    {data.active ? '在职' : '离职'}
  </span>
)
const columns = [{ id: 'status', name: '状态', render: StatusCell }]
```

**Vue:**
```ts
import { h } from 'vue'
const columns = ref([{
  id: 'status', name: '状态',
  render: ({ data }: any) => h('span', { class: data.active ? 'c-green' : 'c-gray' }, data.active ? '在职' : '离职'),
}])
```

---

### 场景 17：Ant Design 编辑器（React）

> 关键词：antd、ant design、Select、DatePicker 单元格编辑

```tsx
import { AntdPlugin } from '@intable/react/plugins/antd'
import 'antd/dist/reset.css'

<Intable plugins={[AntdPlugin]} ... />
// 支持 editor: 'select' | 'date' | 'time' | 'datetime' | 'rate' | 'switch' | 'color'
```

---

### 场景 18：Element Plus 编辑器（Vue）

> 关键词：element plus、el-select、el-date-picker 单元格编辑

```ts
import { ElementPlusPlugin } from '@intable/vue/plugins/element-plus'
import 'element-plus/dist/index.css'

// plugins: [ElementPlusPlugin]
// 支持 editor: 'select' | 'date' | 'time' | 'datetime' | 'rate' | 'switch' | 'color'
```

---

### 场景 19：全功能表格（编辑 + 筛选 + 历史 + 虚拟滚动）

> 关键词：完整功能、全功能、Excel-like

```tsx
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'
import { HistoryPlugin }       from 'intable/plugins/HistoryPlugin'
import { DiffPlugin }          from 'intable/plugins/DiffPlugin'
import { ZodValidatorPlugin }  from 'intable/plugins/ZodValidatorPlugin'
import { z } from 'zod'

const plugins = [VirtualScrollPlugin, HistoryPlugin, DiffPlugin, ZodValidatorPlugin]

const columns = [
  { id: 'name', name: '姓名', width: 140, editable: true, filterable: true, type: 'text', required: true, zodSchema: z.string().min(2, '姓名至少2个字符').max(50, '姓名最多50个字符'), validator: (value: string) => { const reserved = ['admin', 'root']; if (reserved.includes(value.toLowerCase())) throw new Error('姓名不能使用保留词'); } },
  { id: 'dept', name: '部门', width: 140, editable: true, filterable: true, enum: { eng: '工程', design: '设计' }, required: true },
  { id: 'salary', name: '薪资', width: 100, editable: true, filterable: true, type: 'number', required: true, zodSchema: z.coerce.number({ error: '请输入数字' }).min(3000, '薪资至少3000').max(50000, '薪资最多50000') },
  { id: 'email', name: '邮箱', width: 180, editable: true, filterable: true, required: true, zodSchema: z.string().email('邮箱格式不正确') },
  { id: 'age', name: '年龄', width: 80, editable: true, filterable: true, type: 'number', required: true, zodSchema: z.coerce.number({ error: '请输入数字' }).min(18, '年龄至少18岁').max(65, '年龄最多65岁') }
]

const originalSnap = structuredClone(rawData)

let store: any = null

const handleValidate = async () => {
  if (store) {
    try {
      await store.validate()
      alert('验证通过！')
    } catch (error) {
      console.error('验证失败:', error)
    }
  }
}

<div>
  <div class='flex justify-between items-center mb-2'>
    <p>全功能表格示例</p>
    <button onClick={handleValidate}>验证所有</button>
  </div>
  <Intable
    class='h-600px'
    store={s => store = s}
    columns={columns}  data={data}
    onColumnsChange={setColumns}  onDataChange={setData}
    rowKey='id' index border stickyHeader
    resizable={{ col: { enable: true } }} colDrag rowDrag
    plugins={plugins}
    filter={{ autoMatch: true }}
    diff={{ enable: true, data: originalSnap, onCommit: changes => submit(changes) }}
    validator={(value, data, col) => {
      // 表级别的验证
      if (String(value ?? '').includes('敏感词')) {
        throw new Error('不能包含敏感词')
      }
    }}
  />
</div>
```

---

### 场景 20：Excel 导出导入

> 关键词：导出、导入、Excel、xlsx、下载、上传

> 需要安装依赖：`pnpm add xlsx`

```tsx
// SolidJS
let store: any = null

const handleExport = async () => {
  await store.commands.exportExcel() // 下载 data.xlsx
}

const handleImport = async () => {
  const importedData = await store.commands.readExcel()
  console.log('Imported data:', importedData)
  // 处理导入的数据
  setData(importedData)
}

<div>
  <div class='flex gap-2 mb-2'>
    <button onClick={handleExport}>Export Excel</button>
    <button onClick={handleImport}>Import Excel</button>
  </div>
  <Intable
    store={s => store = s}
    columns={columns}
    data={data}
  />
</div>

// React
import { useState } from 'react'
const [store, setStore] = useState(null)

// 用法同上，store 通过 setStore 获取

// Vue
<template>
  <div>
    <div class='flex gap-2 mb-2'>
      <button @click="handleExport">Export Excel</button>
      <button @click="handleImport">Import Excel</button>
    </div>
    <intable :store="storeRef" :columns="columns" :data="data" />
  </div>
</template>
<script setup>
import { ref } from 'vue'
const storeRef = ref(null)

const handleExport = async () => {
  await storeRef.value.commands.exportExcel()
}

const handleImport = async () => {
  const importedData = await storeRef.value.commands.readExcel()
  console.log('Imported:', importedData)
  // 处理导入的数据
  data.value = importedData
}
</script>
```

**注意：**
- 导出时会自动过滤内部列（如索引、选择列等）
- 导入时会通过列名自动匹配数据
- 需要安装 `xlsx` 依赖：`pnpm add xlsx`

---

### 场景 21：列显隐控制

> 关键词：隐藏列、显示列、列切换、列选择器

无需额外插件，使用 `ColumnVisibilityPlugin` 即可。表格右上角会出现一个☰ 按鈕，点击弹出列切换面板。

```tsx
import { ColumnVisibilityPlugin } from 'intable/plugins/ColumnVisibilityPlugin'

// 实现所有列可隐藏
const columns = [
  { id: 'name',  name: '姓名',  width: 130 },
  { id: 'email', name: '邮箱',  width: 200 },
  { id: 'dept',  name: '部门',  width: 120 },
]

// SolidJS
<Intable
  columns={columns} data={data}
  plugins={[ColumnVisibilityPlugin]}
  columnVisibility={{
    defaultHidden: ['email'],   // 初始隐藏的列
    onChange: hidden => console.log('Hidden:', hidden),
  }}
/>

// React / Vue：用法相同
```

| `columnVisibility` 选项 | 说明 |
|---|---|
| `defaultHidden` | 初始隐藏的列 ID 数组 |
| `onChange` | 隐藏列变化回调 `(hiddenIds: string[]) => void` |

---

### 场景 22：汇总行（列统计）

> 关键词：汇总、总计、平均、求和、最大小值、计数、footer row、统计行

```tsx
const columns = [
  { id: 'name',   name: '姓名',   width: 140 },
  { id: 'age',    name: '年龄',   width: 80,  aggregate: 'avg'   },  // 平均
  { id: 'salary', name: '薪资',   width: 110, aggregate: 'sum'   },  // 求和
  { id: 'sales',  name: '销售额', width: 110, aggregate: 'max'   },  // 最大
  { id: 'score',  name: '评分',   width: 80,  aggregate: 'min'   },  // 最小
  { id: 'active', name: '状态',   width: 80,  aggregate: 'count' },  // 计数
  // 自定义汇总函数
  { id: 'bonus',  name: '奖金',   width: 100, aggregate: (values) => `共 $${values.reduce((s,v)=>s+v,0).toLocaleString()}` },
]

<Intable
  columns={columns} data={data}
  aggregate={{
    label: '合计',          // 汇总行第一列显示的标签
    formatter: (val, type) =>  // 格式化显示内容
      type === 'sum' ? `$${Number(val).toLocaleString()}` : val,
  }}
/>
```

| `aggregate` 列字段 | 说明 |
|---|---|
| `'sum'` | 各行求和（忽略 NaN） |
| `'avg'` | 平均小数点后两位 |
| `'min'` / `'max'` | 最小 / 最大小数字值 |
| `'count'` | 非空单元格数量 |
| `(values, col, data) => any` | 自定义函数 |

---

### 场景 23：Excel 填充（AutoFill）

> 关键词：拖拽填充、自动填充、序列生成、填充手柄、Excel 副加号

> **传入 `autoFill={true}` 开启。**

选中单元格后，选区右下角出现小方块填充手柄，支持四向拖拽和双击快速填充。

```tsx
const columns = [
  { id: 'rank',  name: '排名',   width: 70,  editable: true },
  { id: 'score', name: '分数',   width: 80,  editable: true },
  { id: 'date',  name: '日期',   width: 120, editable: true },
  { id: 'name',  name: '姓名',   width: 120, editable: true },
]

// 需要 onDataChange 来接收写入操作
const [data, setData] = createSignal([...])
<Intable columns={columns} data={data()} onDataChange={setData} autoFill={true} />
```

**填充规则**：
- 数字列：`[10, 20]` 拖两行 → `30, 40, 50…`（等差数列）；单个数字默认步长为 1
- 日期列：`['2024-01-01', '2024-01-08']` 拖两行 → `'2024-01-15', '2024-01-22'…`
- 其他列：循环复制源列内容
- 支持向上 / 向左拖拽（反向填充）
- 双击手柄：自动向下填充至相邻列最后一个非空行（Excel 双击行为）

---

### 场景 21：主题切换

> 关键词：主题、样式、风格、深色、dark、暗色、shadcn、material、stripe、github

内置主题通过导入对应 CSS 文件启用，作用于 `.data-table` 根元素。

| 主题 | 导入路径 | 适用场景 |
|---|---|---|
| `github` | `intable/theme/github.css` | 开发者工具、文档站 |
| `dark` | `intable/theme/dark.css` | 夜间模式、OLED 深色 |
| `material` | `intable/theme/material.css` | Material Design 风格 |
| `shadcn` | `intable/theme/shadcn.css` | SaaS 后台、shadcn/ui 配套 |
| `stripe` | `intable/theme/stripe.css` | 金融/电商数据表格 |
| `antd` | `intable/theme/antd.css` | Ant Design 项目（自动跟随 antd token） |
| `element-plus` | `intable/theme/element-plus.css` | Element Plus 项目（自动跟随 el token） |

```ts
// 在项目入口引入（main.ts / main.tsx / main.js）
import 'intable/theme/github.css'    // 选一个即可
```

同一页面有多个表格、需要不同主题时，可在容器上覆盖 CSS 变量：

```css
/* 仅对某个容器生效 */
.my-dark-section .data-table {
  --table-bg: #0d1117;
  --table-c:  #e6edf3;
  --table-b-c: #30363d;
  --table-header-bg: #161b22;
}
```

---

## 常用 TableColumn 字段速查

```ts
{ id, name, width, fixed, type, editable, editor, enum, filterable, sortable, sortComparator, aggregate, render, class, style }
// fixed: 'left' | 'right'
// type: 'text' | 'number' | 'date' | 'enum' | 'checkbox'
// editor: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'range' | 'color'
// sortable: true 可排序；sortComparator: (a, b) => number 自定义排序逻辑
// aggregate: 'sum' | 'avg' | 'min' | 'max' | 'count' | fn 列汇总
```

## 常用 TableProps 字段速查

```ts
{ columns, data, rowKey, onColumnsChange, onDataChange,
  index, border, stickyHeader, size,   // size: 'small' | 'default' | 'large'
  rowSelection, expand, tree, rowGroup,
  resizable, colDrag, rowDrag,
  sort,              // { multiple?, autoSort?, onChange? } — 列排序（内置）
  columnVisibility,  // { defaultHidden?, onChange? } — 列显隐
  aggregate,         // { label?, formatter? } — 汇总行（内置）
  autoFill,          // true | { enable? } — 开启填充手柄（内置，默认关闭）
  plugins, filter, diff, loadMore,
  editable, validator }
```

为保持代码简洁，columns 中的每列都只用一行代码定义，复杂的 validator 可单独定义。