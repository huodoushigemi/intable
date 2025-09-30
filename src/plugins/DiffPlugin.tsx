import { unwrap } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { useHistory, useTinykeys } from '@/hooks'
import { type Plugin } from '../xxx'

declare module '../xxx' {
  interface TableProps {
    // todo
    onCommit?: (data: any, opt: { addRows: any[], delRows: any[], editRows: any[] }) => any
  }
  interface TableStore {
    
  }
}

export const DiffPlugin: Plugin = {
  priority: Infinity,
  store: (store) => ({
    unsaveData: structuredClone(unwrap(store.rawProps.data)),
  }),
  processProps: {
    Table: ({ Table }, { store }) => o => {
      let el: HTMLBodyElement

      useTinykeys(() => el, {
        'Control+S': () => store.unsaveData = structuredClone(unwrap(store.rawProps.data)),
      })

      o = combineProps({ ref: e => el = e, tabindex: -1 }, o)
      return <Table {...o} />
    },
    tdProps: ({ tdProps }, { store }) => o => combineProps(tdProps?.(o) || {}, {
      // get style() { return o.data[o.col.id] !== store.unsaveData[o.y]?.[o.col.id] ? `background: #80808030` : `` }
    })
  },
}
