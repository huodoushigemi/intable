import { unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createLazyMemo } from '@solid-primitives/memo'
import { v4 as uuid } from 'uuid'
import { diffArrays } from 'diff'
import { isEqual, keyBy } from 'es-toolkit'
import { type Plugin } from '..'
import { log } from '../utils'

declare module '../index' {
  interface TableProps {
    diff?: {
      /** @default false */
      enable?: boolean
      data?: any[]
      /** @default true */
      added?: boolean
      /** @default true */
      removed?: boolean
      /** @default true */
      changed?: boolean
      onCommit?: (data: any, opt: { added: any[], removed: any[], changed: any[] }) => any
    }
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
  name: 'diff',
  priority: Infinity,
  store: store => {
    const data = store.rawProps.data || []
    data.forEach(row => unwrap(row)[store.rawProps.rowKey] ??= uuid())
    return {
      diffData: structuredClone(unwrap(data || [])),
      diffData2: () => store.props.diff?.data ?? store.diffData,
      diffDataKeyed: createLazyMemo(() => keyBy(store.diffData2(), e => e[store.props!.rowKey]))
    }
  },
  commands: store => ({
    async diffCommit(data = store.rawProps.data || []) {
      const { rowKey } = store.props || {}
      data.forEach(row => unwrap(row)[rowKey] ??= uuid())
      data = structuredClone(unwrap(data))
      const added = [], removed = [], changed = []
      const keyed = keyBy(data, e => e[rowKey])
      for (const e of data) {
        const old = store.diffDataKeyed()[e[rowKey]]
        if (!old) added.push(e)
        else if (!isEqual(e, old)) changed.push(e)
      }
      for (const e of store.diffData2()) {
        !keyed[e[rowKey]] && removed.push(e)
      }
      await store.props!.diff?.onCommit?.(data, { added, removed, changed })
      added[NEW] = 0
      store.diffData = data
    }
  }),
  rewriteProps: {
    diff: ({ diff }) => ({
      enable: false,
      added: true,
      removed: true,
      changed: true,
      ...diff
    }),
    data: ({ data }, { store }) => {
      if (!store.props.diff?.enable) return data
      
      const { rowKey, diff } = store.props || {}
      const diffData = store.diffData2() || []

      // Fast path: same number of rows, same keys in same order (edit-only, no add/delete/move).
      // Skips the O(n²) diffArrays call which is the common case when only cell values changae.
      if (data.length === diffData.length && data.length > 0) {
        let sameOrder = true
        for (let i = 0; i < data.length; i++) {
          if (data[i]?.[rowKey] !== diffData[i]?.[rowKey]) { sameOrder = false; break }
        }
        if (sameOrder) return data
      }

      // todo eq
      // Structural change (add / delete / move) — fall back to diff library
      const diffArr = diffArrays(diffData, data, { comparator: (a, b) => a == b || a[rowKey] == b[rowKey] })
      return diffArr.flatMap(e => (
        // e.added ? e.value.map(e => ({ ...e, [NEW]: 1 })) :
        e.added ? e.value.map(e => (e[NEW] = 1, e)) :
        e.removed ? diff!.removed ? e.value.map(e => ({ ...e, [DEL]: 1, [store.internal]: 1 })) : [] :
        e.value
      ))
    },
    Td: ({ Td }, { store }) => !store.props.diff?.enable ? Td : o => {
      o = combineProps(o, {
        get class() {
          const { diff } = store.props
          const id = o.data[store.props!.rowKey]
          return [
            o.data[NEW] ? 'bg-#dafaea!' :
            o.data[DEL] ? 'bg-#ffe8e8!' :
            o.data[store.internal] ? '' :
            diff!.changed && o.data[o.col.id] != store.diffDataKeyed()[id]?.[o.col.id] ? 'bg-#dafaea!' : ''
          ].join(' ')
        }
      })
      return <Td {...o} />
    },
  },
  keybindings: (store) => ({
    '$mod+S': () => store.commands.diffCommit(),
  }),
}
