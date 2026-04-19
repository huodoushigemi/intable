import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(6)
const data = makeData(20, 6)

/**
 * Drag column header borders to resize columns.
 * Row resize is also enabled — drag row bottom borders.
 */
export default () => (
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
    resizable={{ col: { enable: true }, row: { enable: true } }}
  />
)
