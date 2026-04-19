import { Intable } from '../../../packages/intable/src'
import { HistoryPlugin } from '../../../packages/intable/src/plugins/HistoryPlugin'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(5, { editable: true })
const data = makeData(15, 5)

/**
 * Edit cells then press Ctrl+Z to undo, Ctrl+Y to redo.
 * HistoryPlugin must be added manually.
 */
export default () => (
  <div>
    <p class='text-sm c-gray mb-2'>Edit a cell, then Ctrl+Z to undo, Ctrl+Y to redo.</p>
    <Intable
      class='h-50vh'
      columns={cols}
      onColumnsChange={v => replaceArray(cols, v)}
      data={data}
      onDataChange={v => replaceArray(data, v)}
      index
      border
      stickyHeader
      size='small'
      plugins={[HistoryPlugin]}
    />
  </div>
)
