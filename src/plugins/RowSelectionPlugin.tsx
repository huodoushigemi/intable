import { createMemo, createRenderEffect, mergeProps, on } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { keyBy } from 'es-toolkit'
import { defaultsDeep, isEqual } from 'es-toolkit/compat'
import { type Commands, type Plugin, type TableColumn, type TableProps } from '../xxx'
import { Checkbox } from './RenderPlugin/components'
import { solidComponent } from '@/components/utils'

declare module '../xxx' {
  interface TableProps {
    rowSelection?: {
      enable?: boolean
      multiple?: boolean
      value?: any[]
      selectable?: (row) => boolean
      onChange?: (selected: any[]) => void
    }
  }
  interface TableStore {

  }
  interface Commands {
    rowSelector: ReturnType<typeof useSelector>
  }
}

export const RowSelectionPlugin: Plugin = {
  store: (store) => ({
    rowSelectionCol: {
      [store.internal]: 1,
      id: Symbol('row-selection'),
      width: 45,
      fixed: 'left',
      class: 'row-selection',
      resizable: false,
      render: solidComponent((o) => (
        <label>
          <Checkbox
            style='position: absolute'
            value={store.commands.rowSelector.isSelected(o.data)}
            onChange={v => store.commands.rowSelector.select(o.data, v)}
            disabled={!store.props?.rowSelection?.selectable?.(o.data)}
          />
        </label>
      ))
    } as TableColumn,
  }),
  commands: (store) => ({
    rowSelector: useSelector(mergeProps(() => ({ rowKey: store.props?.rowKey, ...store.props?.rowSelection })))
  }),
  processProps: {
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

function useSelector(opt: Partial<{ value, rowKey, multiple, selectable, onChange }>) {
  const map = createMutable({})
  const selected = createMemo(() => opt.value || [])

  const isSelected = (data) => !!map[id(data)]

  const select = (data, bool = true) => opt.selectable(data) && (opt.multiple || clear(), map[id(data)] = bool ? data : void 0)

  const clear = () => opt.onChange?.([])

  const set = (rows = []) => opt.onChange?.(rows)

  const id = data => data[opt.rowKey]

  createRenderEffect(on(selected, () => {
    const keyed = keyBy(selected(), id)
    for (const id in map) {
      if (!keyed[id]) map[id] = void 0
    }
    for (const id in keyed) {
      if (!map[id]) map[id] = keyed[id]
    }
  }))

  return { isSelected, select, clear, set }
}