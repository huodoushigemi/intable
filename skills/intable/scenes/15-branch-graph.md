# 分支图（BranchGraphPlugin）

Git 风格的分支拓扑图，在表格左侧插入一列 SVG 覆盖层，通过 `parentid`（或自定义字段）将行与父行连线。

## 基本用法

```tsx
<Intable
  columns={columns}
  data={data}
  rowKey='id'
  branchGraph={{ parentField: 'parent_id', width: 140, laneGap: 18 }}
/>
```

数据必须按拓扑序排列（子在上、父在下，或反之——布局算法双向均支持）。每行通过 `parentField`（默认 `'parentid'`）引用父行 key；合并节点可传数组。

```tsx
const data = [
  { id: 'c3', msg: 'fix bug',       parent_id: 'c2' },
  { id: 'c2', msg: 'add feature',   parent_id: 'c1' },
  { id: 'c1', msg: 'init',          parent_id: null },
  // 合并行：parent_id 为数组
  { id: 'm1', msg: 'merge branch',  parent_id: ['c3', 'b2'] },
]
```

## 配置项

```tsx
branchGraph={{
  parentField: 'parentid',  // 父 id 字段名，默认 'parentid'
  width: 120,               // 列宽，默认 120
  laneGap: 18,              // 泳道间距(px)，默认 18
  colors: ['#51a2ff', ...], // 泳道调色板，按索引循环
}}
```

## 交互

- **Hover 高亮**：鼠标悬停某行时，该行及其所有祖先节点/连线高亮，其余淡化（opacity 0.12）
- SVG 覆盖层通过 `rewriteProps.Table` 注入，`pointer-events: none`，不拦截表格交互

## 布局算法要点

- 单次自顶向下遍历，为每行分配一个水平泳道（lane）
- 父节点的最后一个子节点继承父泳道（直线延续），其余子节点开新泳道
- 泳道在 owner 的最后一个子节点放置后回收复用
- 底向上数据（子在上父在下）同样支持：子先占 lane，父后继承

## 工作原理

- 插件在 `store` 上注入 `$branchCol`（空占位列，class `branch-graph-col`）
- `rewriteProps.columns` 在列数组头部插入该占位列
- `rewriteProps.Table` 在 `<table>` 内追加 `<BranchGraphSVG>` 覆盖层
- SVG 使用 `store.thSizes` / `store.trSizes` 实时计算每行中心点和列偏移
