import { combineProps } from '@solid-primitives/props'
import type { Plugin } from '..'

type Key = string | symbol

declare module '../index' {
  interface TableProps {
    validator?: (value: any, data: any, col: TableColumn) => void | Promise<void>
  }
  interface TableColumn {
    validator?: (value: any, rowData: any, col: TableColumn) => void | Promise<void>
  }
  interface TableStore {
    validateCell: (value: any, data: any, col: TableColumn) => Promise<void>
    clearCellValidation: (data: any, col: TableColumn) => void
    cellValidationErrors: { [row: Key]: { [col: Key]: string | null } | null }
  }
}

export const ValidatorPlugin: Plugin = {
  name: 'validator',
  store: (store) => ({
    cellValidationErrors: {} as { [row: Key]: { [col: Key]: string | null } | null },
    validateCell: async (value, data, col) => {
      const validators = [store.props.validator, col.validator]
      const id = data[store.props.rowKey]
      for (const fn of validators) {
        if (!fn) continue
        try {
          await fn(value, data, col)
        } catch (e) {
          const msg = (e as Error).message || 'Error'
          store.cellValidationErrors[id] ??= {}
          store.cellValidationErrors[id][col.id] = msg
          throw new Error(msg)
        }
      }
      store.cellValidationErrors[id] ??= {}
      store.cellValidationErrors[id][col.id] = null
    },
    clearCellValidation: (data, col) => {
      const id = data[store.props.rowKey]
      if (!store.cellValidationErrors[id]) return
      store.cellValidationErrors[id][col.id] = null
    }
  }),
  rewriteProps: {
    Td: ({ Td }, { store }) => o => {
      const error = () => store.cellValidationErrors[o.data[store.props.rowKey]]?.[o.col.id]
      const combined = combineProps(o, {
        get class() { return error() != null ? 'is-invalid' : '' }
      })
      return (
        <Td {...combined}>
          {o.children}
          {error() != null && <div class='cell-validation-error'>{error()}</div>}
        </Td>
      )
    }
  }
}
