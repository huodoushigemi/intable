import { createMutable, unwrap } from 'solid-js/store'
import { captureStoreUpdates } from '@solid-primitives/deep'
import { combineProps } from '@solid-primitives/props'
import { useHistory, useTinykeys } from '@/hooks'
import { type Plugin } from '../xxx'
import { log } from '@/utils'
import { batch, untrack } from 'solid-js'

declare module '../xxx' {
  interface TableProps {
    history: {
      num: number
    }
  }
  interface TableStore {
    history: ReturnType<typeof useHistory>
  }
}

export const HistoryPlugin: Plugin = {
  priority: Infinity,
  store: (store) => {
    const getDelta = captureStoreUpdates(store.rawProps.data!)
    let clonedState
    return ({
      unsaveData: structuredClone(unwrap(store.rawProps.data)),
      history: useHistory([() => {
        const delta = getDelta()
        if (!delta.length) return

        for (const { path, value } of delta) {
          if (path.length == 0) {
            clonedState = structuredClone(unwrap(value))
          } else {
            const target = { ...clonedState }
            path.reduce((o, k, i) => o[k] = i < path.length -1 ? Array.isArray(o[k]) ? [...o[k]] : { ...o[k] } : structuredClone(unwrap(value)), target)
            clonedState = target
          }
        }
        return clonedState
      }, v => batch(() => store.rawProps.onDataChange?.(v))])
    })
  },
  processProps: {
    Table: ({ Table }, { store }) => o => {
      let el: HTMLBodyElement

      useTinykeys(() => el, {
        'Control+Z': () => store.history.undo(),
        'Control+Y': () => store.history.redo(),
        'Control+S': () => store.unsaveData = structuredClone(unwrap(store.rawProps.data)),
      })

      o = combineProps({ ref: e => el = e, tabindex: -1 }, o)
      return <Table {...o} />
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      get style() { return o.data[o.col.id] != store.unsaveData[o.y][o.col.id] ? `background: #80808030` : `` }
    })
  },
}
