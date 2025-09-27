import { groupBy, isEqual, remove } from 'es-toolkit'
import { Ctx, type Plugin } from '../xxx'
import { createMemo, useContext } from 'solid-js'
import type { TableStore } from '../xxx'

declare module '../xxx' {
  interface TableProps {
    rowGroup?: {
      fields?: string[]
    }
  }
  interface TableStore {
    rowGroup: {
      expands: string[][]
      isExpand: (data) => boolean
      toggleExpand: (data) => void
    }
  }
}

export const RowGroupPlugin: Plugin = {
  store: (store) => ({
    rowGroup: {
      expands: [],
      isExpand: data => store.rowGroup.expands.some(e => isEqual(e, data[symbol].path)),
      toggleExpand: data => store.rowGroup.isExpand(data) ? remove(store.rowGroup.expands, e => isEqual(e, data[symbol].path)) : store.rowGroup.expands.push(data[symbol].path)
    }
  }),
  processProps: {
    Td: ({ Td }, { store }) => o => {
      if (!o.data?.[symbol]) return <Td {...o} />
      
      const { props } = useContext(Ctx)
      const show = createMemo(() => store.rowGroup.isExpand(o.data))
      
      return (
        <Td {...o}>
          {props.columns?.findIndex(e => !e[store.internal]) == o.x ? (
            <div class='flex items-center' style={`padding-left: ${(o.data[symbol].path.length - 1) * 16}px`} onDblClick={() => store.rowGroup.toggleExpand(o.data)}>
              <ILucideChevronRight class='icon-clickable mr-2' style={`transform: rotate(${show() ? 90 : 0}deg); opacity: .6`} onClick={() => store.rowGroup.toggleExpand(o.data)} />
              {o.data[symbol].value}
            </div>
          ) : o.children}
        </Td>
      )
    },
    data: ({ data }, { store }) => (
      store.props?.rowGroup?.fields?.length
        ? expandData(data, store)
        : data
    )
  },
}

const symbol = Symbol('row-group')

const expandData = (data, store: TableStore, path = [] as any[]) => {
  const { expands } = store.rowGroup
  const fields = store.props!.rowGroup!.fields!
  const col = store.props!.columns?.find(e => !e[store.internal])
  if (!col) return data
  if (fields.length == path.length) return data
  const obj = groupBy(data, e => e[fields[path.length]])
  return Object.keys(obj).flatMap(k => {
    const ks = [...path, k]
    const arr = expands.some(e => isEqual(ks, e))
      ? expandData(obj[k], store, ks)
      : []
    return [{ [col.id]: k, [store.internal]: 1, [symbol]: { path: ks, value: k } }, ...arr]
  })
}