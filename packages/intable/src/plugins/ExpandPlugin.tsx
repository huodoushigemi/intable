import { mergeProps, type Component, type JSX } from 'solid-js'
import { Ctx, type Plugin, type TableColumn, type TableProps, type TableStore } from '..'
import { renderComponent, solidComponent } from '../components/utils'
import { useSelector } from '../hooks/useSelector'
import { combineProps } from '@solid-primitives/props'

declare module '../index' {
  interface TableProps {
    expand?: {
      enable?: boolean // todo
      render?: (props: { data: any, y: number }) => JSX.Element
    }
  }
  interface Commands {
    expand: ReturnType<typeof useSelector<any[]>>
  }
}

export const ExpandPlugin: Plugin = {
  name: 'expand',

  store: (store) => ({
    expandCol: {
      id: Symbol('expand'),
      fixed: 'left',
      width: 45,
      render: solidComponent((o) => <ArrowCell store={store} data={o.data} />),
      [store.internal]: 1
    } as TableColumn,
  }),

  commands: (store) => ({
    expand: useSelector({ multiple: true, key: store.props.rowKey })
  }),

  rewriteProps: {
    expand: ({ expand }) => mergeProps({
      enable: false,
    } as TableProps['expand'], expand),

    columns: ({ columns }, { store }) => store.props.expand?.enable
      ? [store.expandCol, ...columns]
      : columns,
      
    Tr: ({ Tr }, { store }) => store.props.expand?.enable ? o => (
      <Tr {...o}>{
        !o.data?.[store.expandCol.id] ? o.children :
        <td colspan={store.props.columns?.length} style='width: 100%'>
          {renderComponent(store.props.expand?.render, { ...o, data: o.data[store.expandCol.id] }, store)}
        </td>
      }</Tr>
    ) : Tr,

    Td: ({ Td }, { store }) => store.props.expand?.enable ? o => {
      o = combineProps(o, { onClick: () => o.col.id == store.expandCol.id && store.commands.expand.toggle(o.data) })
      return <Td {...o} />
    } : Td,
    
    data: ({ data }, { store }) => (
      store.commands.expand.value.length
        ? data?.flatMap(e => store.commands.expand.has(e) ? [e, { [store.expandCol.id]: e }] : e)
        : data
    )
  }
}

const ArrowCell: Component<{ data: any, store: TableStore }> = ({ data, store }) => {
  return (
    <div style='display: flex; align-items: center; width: 100%; height: 100%; opacity: .4'>
      <ILucideChevronRight style={`transform: rotate(${store.commands.expand.has(data) ? 90 : 0}deg);`} />
    </div>
  )
}