import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { HistoryPlugin } from '../../../packages/intable/src/plugins/HistoryPlugin'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(5, { editable: true }))
const [data, setData] = createSignal(makeData(15, 5))

/**
 * Edit cells then press Ctrl+Z to undo, Ctrl+Y to redo.
 * HistoryPlugin must be added manually.
 */
export default () => (
  <div>
    <p class='text-sm c-gray mb-2'>Edit a cell, then Ctrl+Z to undo, Ctrl+Y to redo.</p>
    <Intable
      class='h-50vh'
      columns={cols()}
      onColumnsChange={setCols}
      data={data()}
      onDataChange={setData}
      index
      border
      stickyHeader
      size='small'
      plugins={[HistoryPlugin]}
    />
  </div>
)
