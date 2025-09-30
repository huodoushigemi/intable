import { createEffect, useContext, type Component } from 'solid-js'
import { Ctx, type Plugin } from '../xxx'
import { combineProps } from '@solid-primitives/props'
import { createEventListener } from '@solid-primitives/event-listener'

declare module '../xxx' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
  interface Plugin {
    
  }
  interface Commands {
    copy: () => void
    paste: () => void
  }
}

export const CopyPlugin: Plugin = {
  processProps: {
    Table: ({ Table }, { store }) => o => {
      let el: HTMLElement
      
      createEventListener(() => el, 'keydown', e => {
        if (e.key.toLowerCase() == 'c' && e.ctrlKey) {
          e.preventDefault()
          e.stopPropagation()
          store.commands.copy()
          el.classList.add('copied')
        }
      })
      
      createEffect(() => {
        JSON.stringify(store.selected)
        el.classList.remove('copied')
      })

      o = combineProps({ ref: e => el = e, tabindex: -1 }, o)
      return <Table {...o} />
    }
  },
  menus: (store) => [
    // { label: '复制', onClick: () => store.commands.copy() },
    // { label: '粘贴', onClick: () => store.commands.paste() },
  ],
  commands: store => ({
    copy: () => {
      const { start, end } = store.selected
      if (start.length == 0) return
      const [x1, x2] = [start[0], end[0]].sort((a, b) => a - b)
      const [y1, y2] = [start[1], end[1]].sort((a, b) => a - b)
      const cols = store.props!.columns!.slice(x1, x2 + 1)
      const data = store.props!.data!.slice(y1, y2 + 1).map(row => cols.map(col => row[col.id]))
      console.log(data)
      const text = data.map(row => row.join('\t')).join('\n')
      navigator.clipboard.writeText(text)
    },
    paste: async () => {
      const { start, end } = store.selected
      if (start.length == 0) return
      const text = await navigator.clipboard.readText()
      const arr2 = text.split('\n').map(row => row.split('\t'))
      const cols = store.props!.columns!.slice(start[0], start[0] + arr2[0].length)
      const data = store.props!.data!.slice()
      arr2.forEach((row, y) => {
        row = Object.fromEntries(cols.map((col, x) => [col.id, row[x]]))
        data[start[1] + y] = { ...data![start[1] + y], ...row }
      })
      store.selected.end = [start[0] + cols.length - 1, Math.min(start[1] + arr2.length - 1, ctx.props.data!.length - 1)]
      store.props!.onDataChange?.(data)
    },
  })
}

export const PastePlugin: Plugin = {
  processProps: {
    Table: ({ Table }, { store }) => o => {
      let el: HTMLElement

      createEventListener(() => el, 'keydown', async e => {
        if (e.key.toLowerCase() == 'v' && e.ctrlKey) {
          e.preventDefault()
          e.stopPropagation()
          store.commands.paste()
        }
      })
      
      o = combineProps({ ref: e => el = e, tabindex: -1 }, o)
      return <Table {...o} />
    }
  }
}