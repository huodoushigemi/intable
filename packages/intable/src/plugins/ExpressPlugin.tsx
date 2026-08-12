import { createComputed, untrack } from 'solid-js'
import { type Plugin } from '..'

declare module '../index' {
  interface TableProps {

  }
  interface TableColumn {
    valueGetter?: (o: TDProps) => any
    valueSetter?: (o: TDProps, v: any) => void
  }
}

export const ExpressPlugin: Plugin = {
  name: 'expand',

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
            Object.defineProperty(row, col.id!, {
              get: () => col.valueGetter?.({ col, data: row, x, y }),
              set: (v) => untrack(() => col.valueSetter?.({ col, data: row, value: row[col.id], x, y }, v)),
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
