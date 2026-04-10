
## 相比传统表格解决了什么痛点

| 痛点 | el-table / ant-table | intable |
|---|---|---|
| 大数据量卡顿 | 全量渲染，1000 行即明显卡顿 | 行/列双向虚拟滚动，百万行流畅 |
| 单元格编辑难扩展 | 需要自行封装 `template` / `render`，与表格强耦合 | `editable: true` + `editor` 字段开箱即用，可自定义编辑器 |
| 功能越加越重 | 所有功能内置，无论用不用都打包进来 | 插件化拆分，按需 `import`，用什么装什么 |
| 复制粘贴体验差 | 不支持多单元格选区复制 | 原生类 Excel 选区 + TSV 复制粘贴，兼容 Excel / 飞书 |
| 撤销/重做缺失 | 几乎没有内置支持 | `HistoryPlugin` 内置完整撤销/重做栈 |
| 跨框架复用困难 | 绑定单一框架 | 同一套插件 API 在 SolidJS / React / Vue 下通用 |
| 插件/扩展机制弱 | 多数功能靠 slot/事件临时拼凑 | 责任链 `rewriteProps` 管道，插件完全可组合、可替换 |

## GitHub Copilot 智能提示（Copilot Skills）

在你的项目中加入 intable 的 Copilot instruction 文件后，GitHub Copilot 会自动识别你的使用场景（如"我想加筛选"、"数据量很大"），并给出正确的 intable 代码建议。

### 快速安装（单文件，推荐）

下载场景速查文件到你项目的 `.github/instructions/` 目录：

```bash
mkdir -p .github/instructions

curl -o .github/instructions/intable.instructions.md https://raw.githubusercontent.com/huodoushigemi/intable/main/.github/instructions/intable-scenarios.instructions.md
```

> **效果**：安装后，当你描述需求（如"加一个大数据量的可编辑表格"），Copilot 会自动引用 intable 的正确 API 和插件，无需反复查文档。
