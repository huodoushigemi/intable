import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(6)
const data = makeData(20, 6)

/**
 * Drag column headers to reorder columns.
 * Drag the index cell (row number) to reorder rows.
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
    colDrag
    rowDrag
  />
)
