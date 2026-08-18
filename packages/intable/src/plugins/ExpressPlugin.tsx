import { createComputed, untrack } from 'solid-js'
import { type Plugin } from '..'
import { useMemoAsync } from '../hooks'

declare module '../index' {
  interface TableProps {

  }
  interface TableColumn {
    valueGetter?: (o: Pick<TDProps, 'data' | 'col'>) => any
    valueSetter?: (o: Pick<TDProps, 'data' | 'col' | 'value'>) => void
  }
}

export const ExpressPlugin: Plugin = {
  name: 'express',

  store: (store) => ({

  }),

  rewriteProps: {
    Table: ({ Table }, { store }) => o => {
      createComputed(() => {
        for (let x = 0; x < store.props.columns.length; x++) {
          const col = store.props.columns[x]
          if (!col.valueGetter && !col.valueSetter) continue
          for (let y = 0; y < store.props.data.length; y++) {
            const row = store.props.data[y]
            if (!col.id) continue
            const value = useMemoAsync(() => col.valueGetter?.({ col, data: row }))
            Object.defineProperty(row, col.id!, {
              get: value,
              set: (v) => untrack(() => col.valueSetter?.({ col, data: row, value: v })),
              enumerable: true,
              configurable: true
            })
          }
        }
      })
      return <Table {...o} />
    },
  }
}
