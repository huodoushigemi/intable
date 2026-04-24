# 主题 / 列显示隐藏 / Excel 导入导出 / 自定义插件

## 多主题

导入对应 CSS 文件替代默认样式，将主题 class 加到容器上。

| 主题 | 导入路径 | 适用场景 |
|------|---------|----------|
| 默认 | `intable/style.css` | 通用 |
| Dark (OLED) | `intable/theme/dark.css` | 开发工具、夜间模式 |
| Shadcn/Zinc | `intable/theme/shadcn.css` | SaaS 后台、现代产品 |
| GitHub | `intable/theme/github.css` | 数据展示 |
| Material | `intable/theme/material.css` | Material Design 体系 |
| Stripe | `intable/theme/stripe.css` | 金融/支付界面 |
| Ant Design | `intable/theme/antd.css` | Ant Design 体系 |
| Element Plus | `intable/theme/element-plus.css` | Element Plus 体系 |

```tsx
import 'intable/theme/shadcn.css'  // 替代默认 style.css

// 暗色模式：在容器或 html 上加 .dark 或 data-theme="dark"
<div class='dark'>
  <Intable class='h-400px' columns={columns} data={data} />
</div>
```

---

## 列显示/隐藏（可选插件）

插件会在表格右上角渲染一个切换面板，也可编程控制。

```tsx
import { ColumnVisibilityPlugin } from 'intable/plugins/ColumnVisibilityPlugin'

let store
// 编程式切换
store.hiddenCols['salary'] = true      // 隐藏
delete store.hiddenCols['salary']      // 显示

<Intable
  store={s => store = s}
  columns={columns}
  data={data}
  plugins={[ColumnVisibilityPlugin]}
  columnVisibility={{
    defaultHidden: ['salary', 'cost'],
    onChange: (hiddenIds) => savePreference(hiddenIds),
  }}
/>
```

---

## Excel 导入/导出（内置）

无需额外插件，使用 `store.commands`。

```tsx
let store

<Intable store={s => store = s} columns={columns} data={data} onDataChange={setData} />
```

```tsx
// 导出当前数据为 .xlsx 文件（自动下载）
await store.commands.exportExcel()

// 获取 Blob（可上传到服务器）
const blob = await store.commands.createExcel()

// 导入：弹出文件选择框，返回行数组
const rows = await store.commands.readExcel()
setData(rows)

// 也可传入 File 对象
input.onchange = async (e) => {
  const rows = await store.commands.readExcel(e.target.files[0])
  setData(rows)
}
```

---

## 自定义插件

当内置功能不够用时编写插件。模块增强必须在同一文件中声明。

```tsx
import type { Plugin } from 'intable'

declare module 'intable' {
  interface TableProps {
    myFeature?: { enable?: boolean }
  }
  interface TableStore {
    myState: { count: number }
  }
  interface Commands {
    incrementCount(): void
  }
}

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  priority: 0,   // 数字越大越先执行
  store: () => ({
    myState: { count: 0 },
  }),
  commands: (store, prev) => ({
    ...prev,
    incrementCount() { store.myState.count++ },
  }),
  keybindings: (store) => ({
    '$mod+K': (e) => { e.preventDefault(); store.commands.incrementCount() },
  }),
  menus: (store) => [
    { label: `Count: ${store.myState.count}`, onClick: () => store.commands.incrementCount() },
  ],
}
```

通过 `plugins={[MyPlugin]}` 传入。用 `keybindings={{ '$mod+K': false }}` 可禁用任意默认快捷键。
