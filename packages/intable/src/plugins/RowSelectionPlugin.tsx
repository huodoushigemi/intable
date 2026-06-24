import { mergeProps } from 'solid-js'
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
      name: solidComponent((o) => (
        store.props.rowSelection?.multiple &&
        <label class='flex items-center justify-center w-full h-full absolute inset-0'>
          <Checkbox
            value={store.commands.rowSelector.isAll(store.props.data)}
            onChange={v => v ? store.commands.rowSelector.selectAll(store.props.data) : store.commands.rowSelector.clear()}
            disabled={!store.props?.data?.length}
          />
        </label>
      )),
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
    rowSelection: ({ rowSelection }) => mergeProps({
      enable: false,
      multiple: false,
      selectable: () => true,
    } as TableProps['rowSelection'], rowSelection),

    columns: ({ columns }, { store }) => store.props?.rowSelection?.enable
      ? [store.rowSelectionCol, ...columns]
      : columns
  }
}
