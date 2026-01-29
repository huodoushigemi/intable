import { createMemo, getOwner, runWithOwner } from 'solid-js'
import { type Commands, type Plugin } from '..'

declare module '../index' {
  interface TableProps {
    
  }
  interface TableStore {
    commands: Commands
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
      get commands() { return commands() }
    }
  },
}
