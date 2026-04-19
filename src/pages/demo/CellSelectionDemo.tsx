import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(8)
const data = makeData(30, 8)

/**
 * CellSelection is auto-loaded.
 * Click a cell then drag or shift+click to select a range.
 * Arrow keys to navigate.
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
  />
)
