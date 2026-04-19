# Intable

> 🎯 一个组件搞定所有表格场景 — SolidJS / React / Vue 框架通用

[![npm](https://img.shields.io/npm/v/intable)](https://www.npmjs.com/package/intable)
[![license](https://img.shields.io/github/license/huodoushigemi/intable)](LICENSE)
[![stars](https://img.shields.io/github/stars/huodoushigemi/intable)](https://github.com/huodoushigemi/intable/stargazers)

---

## [🚀 在线体验 Demo](https://huodoushigemi.github.io/intable)

---

## 🎯 核心功能一览

- ✅ **虚拟滚动** — 百万行数据流畅运行
- ✅ **单元格编辑** — text / number / date / select / checkbox / range / color
- ✅ **列筛选排序** — 内置 FilterPlugin / SortPlugin
- ✅ **Excel 复制粘贴** — 多单元格选区 TSV 兼容
- ✅ **撤销重做** — Ctrl+Z / Ctrl+Y
- ✅ **Excel 导入导出** — 一键导出 xlsx
- ✅ **数据校验** — Zod schema 集成
- ✅ **变更比对** — DiffPlugin 高亮追踪

---

## 🤖 AI 时代的工作流

**安装 Copilot Skill：**
```bash
mkdir -p .github/instructions
curl -o .github/instructions/intable.instructions.md https://raw.githubusercontent.com/huodoushigemi/intable/main/.github/instructions/intable-scenarios.instructions.md
```

**效果：** 描述需求（如"加一个大数据量的可编辑表格"），Copilot 自动给出正确代码。

---

📈 真实项目对比，以「用户管理」模块为例：

| 指标 | 使用前 | 使用后 |
|------|--------|--------|
| 代码行数 | 500+ | **200-** |
| AI 消耗 | 100% | **<70%** |


---

## 🚀 快速开始

```bash
# SolidJS
pnpm add intable

# React
pnpm add @intable/react

# Vue 3
pnpm add @intable/vue
```

**创建一个表格，只需几行代码：**

```tsx
import Intable from 'intable'
// import Intable from '@intable/react'
// import Intable from '@intable/vue'

<Intable
  columns={[
    { id: 'name', name: '姓名', width: 120 },
    { id: 'age',  name: '年龄', width: 80  },
  ]}
  data={[
    { id: 1, name: 'Alice', age: 28 },
    { id: 2, name: 'Bob',   age: 32 },
  ]}
  border
/>
```

---

## 🌟 为什么选择 Intable

1. **插件化架构** — 责任链 `rewriteProps` 管道，插件完全可组合、可替换
2. **框架通用** — SolidJS / React / Vue 共享同一套插件 API
3. **性能优先** — 虚拟滚动，行/列双向渲染，百万行不卡顿
4. **AI 集成** — Copilot Skill 让 AI 写出正确用法
5. **渐进增强** — 从简单表格到复杂企业级需求，平滑升级

---

## License

MIT
