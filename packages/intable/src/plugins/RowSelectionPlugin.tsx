import { createEffect, createMemo, createRenderEffect, mergeProps, on } from 'solid-js'
import { createMutable, reconcile } from 'solid-js/store'
import { keyBy } from 'es-toolkit'
import { defaultsDeep, isEqual } from 'es-toolkit/compat'
import { type Commands, type Plugin, type TableColumn, type TableProps } from '..'
import { Checkbox } from './RenderPlugin/components'
import { solidComponent } from '../components/utils'
import { useSelector } from '../hooks/useSelector'

declare module '../index' {
  interface TableProps {
    rowSelection?: {
      enable?: boolean
      multiple?: boolean
      value?: any
      selectable?: (row) => boolean
      onChange?: (selected) => void
    }
  }
  interface TableStore {
    rowSelectionCol: TableColumn
  }
  interface Commands {
    rowSelector: ReturnType<typeof useSelector>
  }
}

export const RowSelectionPlugin: Plugin = {
  name: 'row-selection',
  priority: -Infinity,
  store: (store) => ({
    rowSelectionCol: {
      [store.internal]: 1,
      id: Symbol('row-selection'),
      fixed: 'left',
      class: 'row-selection',
      width: 45,
      resizable: false,
      render: solidComponent((o) => (
        <label>
          <Checkbox
            style='position: absolute'
            value={store.commands.rowSelector.has(o.data)}
            onChange={v => v ? store.commands.rowSelector.add(o.data) : store.commands.rowSelector.del(o.data)}
            disabled={!store.props?.rowSelection?.selectable?.(o.data)}
          />
        </label>
      ))
    } as TableColumn,
  }),
  commands: (store) => ({
    rowSelector: useSelector(mergeProps(() => ({ ...store.props?.rowSelection })))
  }),
  rewriteProps: {
    rowSelection: ({ rowSelection }) => defaultsDeep(rowSelection, {
      enable: false,
      multiple: false,
      selectable: () => true,
    } as TableProps['rowSelection']),

    columns: ({ columns }, { store }) => store.props?.rowSelection?.enable
      ? [store.rowSelectionCol, ...columns]
      : columns
  }
}
