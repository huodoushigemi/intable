# intable – Copilot Instructions

## Overview
SolidJS-based Excel-like table component library with a **chain-of-responsibility plugin architecture**. Core lives in `packages/intable/src/`. Thin wrappers for React (`packages/react/`) and Vue (`packages/vue/`) delegate all logic to the core.

## Dev Workflow
```sh
pnpm dev          # Vite dev server – loads src/demo.tsx (SolidJS)
pnpm build        # Build demo/docs
pnpm build:lib    # Build library packages via scripts/build.js
```
Active sandbox is `src/demo.tsx`; Vue sandbox is `src/demo-vue.ts`. Both import directly from the workspace packages, not npm.

## Plugin Architecture (the most important concept)

Every feature is a `Plugin` object with these optional fields:

| Field | Purpose |
|---|---|
| `store(store)` | Initialise reactive state on the shared `createMutable` store |
| `rewriteProps` | Chain-transform `TableProps` – each plugin receives the *previous* plugin's output |
| `commands(store, prev)` | Add to `store.commands` (aggregated by `CommandPlugin`) |
| `keybindings(store)` | Declare keyboard shortcuts (aggregated + registered by `CommandPlugin`) — use tinykeys syntax |
| `menus(store)` | Contribute context-menu items (collected by `MenuPlugin`) |
| `layers` | SolidJS components rendered as overlay layers |
| `onMount(store)` | Runs after mount inside a `createEffect` |
| `priority` | Higher = executes earlier in the chain; `Infinity` = first (BasePlugin, CommandPlugin, ScrollPlugin), `-Infinity` = last |

`Plugin$0 = Plugin | ((store: TableStore) => Plugin)` — a plugin can be a factory that receives `store`.

### Props rewrite pipeline (`index.tsx` ~L160)
```ts
// Each plugin's rewriteProps receives the previous plugin's merged props
const prev = createMemo(() => pluginsProps()[i() - 1]?.[0]() || rawProps)
const ret = mergeProps(prev, toReactive(mapValues(e.rewriteProps, v => useMemo(() => v(prev(), { store })))))
```
All `rewriteProps` functions are **reactive** – return values are re-evaluated when dependencies change.

### Module augmentation — always extend interfaces in the same file as the plugin
```ts
declare module '../index' {
  interface TableProps   { myProp?: ... }       // new prop (use store.props.myProp)
  interface TableColumn  { myColProp?: ... }
  interface TableStore   { myState: ... }        // new store slice
  interface Commands     { myCommand: () => void }
  interface Plugin       { myPluginField?: ... } // if adding a cross-plugin field
}
```

## Key Files
- `packages/intable/src/index.tsx` — `Intable` component, `Plugin`/`TableProps`/`TableStore`/`TableColumn` interfaces, all built-in plugins (BasePlugin, IndexPlugin, ScrollPlugin, FitColWidthPlugin, etc.)
- `packages/intable/src/plugins/` — all optional plugins; each is self-contained
- `packages/intable/src/hooks/index.ts` — shared hooks: `useHistory`, `useMemoState`, `usePointerDrag`, `useTinykeys`
- `packages/intable/src/components/utils.tsx` — `solidComponent(fn)` / `renderComponent(comp, props, renderer)`

## Conventions

### Internal (system) columns
Mark a column with `[store.internal]: 1` so it is excluded from user-facing index arithmetic (e.g. "first user column"):
```ts
store.myCol = { id: Symbol('my'), [store.internal]: 1, ... } as TableColumn
```
Find the first user column with: `props.columns?.findIndex(e => !e[store.internal])`

### O(1) reactive Set pattern
Used for expand/selection states instead of arrays:
```ts
// In store init:
expandKeys: {} as Record<string, true | undefined>
// Read (reactive):
const isExpand = (key) => !!store.myState.expandKeys[String(key)]
// Write:
store.myState.expandKeys[key] = true   // add
delete store.myState.expandKeys[key]   // remove
```

### Keybindings (never add individual `useTinykeys` in plugins)
Declare on the plugin; `CommandPlugin` registers one shared listener:
```ts
keybindings: (store) => ({
  '$mod+Z': () => store.history.undo(),
  '$mod+Shift+K': () => ...,
})
```
User can override or disable per-key via `TableProps.keybindings`: `{ '$mod+Z': false }`.

### Commands
```ts
commands: (store, prevCommands) => ({
  myAction() { ... },  // available as store.commands.myAction()
})
```

### Icons
Icons are auto-imported via `unplugin-icons`. Use PascalCase tag names:
`<ILucideChevronRight />`, `<ISolarTrashBinMinimalisticBold />`, `<IVscodeIconsFileTypeTs />`

### Styling
UnoCSS utility classes inline (`class='flex items-center'`) + SCSS in `style.scss`. Theme overrides in `packages/intable/src/theme/`.

## Multi-framework Support
`packages/react/` and `packages/vue/` each export an `Intable` component that mounts the core SolidJS component into a host-framework managed DOM node. Framework-specific editor plugins (`AntdPlugin`, `ElementPlusPlugin`) implement the `Plugin` interface — they only fill `store.editors.*` with adapters using the host framework's rendering API (`ReactDOM.createRoot`, `Vue.render`).
