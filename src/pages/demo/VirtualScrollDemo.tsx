import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(50, { width: 80 })
const data = makeData(10000, 50)

export const VirtualScrollDemo = () => (
  <Intable
    class='h-60vh'
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
