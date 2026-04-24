# 单元格编辑 / 复制粘贴 / 选区 / 列宽 / 自动填充

## 单元格编辑（双击进入，Enter 提交，Esc 取消）

编辑器类型由列的 `type` / `enum` 控制，`editable` 可传函数实现条件编辑。

```tsx
const columns = [
  { id: 'name',   name: '姓名', width: 140, editable: true },                    // 文本（默认）
  { id: 'age',    name: '年龄', width: 80,  editable: true, type: 'number' },
  { id: 'joined', name: '入职', width: 140, editable: true, type: 'date' },
  { id: 'dept',   name: '部门', width: 140, editable: true, enum: { eng: '工程', design: '设计', pm: '产品' } },
  { id: 'active', name: '在职', width: 80,  editable: true, type: 'checkbox' },
  { id: 'score',  name: '评分', width: 100, editable: true, type: 'range' },
  { id: 'color',  name: '颜色', width: 80,  editable: true, type: 'color' },
  // 条件编辑：只有 dept=eng 的行可以编辑 salary
  { id: 'salary', name: '薪资', width: 100, editable: ({ data }) => data.dept === 'eng', type: 'number' },
]

<Intable columns={columns} data={data} onDataChange={setData} rowKey='id' />
```

可用 `type` 值：`'text'` | `'textarea'` | `'number'` | `'range'` | `'date'` | `'time'` | `'datetime'` | `'color'` | `'checkbox'` | `'select'`

## 新增 / 删除行

```tsx
// 新增行 — Symbol() 生成唯一临时 ID，提交服务端前删除 Symbol key
const [data, setData] = useState([])

<button onClick={() => setData(prev => [{ id: Symbol() }, ...prev])}>新增一行</button>
<button onClick={() => setData(prev => prev.filter((_, i) => !selectedIndexes.includes(i)))}>删除选中</button>
<Intable columns={columns} data={data} onDataChange={setData} rowKey='id' />
```

## 复制 / 粘贴（内置，默认开启）

Mod+C 复制选区，Mod+V 粘贴，无需额外配置：

```tsx
<Intable columns={columns} data={data} onDataChange={setData} />
```

编程调用：

```tsx
let store
store.commands.copy()
store.commands.paste()

<Intable store={s => store = s} columns={columns} data={data} onDataChange={setData} />
```

## 单元格选区（内置，默认开启）

鼠标拖拽或 Shift+方向键扩展选区，无需额外配置。读取当前选区行数据：

```tsx
let store
const rows = store.commands.getAreaRows()
```

## 列宽 / 行高调整（内置，默认开启）

拖拽列头边缘调整列宽，无需额外配置。监听列宽变化：

```tsx
<Intable columns={columns} onColumnsChange={setColumns} data={data} />
```

禁用特定列的调整：

```tsx
{ id: 'name', name: '姓名', resizable: false }
```

## 自动填充（内置，默认关闭）

类似 Excel 填充柄：选中区域后拖拽右下角向下/右填充；支持数字序列、日期序列自动推断。

```tsx
<Intable columns={columns} data={data} onDataChange={setData} autoFill />
```

---

## AntdPlugin — React 富编辑器（可选）

用 Ant Design 组件替换内置编辑器，获得 DatePicker、Select、ColorPicker 等完整 UI。

**安装依赖（antd 为业务项目自行安装的 peer dep）：**

```bash
pnpm add antd
```

**使用：**

```tsx
import { Intable } from '@intable/react'
import { AntdPlugin } from '@intable/react/plugins/antd'

const columns = [
  { id: 'name',     name: '姓名',   width: 140, editable: true },                          // text（默认）
  { id: 'age',      name: '年龄',   width: 80,  editable: true, editor: 'number' },
  { id: 'joined',   name: '入职',   width: 140, editable: true, editor: 'date' },
  { id: 'time',     name: '时间',   width: 120, editable: true, editor: 'time' },
  { id: 'deadline', name: '截止',   width: 180, editable: true, editor: 'datetime' },
  { id: 'color',    name: '颜色',   width: 80,  editable: true, editor: 'color' },
  { id: 'active',   name: '在职',   width: 80,  editable: true, editor: 'switch' },
  { id: 'checked',  name: '勾选',   width: 80,  editable: true, editor: 'checkbox' },
  { id: 'score',    name: '评分',   width: 100, editable: true, editor: 'rate' },
  // Select — enum 提供选项
  { id: 'dept',     name: '部门',   width: 140, editable: true, editor: 'select',
    enum: { eng: '工程', design: '设计', pm: '产品' } },
  // 多选 Select — editorProps 透传给 antd Select 组件
  { id: 'tags',     name: '标签',   width: 180, editable: true, editor: 'select',
    enum: { a: 'Tag A', b: 'Tag B', c: 'Tag C' },
    editorProps: { mode: 'multiple' } },
]

<Intable
  columns={columns}
  data={data}
  onDataChange={setData}
  rowKey='id'
  plugins={[AntdPlugin]}
/>
```

> `editor` 字段与 `type` 等效，用于指定编辑器类型；`editorProps` 中的属性会直接透传给底层 antd 组件。

**支持的 `editor` 类型：**
`'text'` | `'textarea'` | `'number'` | `'rate'` | `'switch'` | `'checkbox'` | `'color'` | `'select'` | `'date'` | `'time'` | `'datetime'`

---

## ElementPlusPlugin — Vue 3 富编辑器（可选）

用 Element Plus 组件替换内置编辑器。

**安装依赖：**

```bash
pnpm add element-plus
```

**使用：**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Intable } from '@intable/vue'
import { ElementPlusPlugin } from '@intable/vue/plugins/element-plus'

const columns = [
  { id: 'name',     name: '姓名', width: 140, editable: true },
  { id: 'age',      name: '年龄', width: 80,  editable: true, editor: 'number' },
  { id: 'joined',   name: '入职', width: 140, editable: true, editor: 'date' },
  { id: 'deadline', name: '截止', width: 180, editable: true, editor: 'datetime' },
  { id: 'color',    name: '颜色', width: 80,  editable: true, editor: 'color' },
  { id: 'active',   name: '在职', width: 80,  editable: true, editor: 'switch' },
  { id: 'score',    name: '评分', width: 100, editable: true, editor: 'rate' },
  { id: 'dept',     name: '部门', width: 140, editable: true, editor: 'select',
    enum: { eng: '工程', design: '设计', pm: '产品' } },
]

const data = ref([])
</script>

<template>
  <Intable
    :columns="columns"
    :data="data"
    @data-change="v => data = v"
    row-key="id"
    :plugins="[ElementPlusPlugin]"
  />
</template>
```

**支持的 `editor` 类型：**
`'text'` | `'number'` | `'rate'` | `'switch'` | `'checkbox'` | `'color'` | `'select'` | `'date'` | `'time'` | `'datetime'`
