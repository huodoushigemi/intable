## GitHub Copilot 智能提示（Copilot Skills）

在你的项目中加入 intable 的 Copilot instruction 文件后，GitHub Copilot 会自动识别你的使用场景（如"我想加筛选"、"数据量很大"），并给出正确的 intable 代码建议。

### 快速安装（单文件，推荐）

下载场景速查文件到你项目的 `.github/instructions/` 目录：

```bash
mkdir -p .github/instructions

curl -o .github/instructions/intable.instructions.md https://raw.githubusercontent.com/huodoushigemi/intable/main/.github/instructions/intable-scenarios.instructions.md
```

> **效果**：安装后，当你描述需求（如"加一个大数据量的可编辑表格"），Copilot 会自动引用 intable 的正确 API 和插件，无需反复查文档。