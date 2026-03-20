import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeData, replaceArray } from './helpers'
import { range } from 'es-toolkit'

const cols = createMutable([
  { name: 'Basic Info', children: [
    { id: 'col_0', name: 'Name', width: 100 },
    { id: 'col_1', name: 'Age', width: 80 },
  ]},
  { id: 'col_2', name: 'Status', width: 100 },
  { name: 'Address', children: [
    { id: 'col_3', name: 'City', width: 100 },
    { id: 'col_4', name: 'Street', width: 120 },
    { id: 'col_5', name: 'Zip', width: 80 },
  ]},
  ...range(6).map(i => ({ id: 'col_' + (i + 6), name: 'Extra ' + i, width: 80 })),
] as any[])

const data = makeData(100, 12)

export const HeaderGroupDemo = () => (
  <Intable
    class='w-full h-60vh'
    columns={cols}
    onColumnsChange={v => replaceArray(cols, v)}
    data={data}
    onDataChange={v => replaceArray(data, v)}
    index
    border
    stickyHeader
    size='small'
    plugins={[VirtualScrollPlugin]}
  />
)
