
# Intable

> SolidJS-based Excel-like table component — supports React & Vue via thin wrappers.

[![npm](https://img.shields.io/npm/v/intable)](https://www.npmjs.com/package/intable)
[![license](https://img.shields.io/github/license/huodoushigemi/intable)](LICENSE)

---

## 特征

- **插件架构** — 责任链 `rewriteProps` 管道，功能完全可组合、可替换
- **多框架** — 同一套插件 API 在 SolidJS / React / Vue 3 下通用
- **虚拟滚动** — 行/列双向虚拟滚动，百万行流畅（`VirtualScrollPlugin`）
- **单元格编辑** — `editable: true` + `editor` 字段，开箱即用，支持 text / number / date / select / checkbox / range / color
- **列排序** — 内置 `SortPlugin`，点击表头循环切换升序/降序/取消，支持多列排序
- **列筛选** — `FilterPlugin` 支持 text / number / date / enum 类型操作符
- **列显隐** — `ColumnVisibilityPlugin`，☰ 按钮控制每列可见性，支持 `defaultHidden` 初始配置
- **汇总行** — `AggregatePlugin`，每列独立配置 sum / avg / min / max / count，支持自定义函数和格式化
- **Excel 填充** — `AutoFillPlugin`，拖拽选区右下角小方块，自动推断数字/日期等差序列
- **撤销/重做** — `HistoryPlugin` 完整撤销/重做栈（Ctrl+Z / Ctrl+Y）
- **Excel 复制粘贴** — 多单元格选区 TSV 复制粘贴，兼容 Excel / 飞书
- **数据校验** — `ZodValidatorPlugin` 集成 Zod schema 校验
- **Excel 导出/导入** — `ImportExportPlugin`（依赖 `xlsx`）
- **变更比对** — `DiffPlugin` 高亮未提交修改，Ctrl+S 触发提交

---

## 相比传统表格解决了什么痛点

| 痛点 | el-table / ant-table | intable |
|---|---|---|
| 大数据量卡顿 | 全量渲染，1000 行即明显卡顿 | 行/列双向虚拟滚动，百万行流畅 |
| 单元格编辑难扩展 | 需要自行封装 `template` / `render`，与表格强耦合 | `editable: true` + `editor` 字段开箱即用，可自定义编辑器 |
| 功能越加越重 | 所有功能内置，无论用不用都打包进来 | 插件化拆分，按需 `import`，用什么装什么 |
| 复制粘贴体验差 | 不支持多单元格选区复制 | 原生类 Excel 选区 + TSV 复制粘贴，兼容 Excel / 飞书 |
| 排序体验弱 | 需手动维护排序状态，重置繁琐 | 内置 `SortPlugin`，点击表头循环排序，支持多列 |
| 撤销/重做缺失 | 几乎没有内置支持 | `HistoryPlugin` 内置完整撤销/重做栈 |
| 跨框架复用困难 | 绑定单一框架 | 同一套插件 API 在 SolidJS / React / Vue 下通用 |
| 插件/扩展机制弱 | 多数功能靠 slot/事件临时拼凑 | 责任链 `rewriteProps` 管道，插件完全可组合、可替换 |

---

## 为什么使用 Intable

- **按需加载**：每个功能都是独立插件，未使用的功能不会打包进产物
- **插件可组合**：插件之间通过责任链管道协作，顺序可控、互不干扰
- **编辑场景**：内置 text / number / date / select / checkbox / range / color 编辑器，支持 Ant Design、Element Plus 扩展
- **低扩展成本**：自定义插件只需实现 `Plugin` 接口，声明式模块扩展
- **跨框架**：React 和 Vue 包装层极薄，所有插件在三个框架下完全通用
- **Copilot 集成**：提供 `.instructions.md` 场景速查文件，让 GitHub Copilot 自动给出正确用法建议

---

## 安装

```bash
# SolidJS
pnpm add intable

# React
pnpm add @intable/react

# Vue 3
pnpm add @intable/vue
```

---

## 快速开始

**SolidJS:**
```tsx
import { Intable } from 'intable'
import 'intable/style.css'

const columns = [
  { id: 'name', name: '姓名', width: 120 },
  { id: 'age',  name: '年龄', width: 80  },
]
const data = [
  { id: 1, name: 'Alice', age: 28 },
  { id: 2, name: 'Bob',   age: 32 },
]

export default () => (
  <Intable class='w-full h-400px' columns={columns} data={data} rowKey='id' border stickyHeader />
)
```

**React:**
```tsx
import { Intable } from '@intable/react'
import '@intable/react/style.css'

export default function App() {
  return (
    <Intable
      style={{ width: '100%', height: '400px' }}
      columns={[{ id: 'name', name: '姓名' }, { id: 'age', name: '年龄' }]}
      data={[{ id: 1, name: 'Alice', age: 28 }]}
      rowKey='id' border stickyHeader
    />
  )
}
```

**Vue 3:**
```vue
<template>
  <intable style="width:100%;height:400px" :columns="columns" :data="data" row-key="id" border sticky-header />
</template>
<script setup>
import { ref } from 'vue'
import { Intable } from '@intable/vue'
import '@intable/vue/style.css'
const columns = ref([{ id: 'name', name: '姓名' }, { id: 'age', name: '年龄' }])
const data = ref([{ id: 1, name: 'Alice', age: 28 }])
</script>
```

---

## 常用 Props

| Prop | 类型 | 说明 |
|---|---|---|
| `columns` | `TableColumn[]` | 列定义 |
| `data` | `any[]` | 数据 |
| `rowKey` | `string` | 行唯一键字段名 |
| `index` | `boolean` | 显示行号列 |
| `border` | `boolean` | 显示边框 |
| `stickyHeader` | `boolean` | 固定表头 |
| `size` | `'small' \| 'default' \| 'large'` | 尺寸 |
| `sort` | `{ multiple?, autoSort?, onChange? }` | 排序配置（内置） |
| `filter` | `{ autoMatch?, onChange? }` | 筛选配置（需 `FilterPlugin`） |
| `rowSelection` | `{ enable, multiple?, onChange }` | 行选择 |
| `expand` | `{ enable, render }` | 行展开 |
| `tree` | `{ children }` | 树形数据 |
| `rowGroup` | `{ fields }` | 行分组 |
| `resizable` | `{ col?, row? }` | 拖拽调整列/行宽 |
| `colDrag` / `rowDrag` | `boolean` | 拖拽排序列/行 |
| `plugins` | `Plugin[]` | 扩展插件 |

### TableColumn 常用字段

| 字段 | 说明 |
|---|---|
| `id` | 字段名（必填） |
| `name` | 列标题 |
| `width` | 列宽（px） |
| `fixed` | `'left' \| 'right'` 固定列 |
| `sortable` | `true` 启用该列排序 |
| `sortComparator` | `(a, b) => number` 自定义排序逻辑 |
| `editable` | `true` 启用编辑 |
| `editor` | `'text' \| 'number' \| 'date' \| 'select' \| 'checkbox' \| 'range' \| 'color'` |
| `filterable` | `true` 启用筛选（需 `FilterPlugin`） |
| `type` | `'text' \| 'number' \| 'date' \| 'enum' \| 'checkbox'` 数据类型（影响筛选操作符） |
| `render` | `({ data, value }) => JSX` 自定义渲染 |
| `class` / `style` | 列样式 |

---

## 插件总览

| 插件 | 说明 | 是否内置 |
|---|---|---|
| `SortPlugin` | 点击表头排序，支持多列 | ✅ 内置 |
| `ColumnVisibilityPlugin` | ☰ 按钮切换列显隐，支持默认隐藏配置 | 按需引入 |
| `AggregatePlugin` | 汇总行：sum / avg / min / max / count / 自定义函数 | ✅ 内置 |
| `AutoFillPlugin` | 拖拽填充手柄，自动推断数字/日期等差序列 | ✅ 内置 |
| `FilterPlugin` | 列筛选，支持多种操作符 | ✅ 内置 |
| `VirtualScrollPlugin` | 虚拟滚动，支持大数据量 | 按需引入 |
| `HistoryPlugin` | 撤销/重做（Ctrl+Z / Ctrl+Y） | 按需引入 |
| `DiffPlugin` | 变更高亮 + Ctrl+S 提交 | 按需引入 |
| `ZodValidatorPlugin` | Zod schema 数据校验 | 按需引入 |
| `ImportExportPlugin` | Excel 导出/导入 | ✅ 内置 |
| `LoadMorePlugin` | 滚动到底加载更多 | 按需引入 |
| `ResizePlugin` | 拖拽调整列宽/行高 | ✅ 内置 |
| `DragPlugin` | 拖拽排序列/行 | ✅ 内置 |
| `RowSelectionPlugin` | 行勾选（多选/单选） | ✅ 内置 |
| `ExpandPlugin` | 行展开详情 | ✅ 内置 |
| `CellSelectionPlugin` | 单元格选区（Excel 风格） | ✅ 内置 |
| `ClipboardPlugin` | TSV 复制粘贴 | ✅ 内置 |
| `CellMergePlugin` | 单元格合并 | ✅ 内置 |
| `RowGroupPlugin` | 行分组 | ✅ 内置 |
| `TreePlugin` | 树形数据展示 | ✅ 内置 |
| `EditablePlugin` | 单元格编辑框架 | ✅ 内置 |

---

## GitHub Copilot 智能提示（Copilot Skills）

在你的项目中加入 intable 的 Copilot instruction 文件后，GitHub Copilot 会自动识别你的使用场景（如"我想加筛选"、"数据量很大"），并给出正确的 intable 代码建议。

### 快速安装（单文件，推荐）

```bash
mkdir -p .github/instructions
curl -o .github/instructions/intable.instructions.md \
  https://raw.githubusercontent.com/huodoushigemi/intable/main/.github/instructions/intable-scenarios.instructions.md
```

> **效果**：安装后，当你描述需求（如"加一个大数据量的可编辑表格"），Copilot 会自动引用 intable 的正确 API 和插件，无需反复查文档。

---

## License

MIT
