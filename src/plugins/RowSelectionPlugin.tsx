import { batch, createComputed, createEffect, createMemo, createSignal, mapArray, on } from 'solid-js'
import { defaultsDeep } from 'es-toolkit/compat'
import { type Commands, type Plugin, type TableColumn, type TableProps } from '../xxx'
import { Checkbox } from './RenderPlugin/components'
import { log } from '@/utils'

declare module '../xxx' {
  interface TableProps {
    rowSelection?: {
      enable?: boolean
      multiple?: boolean // todo
      selected?: any[]
      onChange?: (selected: any[]) => void
    }
  }
  interface TableStore {

  }
  interface Commands {
    
  }
}

export const RowSelectionPlugin: Plugin = {
  store: (store) => ({
    rowSelectionCol: {
      width: 40,
      fixed: 'left',
      [store.internal]: 1,
      class: 'rowSelection',
      style: { display: 'flex', 'align-items': 'center' },
      // render: (o) => <Checkbox value={store.commands.rowIndexOf(o.data) > -1} onChange={v => {}} />
      render: (o) => <Checkbox />
    } as TableColumn,
    rowSelection: {
      selected: []
    }
  }),
  processProps: {
    rowSelection: ({ rowSelection }) => defaultsDeep({
      enable: false,
      multiple: false,
    } as TableProps['rowSelection'], rowSelection),
    columns: ({ columns }, { store }) => store.props?.rowSelection?.enable ? [store.rowSelectionCol, ...columns] : columns
    // columns: ({ columns }, { store }) => [store.rowSelectionCol, ...columns]
  }
}
