import { createEffect, createMemo, getOwner, runWithOwner } from 'solid-js'
import { createEventListener } from '@solid-primitives/event-listener'
import { combineProps } from '@solid-primitives/props'
import { createKeybindingsHandler } from 'tinykeys'
import { type Commands, type Plugin } from '..'

declare module '../index' {
  interface TableProps {
    
  }
  interface TableStore {
    commands: Commands
    scrollToCell?: (x: number | object, y: number | object, opt?: ScrollIntoViewOptions) => void
  }
  interface Plugin {
    commands?: (store: TableStore, commands: Partial<Commands>) => Partial<Commands> & Record<string, any>
  }
  interface Commands {
    
  }
}

export const CommandPlugin: Plugin = {
  name: 'command',
  priority: Infinity,
  store: (store) => {
    const owner = getOwner()
    const commands = createMemo(() => (
      store.plugins.reduce((o, e) => (
        Object.assign(o, runWithOwner(owner, () => e.commands?.(store, {...o})))
      ), {} as Commands)
    ))
    return {
      get commands() { return commands() },
      scrollToCell(x, y, opt) {
        x = typeof x == 'object' ? store.props.columns.indexOf(x) : x
        y = typeof y == 'object' ? store.props.data.indexOf(y) : y
        const cell = store.table.querySelector(`[x="${x}"][y="${y}"]`) as HTMLElement
        if (cell) cell.scrollIntoView({ behavior: 'smooth', ...opt })
      }
    }
  },
  rewriteProps: {
    Table: ({ Table }, { store }) => o => {
      const owner = getOwner()

      // Merge keybindings from all plugins in priority order (later index = lower priority = outer wrapper).
      // createMemo re-creates the tinykeys handler whenever plugins or user overrides change.
      const handler = createMemo(() => {
        const merged: Record<string, (e: KeyboardEvent) => void> = {}
        for (const p of store.plugins) {
          const bindings = runWithOwner(owner, () => p.keybindings?.(store))
          if (bindings) Object.assign(merged, bindings)
        }
        // Apply user overrides: false = disable, function = replace
        const overrides = store.props?.keybindings
        if (overrides) {
          for (const [key, val] of Object.entries(overrides)) {
            if (val === false) delete merged[key]
            else if (typeof val === 'function') merged[key] = val
          }
        }
        // Wrap each handler: preventDefault + call
        return createKeybindingsHandler(
          Object.fromEntries(
            Object.entries(merged).map(([k, fn]) => [k, (e: KeyboardEvent) => {
              e.preventDefault()
              fn(e)
            }])
          )
        )
      })

      // Single keydown listener that proxies to the current merged handler
      createEventListener(() => store.scroll_el, 'keydown', (e: KeyboardEvent) => handler()(e))

      o = combineProps({ tabindex: -1 }, o)
      return <Table {...o} />
    }
  },
}
