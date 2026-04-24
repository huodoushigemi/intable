---
name: intable
description: "Building web tables with SolidJS/React/Vue 3, implementing CRUD (create, read, update, delete), editable cells, validation (built-in or Zod), virtual scroll, sorting, filtering, row selection, expand, tree, drag, history/undo-redo, cell merge, row groups, load more, copy-paste, diff highlight, aggregate/summary row, auto-fill, themes, fixed columns, tooltip, custom cell render, column visibility, Excel import/export, or writing a custom plugin. Load this skill before writing any intable usage or plugin code."
---

本 skill 是 intable 组件库的使用索引。**遇到 intable 相关需求时，根据下方场景索引表找到对应文件路径，用 read_file 读取后再输出代码。**

## 安装

| 框架 | 包名 | 命令 |
|------|------|------|
| SolidJS | `intable` | `pnpm add intable` |
| React | `@intable/react` | `pnpm add @intable/react` |
| Vue 3 | `@intable/vue` | `pnpm add @intable/vue` |

---

## 内置功能速查（无需 `plugins=[]`）

| 功能 | 激活方式 |
|------|---------|
| 单元格编辑 | 列加 `editable: true` + 列 `type` 指定类型 |
| 列排序 | 列加 `sortable: true` + `sort` prop |
| 列筛选 | 列加 `filterable: true` + `filter` prop |
| 行选择 | `rowSelection` prop |
| 行展开 | `expand` prop |
| 树形表格 | 数据含 `children` 字段 |
| 单元格选区/复制粘贴 | 默认开启 |
| 行/列拖拽排序 | `rowDrag` / `colDrag` prop（默认关闭） |
| 固定列 | 列加 `fixed: 'left'` 或 `'right'` |
| 行号列 | `index={true}` |
| Tooltip | 列加 `tooltip` |
| 自定义渲染 | 列加 `render` / `type` / `enum` |
| 内置校验 | 列加 `required` 或 `validator` |
| 单元格合并 | 列加 `mergeRow: true` 或 `merge` prop |
| 行分组 | `rowGroup` prop |
| 合计行 | 列加 `aggregate` |
| 自动填充 | `autoFill` prop |
| Excel 导入/导出 | `store.commands.exportExcel()` / `readExcel()` |

## 可选插件（需传入 `plugins=[]`）

| 功能 | 导入路径 |
|------|---------|
| 虚拟滚动 | `'intable/plugins/VirtualScrollPlugin'` |
| 撤销/重做 | `'intable/plugins/HistoryPlugin'` |
| Zod 校验 | `'intable/plugins/ZodValidatorPlugin'` |
| Diff 高亮 | `'intable/plugins/DiffPlugin'` |
| 加载更多 | `'intable/plugins/LoadMorePlugin'` |
| 列显示/隐藏 | `'intable/plugins/ColumnVisibilityPlugin'` |

---

## 核心 Props

| Prop | 说明 |
|------|------|
| `columns` / `data` / `rowKey` | 列定义 / 行数据 / 唯一标识字段 |
| `border` / `stickyHeader` / `index` / `loading` | 外观控制 |
| `plugins` | 可选插件数组 |
| `store` | `(store) => void` 获取内部 store |
| `onDataChange` / `onColumnsChange` | 数据/列变更回调 |
| `cellClass` / `cellStyle` | 单元格 class/style 回调 |
| `keybindings` | `{ 'Mod+K': handler }` 覆盖或 `false` 禁用快捷键 |

---

## 场景索引

根据需求关键词，用 **read_file** 读取对应文件后再回答：

| 需求关键词 | 读取文件 |
|-----------|---------|
| 基础表格、只读展示、行号、border、loading | `./scenes/01-basic.md` |
| 编辑单元格、新增行、复制粘贴、单元格选区、列宽调整、自动填充、AntdPlugin、ElementPlusPlugin、富编辑器 | `./scenes/02-editing.md` |
| 校验、验证、必填、required、Zod | `./scenes/03-validation.md` |
| 排序、sort、筛选、filter、过滤、搜索 | `./scenes/04-sort-filter.md` |
| 行选择、复选框、展开、树形、行拖拽、行分组 | `./scenes/05-row.md` |
| 固定列、多级表头、列拖拽 | `./scenes/06-layout.md` |
| 自定义渲染、render、tooltip、单元格合并、mergeRow | `./scenes/07-render.md` |
| 撤销、重做、undo、redo、diff、变更高亮 | `./scenes/08-history-diff.md` |
| 大数据、虚拟滚动、加载更多、无限滚动 | `./scenes/09-performance.md` |
| 合计、汇总、aggregate、sum、avg | `./scenes/10-aggregate.md` |
| 主题、暗色、列显示隐藏、Excel、导入导出、自定义插件 | `./scenes/11-advanced.md` |
| CRUD、增删改查、新增行、删除行、保存、提交 API、刷新 | `./scenes/12-crud.md` |

---

## 关键约束

- 使用 VirtualScrollPlugin 或固定表头时，容器必须有**固定高度**
- 新增行用 `Symbol()` 作为临时 `rowKey`（网络传输时自动忽略）
- 自定义插件的模块增强从 `'intable'` 导入类型，不使用内部路径
- 内置功能直接加 prop，不要错误地传入 `plugins=[]`
- 为保持代码简洁，columns 中的每列都只用一行代码定义，复杂的 validator 验证函数可单独定义。