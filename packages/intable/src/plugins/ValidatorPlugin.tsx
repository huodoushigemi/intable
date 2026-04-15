import { combineProps } from '@solid-primitives/props'
import type { Plugin } from '..'
import { isEmpty } from '../utils'

type Key = string | symbol

declare module '../index' {
  interface TableProps {
    validator?: (value: any, data: any, col: TableColumn) => void | Promise<void>
  }
  interface TableColumn {
    required?: boolean
    validator?: (value: any, rowData: any, col: TableColumn) => void | Promise<void>
  }
  interface TableStore {
    validateCell: (value: any, data: any, col: TableColumn) => Promise<void>
    validateRow: (data: any) => Promise<void>
    validate: () => Promise<void>
    clearCellValidation: (data: any, col: TableColumn) => void
    clearRowValidation: (data: any) => void
    clearValidation: () => void
    cellValidationErrors: { [row: Key]: { [col: Key]: string | null } | null }
  }
}

export const ValidatorPlugin: Plugin = {
  name: 'validator',
  priority: -1,
  store: (store) => ({
    cellValidationErrors: {} as { [row: Key]: { [col: Key]: string | null } | null },

    validateCell: async (value, data, col, scroll?) => {
      if (data[store.internal] || col[store.internal]) return
      const validators = [
        () => { if (col.required && isEmpty(value)) throw new Error('Required') },
        col.validator,
        store.props.validator,
      ]
      const id = data[store.props.rowKey]
      for (const fn of validators) {
        if (!fn) continue
        try {
          await fn(value, data, col)
        } catch (e) {
          const msg = (e as Error).message || 'Error'
          store.cellValidationErrors[id] ??= {}
          store.cellValidationErrors[id][col.id] = msg
          if (scroll) store.scrollToCell?.(col, data)
          throw new Error(msg)
        }
      }
      store.cellValidationErrors[id] ??= {}
      store.cellValidationErrors[id][col.id] = null
    },
    validateRow: async (data, scroll?) => {
      const cols = store.props.columns
      const promises = cols.map(col => store.validateCell(data[col.id], data, col))
      const rets = await Promise.all(promises.map(e => e.catch(e => e)))
      const errs = rets.map((r, i) => r instanceof Error ? [cols[i].id, r] : null).filter(e => e)
      if (errs.length) {
        if (scroll) {
          const col = cols[rets.findIndex(r => r instanceof Error)]
          store.scrollToCell?.(col, data)
        }
        throw Object.fromEntries(errs)
      }
    },
    validate: async () => {
      const data = store.rawProps.data || []
      const promises = data.map(row => store.validateRow(row))
      const rets = await Promise.all(promises.map(e => e.catch(e => e)))
      const errs = rets.map((r, i) => r ? [i, r] : null).filter(e => e)
      if (errs.length) {
        store.scrollToCell?.(store.props.columns.findIndex(e => e.id === Object.keys(errs[0][1])[0]), store.props.data?.[errs[0][0]])
        throw errs[0][1]
      }
    },
    clearCellValidation: (data, col) => {
      const id = data[store.props.rowKey]
      if (!store.cellValidationErrors[id]) return
      store.cellValidationErrors[id][col.id] = null
    },
    clearRowValidation: (data) => {
      const id = data[store.props.rowKey]
      if (!store.cellValidationErrors[id]) return
      const cols = store.props.columns
      for (const col of cols) {
        store.cellValidationErrors[id][col.id] = null
      }
    },
    clearValidation: () => {
      store.cellValidationErrors = {}
    }
  }),
  rewriteProps: {
    Td: ({ Td }, { store }) => o => {
      const error = () => store.cellValidationErrors[o.data[store.props.rowKey]]?.[o.col.id]
      return (
        <Td {...o} class={o.class + ' ' + (error() != null ? 'is-invalid' : '')}>
          {/*@once*/ o.children}
          {error() != null && <div class='cell-validation-error'>{error()}</div>}
        </Td>
      )
    },
    Th: ({ Th }, { store }) => o => {
      return (
        <Th {...o}>
          {o.col.required && <span class='mr-1 c-red/75'>*</span>}
          {/*@once*/ o.children}
        </Th>
      )
    }
  },
}
