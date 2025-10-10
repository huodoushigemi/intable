import { unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createLazyMemo } from '@solid-primitives/memo'
import { v4 as uuid } from 'uuid'
import { diffArrays } from 'diff'
import { useTinykeys } from '@/hooks'
import { type Plugin } from '../xxx'
import { isEqual, keyBy } from 'es-toolkit'

declare module '../xxx' {
  interface TableProps {
    onDiffCommit?: (data: any, opt: { added: any[], removed: any[], edited: any[] }) => any
  }
  interface TableStore {
    diffData: any[]
    diffDataKeyed: () => any
  }
  interface Commands {
    diffCommit(data?: any[]): void
  }
}

const DEL = Symbol('del')
const NEW = Symbol('new')

export const DiffPlugin: Plugin = {
  priority: Infinity,
  store: store => {
    const data = store.rawProps.data || []
    data.forEach(row => unwrap(row)[store.rawProps.rowKey] ??= uuid())
    return {
      diffData: structuredClone(unwrap(data || [])),
      diffDataKeyed: createLazyMemo(() => keyBy(store.diffData, e => e[store.props!.rowKey]))
    }
  },
  commands: store => ({
    async diffCommit(data = store.rawProps.data || []) {
      const { rowKey } = store.props || {}
      data.forEach(row => unwrap(row)[rowKey] ??= uuid())
      data = structuredClone(unwrap(data))
      const added = [], removed = [], edited = []
      const keyed = keyBy(data, e => e[rowKey])
      for (const e of data) {
        const old = store.diffDataKeyed()[e[rowKey]]
        if (!old) added.push(e)
        else if (!isEqual(e, old)) edited.push(e)
      }
      for (const e of store.diffData) {
        !keyed[e[rowKey]] && removed.push(e)
      }
      await store.props!.onDiffCommit?.(data, { added, removed, edited })
      added[NEW] = 0
      store.diffData = data
    }
  }),
  processProps: {
    data: ({ data }, { store }) => {
      const { rowKey } = store.props || {}
      const diff = diffArrays(store.diffData || [], data, { comparator: (a, b) => a[rowKey] == b[rowKey] })
      return diff.flatMap(e => (
        // e.added ? e.value.map(e => ({ ...e, [NEW]: 1 })) :
        e.added ? e.value.map(e => (e[NEW] = 1, e)) :
        e.removed ? e.value.map(e => ({ ...e, [DEL]: 1, [store.internal]: 1 })) :
        e.value
      ))
    },
    Table: ({ Table }, { store }) => o => {
      useTinykeys(() => store.table, {
        'Control+S': () => store.commands.diffCommit()
      })

      o = combineProps({ tabindex: -1 }, o)
      return <Table {...o} />
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      get class() {
        const id = unwrap(o.data)[store.props!.rowKey]
        return [
          o.data[DEL] ? 'bg-#ffe8e8' :
          o.data[NEW] ? 'bg-#dafaea' :
          o.data[o.col.id] != store.diffDataKeyed()[id][o.col.id] ? 'bg-#dafaea' : ''
        ].join(' ')
      }
    }),
  },
}
