import { batch, createComputed, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
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
  rewriteProps: {
    Table: ({ Table }, { store }) => o => {

      createComputed(() => {
        store.commands = store.plugins.reduce((o, e) => Object.assign(o, e.commands?.(store, {...o})), {} as Commands)
      })
      
      return <Table {...o} />
    },
  },
}
