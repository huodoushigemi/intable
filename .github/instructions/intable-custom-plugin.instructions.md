---
applyTo: "packages/intable/src/plugins/**/*.{tsx,ts}"
---

# intable — 编写自定义插件

## Plugin 接口速查

```ts
interface Plugin {
  name?: string
  priority?: number     // 数字越大越先执行；Infinity = 最先；-Infinity = 最后
  store?(store: TableStore): Partial<TableStore>  // 初始化 store 增量
  rewriteProps?: {      // 链式改写 TableProps / 渲染组件
    [K in keyof TableProps]?: (prev: TableProps, ctx: { store: TableStore }) => TableProps[K]
  }
  commands?(store: TableStore, prev: Commands): Partial<Commands>
  keybindings?(store: TableStore): Record<string, false | ((e: KeyboardEvent) => void)>
  menus?(store: TableStore): MenuItem[]
  layers?: Component[]  // SolidJS 组件，渲染在表格 overlay 层
  onMount?(store: TableStore): void
}

type Plugin$0 = Plugin | ((store: TableStore) => Plugin)
```

## 最简插件骨架

```tsx
// packages/intable/src/plugins/MyPlugin.tsx
import type { Plugin } from '../index'

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  priority: 0,   // 默认优先级，大多数情况不需要设
}
```

## 1. 扩展 Store（模块增强）

**模块增强必须在与插件相同的文件中声明**，不要拆到单独文件。

```tsx
import { createMutable } from 'solid-js/store'
import type { Plugin } from '../index'

declare module '../index' {
  interface TableStore {
    myFeature: {
      count: number
      selected: Record<string, true | undefined>
    }
  }
}

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  store: () => ({
    myFeature: {
      count: 0,
      selected: {},
    },
  }),
}
```

## 2. 扩展 TableProps（接受用户配置）

```tsx
declare module '../index' {
  interface TableProps {
    myFeature?: {
      enable?: boolean
      onChange?: (count: number) => void
    }
  }
}
```

在插件内通过 `store.props.myFeature` 访问（总是最新），无需手动订阅。

## 3. rewriteProps — 改写渲染组件

```tsx
import { mergeProps } from 'solid-js'

export const MyPlugin: Plugin = {
  rewriteProps: {
    // 包装 Td（单元格），在值后面追加标记
    Td: ({ Td }, { store }) => (originalProps) => {
      const isModified = store.myFeature.selected[originalProps.rowKey]
      return (
        <Td {...originalProps}>
          {originalProps.children}
          {isModified && <span class='ml-1 c-orange-500'>*</span>}
        </Td>
      )
    },

    // 在列表底部添加 Footer slot（常见用法：LoadMore 状态栏）
    Footer: (_, { store }) => () => (
      <div class='p-2 text-center text-sm c-gray-500'>
        共 {store.props.data.length} 行
      </div>
    ),
  },
}
```

可 rewrite 的 slot 包含：`Td`、`Th`、`Tr`、`Header`、`Footer`、`Empty` 等，均是 React-style 组件 prop。

## 4. 快捷键（keybindings）

**不要**在插件内直接调用 `useTinykeys`，通过 `keybindings` 字段声明，由 `CommandPlugin` 统一注册：

```ts
keybindings: (store) => ({
  '$mod+K': (e) => {
    e.preventDefault()
    store.myFeature.count++
  },
  '$mod+Shift+K': (e) => {
    e.preventDefault()
    store.myFeature.count = 0
  },
}),
```

`$mod` 在 Mac 上为 ⌘，Windows 上为 Ctrl。用户可通过 `TableProps.keybindings` 覆盖或禁用：

```tsx
<Intable keybindings={{ '$mod+K': false }} ... />
```

## 5. Commands（命令）

```tsx
declare module '../index' {
  interface Commands {
    incrementCount: () => void
  }
}

export const MyPlugin: Plugin = {
  commands: (store, prev) => ({
    ...prev,
    incrementCount: () => {
      store.myFeature.count++
      store.props.myFeature?.onChange?.(store.myFeature.count)
    },
  }),
}
```

其他地方通过 `store.commands.incrementCount()` 调用。

## 6. 右键菜单（menus）

```tsx
import type { MenuItem } from '../plugins/MenuPlugin'

export const MyPlugin: Plugin = {
  menus: (store) => [
    {
      label: `Count: ${store.myFeature.count}`,
      icon: <ILucideHash />,
      onClick: () => store.commands.incrementCount(),
    },
    { divider: true },
    {
      label: '重置',
      disabled: () => store.myFeature.count === 0,
      onClick: () => { store.myFeature.count = 0 },
    },
  ],
}
```

## 7. Overlay Layers（浮层）

```tsx
import { Show } from 'solid-js'
import type { Plugin } from '../index'

const MyLayer: Component<{ store: TableStore }> = (props) => (
  <Show when={props.store.myFeature.count > 10}>
    <div class='absolute top-2 right-2 bg-red-500 c-white px-2 py-1 rounded text-sm'>
      Count: {props.store.myFeature.count}
    </div>
  </Show>
)

export const MyPlugin: Plugin = {
  layers: [MyLayer],
}
```

## 8. onMount

```tsx
import { createEffect, onCleanup } from 'solid-js'

export const MyPlugin: Plugin = {
  onMount: (store) => {
    const timer = setInterval(() => {
      store.myFeature.count++
    }, 1000)
    onCleanup(() => clearInterval(timer))
  },
}
```

## 9. 内部（系统）列

用 `[store.internal]: 1` 标记，使该列不计入用户列索引（不参与 index 计数等）：

```tsx
store: (store) => {
  store.myCol = {
    id: Symbol('my-col'),
    [store.internal]: 1,    // 标记为系统列
    name: '',
    width: 40,
    render: ({ data }) => <span onClick={() => deleteRow(data)}>×</span>,
  }
}
```

## 10. 工厂插件（需要消费 store 才能初始化）

```ts
export const MyPlugin: Plugin$0 = (store) => ({
  name: 'my-plugin',
  priority: 10,
  store: () => ({ myFeature: { count: 0 } }),
})
```

工厂函数在 `store` 刚创建（挂载前）时调用，适合在插件之间相互依赖的场景。

## 完整插件示例

```tsx
// packages/intable/src/plugins/RowBadgePlugin.tsx
import { createMemo, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { Plugin, TableStore } from '../index'

declare module '../index' {
  interface TableProps {
    rowBadge?: { threshold?: number }
  }
  interface TableStore {
    rowBadge: { badgeRows: Record<string, true | undefined> }
  }
}

const BadgeLayer: Component<{ store: TableStore }> = (props) => {
  const threshold = createMemo(() => props.store.props.rowBadge?.threshold ?? 0)
  return (
    <Show when={props.store.rowBadge && Object.keys(props.store.rowBadge.badgeRows).length >= threshold()}>
      <div class='absolute top-2 left-2 bg-blue-500 c-white px-2 py-1 rounded'>
        已标记 {Object.keys(props.store.rowBadge.badgeRows).length} 行
      </div>
    </Show>
  )
}

export const RowBadgePlugin: Plugin = {
  name: 'row-badge',
  store: () => ({
    rowBadge: { badgeRows: {} },
  }),
  layers: [BadgeLayer],
  menus: (store) => [
    {
      label: '标记此行',
      onClick: ({ rowKey }) => {
        store.rowBadge.badgeRows[String(rowKey)] = true
      },
    },
    {
      label: '取消标记',
      onClick: ({ rowKey }) => {
        delete store.rowBadge.badgeRows[String(rowKey)]
      },
    },
  ],
}
```
