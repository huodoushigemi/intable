import { $PROXY, batch, createMemo } from 'solid-js'
import { unwrap } from 'solid-js/store'
import { captureStoreUpdates } from '@solid-primitives/deep'
import { combineProps } from '@solid-primitives/props'
import { useHistory, useTinykeys } from '@/hooks'
import { type Plugin } from '..'

declare module '../index' {
  interface TableProps {

  }
  interface TableStore {
    history: ReturnType<typeof useHistory>
  }
}

export const HistoryPlugin: Plugin = {
  store: (store) => {
    const getDelta = createMemo(() => captureStoreUpdates(store.rawProps.data || []))
    let clonedState
    return ({
      history: useHistory([() => {
        const delta = getDelta()()
        if (!delta.length) return

        for (const { path, value } of delta) {
          if (path.length == 0) {
            clonedState = structuredClone(unwrap(value))
            // clonedState = [...value]
          } else {
            const target = [...clonedState]
            path.reduce((o, k, i) => o[k] = i < path.length -1 ? Array.isArray(o[k]) ? [...o[k]] : { ...o[k] } : structuredClone(unwrap(value)), target)
            clonedState = target
          }
        }
        return clonedState
      }, v => store.props!.onDataChange?.(v)])
    })
  },
  rewriteProps: {
    Table: ({ Table }, { store }) => o => {
      useTinykeys(() => store.table, {
        'Control+Z': () => store.history.undo(),
        'Control+Y': () => store.history.redo(),
      })

      o = combineProps({ tabindex: -1 }, o)
      return <Table {...o} />
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      // get style() { return o.data[o.col.id] != store.unsaveData[o.y]?.[o.col.id] ? `background: #80808030` : `` }
    })
  },
}
