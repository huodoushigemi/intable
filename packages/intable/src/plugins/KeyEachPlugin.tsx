import { createMemo, createSignal, For, mapArray, Show, untrack } from 'solid-js'
import type { Plugin } from '..'
import { keyBy } from 'es-toolkit'
import { change2 } from '../utils'

declare module '..' {
  interface TableProps {
    useRowKey?: boolean
    useColKey?: boolean
  }
  interface TableColumn {

  }
  interface TableStore {
    [COLUMNS]: TableColumn[]
  }
}

const COLUMNS = Symbol('columns')

export const KeyEachPlugin: Plugin = {
  name: 'keyEach',
  priority: -Infinity,
  rewriteProps: {
    columns: ({ columns }, { store }) => {
      if (!store.props.useColKey) return columns
      const keyed = untrack(() => keyBy(store[COLUMNS] ?? [], e => e.id))
      store[COLUMNS] = columns.map(e => keyed[e.id] ? change2(keyed[e.id], e) : { ...e })
      return store[COLUMNS]
    },
    EachRows: ({ EachRows }, { store }) => !store.props.useRowKey ? EachRows : o => {
      const raws = createMemo(() => ({ list: o.each.map(e => e[store.props.rowKey]), map: keyBy(o.each, e => e[store.props.rowKey]) }))
      return <For each={raws().list}>{(e, i) => o.children(() => raws().map[e], i)}</For>
    },
    // EachCells: ({ EachCells }, { store }) => !store.props.useColKey ? EachCells : o => {
    //   const raws = createMemo(() => ({ list: o.each.map(e => e.id), map: keyBy(o.each, e => e.id) }))
    //   return <For each={raws().list}>{(e, i) => o.children(() => raws().map[e], i)}</For>
    // },
  },
}
